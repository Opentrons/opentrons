"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from pydantic import Field

from ..types import DeckPoint
from .pipetting_common import (
    PipetteIdMixin,
    DispenseVolumeMixin,
    FlowRateMixin,
    WellLocationMixin,
    BaseLiquidHandlingResult,
    DestinationPositionResult,
    OverpressureError,
    OverpressureErrorInternalData,
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
    from ..execution import MovementHandler, PipettingHandler
    from ..resources import ModelUtils


DispenseCommandType = Literal["dispense"]


class DispenseParams(
    PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin, WellLocationMixin
):
    """Payload required to dispense to a specific well."""

    pushOut: Optional[float] = Field(
        None,
        description="push the plunger a small amount farther than necessary for accurate low-volume dispensing",
    )


class DispenseResult(BaseLiquidHandlingResult, DestinationPositionResult):
    """Result data from the execution of a Dispense command."""

    pass


_ExecuteReturn = Union[
    SuccessData[DispenseResult, None],
    DefinedErrorData[OverpressureError, OverpressureErrorInternalData],
]


class DispenseImplementation(AbstractCommandImpl[DispenseParams, _ExecuteReturn]):
    """Dispense command implementation."""

    def __init__(
        self,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._movement = movement
        self._pipetting = pipetting
        self._model_utils = model_utils

    async def execute(self, params: DispenseParams) -> _ExecuteReturn:
        """Move to and dispense to the requested well."""
        position = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=params.labwareId,
            well_name=params.wellName,
            well_location=params.wellLocation,
        )
        try:
            volume = await self._pipetting.dispense_in_place(
                pipette_id=params.pipetteId,
                volume=params.volume,
                flow_rate=params.flowRate,
                push_out=params.pushOut,
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
                    errorInfo={"retryLocation": (position.x, position.y, position.z)},
                ),
                private=OverpressureErrorInternalData(
                    position=DeckPoint.construct(
                        x=position.x, y=position.y, z=position.z
                    )
                ),
            )
        else:
            return SuccessData(
                public=DispenseResult(
                    volume=volume,
                    position=DeckPoint(x=position.x, y=position.y, z=position.z),
                ),
                private=None,
            )


class Dispense(BaseCommand[DispenseParams, DispenseResult, ErrorOccurrence]):
    """Dispense command model."""

    commandType: DispenseCommandType = "dispense"
    params: DispenseParams
    result: Optional[DispenseResult]

    _ImplementationCls: Type[DispenseImplementation] = DispenseImplementation


class DispenseCreate(BaseCommandCreate[DispenseParams]):
    """Create dispense command request model."""

    commandType: DispenseCommandType = "dispense"
    params: DispenseParams

    _CommandCls: Type[Dispense] = Dispense
