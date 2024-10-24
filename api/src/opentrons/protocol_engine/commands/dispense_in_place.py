"""Dispense-in-place command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal
from pydantic import Field

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from .pipetting_common import (
    PipetteIdMixin,
    DispenseVolumeMixin,
    FlowRateMixin,
    BaseLiquidHandlingResult,
    OverpressureError,
)
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
    DefinedErrorData,
)
from ..errors.error_occurrence import ErrorOccurrence

if TYPE_CHECKING:
    from ..execution import PipettingHandler, GantryMover
    from ..resources import ModelUtils


DispenseInPlaceCommandType = Literal["dispenseInPlace"]


class DispenseInPlaceParams(PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin):
    """Payload required to dispense in place."""

    pushOut: Optional[float] = Field(
        None,
        description="push the plunger a small amount farther than necessary for accurate low-volume dispensing",
    )


class DispenseInPlaceResult(BaseLiquidHandlingResult):
    """Result data from the execution of a DispenseInPlace command."""

    pass


_ExecuteReturn = Union[
    SuccessData[DispenseInPlaceResult, None],
    DefinedErrorData[OverpressureError],
]


class DispenseInPlaceImplementation(
    AbstractCommandImpl[DispenseInPlaceParams, _ExecuteReturn]
):
    """DispenseInPlace command implementation."""

    def __init__(
        self,
        pipetting: PipettingHandler,
        gantry_mover: GantryMover,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._pipetting = pipetting
        self._gantry_mover = gantry_mover
        self._model_utils = model_utils

    async def execute(self, params: DispenseInPlaceParams) -> _ExecuteReturn:
        """Dispense without moving the pipette."""
        try:
            current_position = await self._gantry_mover.get_position(params.pipetteId)
            volume = await self._pipetting.dispense_in_place(
                pipette_id=params.pipetteId,
                volume=params.volume,
                flow_rate=params.flowRate,
                push_out=params.pushOut,
            )
        except PipetteOverpressureError as e:
            # TODO(pbm, 10-24-24): if location is a well, get new tip and LiquidProbe in error recovery to reestablish well liquid level
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
            # if location is a well, update WellStore
            return SuccessData(
                public=DispenseInPlaceResult(volume=volume), private=None
            )


class DispenseInPlace(
    BaseCommand[DispenseInPlaceParams, DispenseInPlaceResult, OverpressureError]
):
    """DispenseInPlace command model."""

    commandType: DispenseInPlaceCommandType = "dispenseInPlace"
    params: DispenseInPlaceParams
    result: Optional[DispenseInPlaceResult]

    _ImplementationCls: Type[
        DispenseInPlaceImplementation
    ] = DispenseInPlaceImplementation


class DispenseInPlaceCreate(BaseCommandCreate[DispenseInPlaceParams]):
    """DispenseInPlace command request model."""

    commandType: DispenseInPlaceCommandType = "dispenseInPlace"
    params: DispenseInPlaceParams

    _CommandCls: Type[DispenseInPlace] = DispenseInPlace
