"""Drop tip in place command request, result, and implementation models."""
from __future__ import annotations
from pydantic import Field, BaseModel
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)
from .pipetting_common import PipetteIdMixin, TipPhysicallyAttachedError
from ..errors.exceptions import TipAttachedError
from ..errors.error_occurrence import ErrorOccurrence
from ..resources.model_utils import ModelUtils
from ..state import update_types

if TYPE_CHECKING:
    from ..execution import TipHandler


DropTipInPlaceCommandType = Literal["dropTipInPlace"]


class DropTipInPlaceParams(PipetteIdMixin):
    """Payload required to drop a tip in place."""

    homeAfter: Optional[bool] = Field(
        None,
        description=(
            "Whether to home this pipette's plunger after dropping the tip."
            " You should normally leave this unspecified to let the robot choose"
            " a safe default depending on its hardware."
        ),
    )


class DropTipInPlaceResult(BaseModel):
    """Result data from the execution of a DropTipInPlace command."""

    pass


_ExecuteReturn = (
    SuccessData[DropTipInPlaceResult, None]
    | DefinedErrorData[TipPhysicallyAttachedError]
)


class DropTipInPlaceImplementation(
    AbstractCommandImpl[DropTipInPlaceParams, _ExecuteReturn]
):
    """Drop tip in place command implementation."""

    def __init__(
        self,
        tip_handler: TipHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._tip_handler = tip_handler
        self._model_utils = model_utils

    async def execute(self, params: DropTipInPlaceParams) -> _ExecuteReturn:
        """Drop a tip using the requested pipette."""
        state_update = update_types.StateUpdate()

        try:
            await self._tip_handler.drop_tip(
                pipette_id=params.pipetteId, home_after=params.homeAfter
            )
        except TipAttachedError as exception:
            state_update_if_false_positive = update_types.StateUpdate()
            state_update_if_false_positive.update_pipette_tip_state(
                pipette_id=params.pipetteId, tip_geometry=None
            )
            error = TipPhysicallyAttachedError(
                id=self._model_utils.generate_id(),
                createdAt=self._model_utils.get_timestamp(),
                wrappedErrors=[
                    ErrorOccurrence.from_failed(
                        id=self._model_utils.generate_id(),
                        createdAt=self._model_utils.get_timestamp(),
                        error=exception,
                    )
                ],
            )
            return DefinedErrorData(
                public=error,
                state_update=state_update,
                state_update_if_false_positive=state_update_if_false_positive,
            )
        else:
            state_update.update_pipette_tip_state(
                pipette_id=params.pipetteId, tip_geometry=None
            )
            return SuccessData(
                public=DropTipInPlaceResult(), private=None, state_update=state_update
            )


class DropTipInPlace(
    BaseCommand[DropTipInPlaceParams, DropTipInPlaceResult, ErrorOccurrence]
):
    """Drop tip in place command model."""

    commandType: DropTipInPlaceCommandType = "dropTipInPlace"
    params: DropTipInPlaceParams
    result: Optional[DropTipInPlaceResult]

    _ImplementationCls: Type[
        DropTipInPlaceImplementation
    ] = DropTipInPlaceImplementation


class DropTipInPlaceCreate(BaseCommandCreate[DropTipInPlaceParams]):
    """Drop tip in place command creation request model."""

    commandType: DropTipInPlaceCommandType = "dropTipInPlace"
    params: DropTipInPlaceParams

    _CommandCls: Type[DropTipInPlace] = DropTipInPlace
