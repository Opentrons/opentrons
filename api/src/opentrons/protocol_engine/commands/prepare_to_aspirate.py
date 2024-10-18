"""Prepare to aspirate command request, result, and implementation models."""

from __future__ import annotations
from opentrons_shared_data.errors.exceptions import PipetteOverpressureError
from pydantic import BaseModel
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from .pipetting_common import (
    OverpressureError,
    PipetteIdMixin,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    DefinedErrorData,
    SuccessData,
)
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover
    from ..resources import ModelUtils


PrepareToAspirateCommandType = Literal["prepareToAspirate"]


class PrepareToAspirateParams(PipetteIdMixin):
    """Parameters required to prepare a specific pipette for aspiration."""

    pass


class PrepareToAspirateResult(BaseModel):
    """Result data from execution of an PrepareToAspirate command."""

    pass


_ExecuteReturn = Union[
    SuccessData[PrepareToAspirateResult, None],
    DefinedErrorData[OverpressureError],
]


class PrepareToAspirateImplementation(
    AbstractCommandImpl[PrepareToAspirateParams, _ExecuteReturn]
):
    """Prepare for aspirate command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._pipetting_handler = pipetting
        self._model_utils = model_utils
        self._gantry_mover = gantry_mover

    async def execute(self, params: PrepareToAspirateParams) -> _ExecuteReturn:
        """Prepare the pipette to aspirate."""
        current_position = await self._gantry_mover.get_position(params.pipetteId)
        try:
            await self._pipetting_handler.prepare_for_aspirate(
                pipette_id=params.pipetteId,
            )
        except PipetteOverpressureError as e:
            return DefinedErrorData(
                public=OverpressureError(
                    id=self._model_utils.generate_id(),
                    createdAt=self._model_utils.get_timestamp(),
                    wrappedErrors=[
                        ErrorOccurrence.from_failed(
                            id=self._model_utils.generate_id(),
                            createdAt=self._model_utils.get_timestamp(),
                            error=e,
                        )
                    ],
                    errorInfo=(
                        {
                            "retryLocation": (
                                current_position.x,
                                current_position.y,
                                current_position.z,
                            )
                        }
                    ),
                ),
            )
        else:
            return SuccessData(public=PrepareToAspirateResult(), private=None)


class PrepareToAspirate(
    BaseCommand[PrepareToAspirateParams, PrepareToAspirateResult, ErrorOccurrence]
):
    """Prepare for aspirate command model."""

    commandType: PrepareToAspirateCommandType = "prepareToAspirate"
    params: PrepareToAspirateParams
    result: Optional[PrepareToAspirateResult]

    _ImplementationCls: Type[
        PrepareToAspirateImplementation
    ] = PrepareToAspirateImplementation


class PrepareToAspirateCreate(BaseCommandCreate[PrepareToAspirateParams]):
    """Prepare for aspirate command creation request model."""

    commandType: PrepareToAspirateCommandType = "prepareToAspirate"
    params: PrepareToAspirateParams

    _CommandCls: Type[PrepareToAspirate] = PrepareToAspirate
