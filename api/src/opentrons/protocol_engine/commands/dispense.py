"""Dispense command request, result, and implementation models."""
from __future__ import annotations
from typing import TYPE_CHECKING, Optional, Type, Union
from typing_extensions import Literal

from opentrons_shared_data.errors.exceptions import PipetteOverpressureError

from pydantic import Field

from ..types import DeckPoint
from ..state.update_types import StateUpdate
from .pipetting_common import (
    PipetteIdMixin,
    DispenseVolumeMixin,
    FlowRateMixin,
    LiquidHandlingWellLocationMixin,
    BaseLiquidHandlingResult,
    DestinationPositionResult,
    OverpressureError,
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
    from ..state.state import StateView


DispenseCommandType = Literal["dispense"]


class DispenseParams(
    PipetteIdMixin, DispenseVolumeMixin, FlowRateMixin, LiquidHandlingWellLocationMixin
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
    DefinedErrorData[OverpressureError],
]


class DispenseImplementation(AbstractCommandImpl[DispenseParams, _ExecuteReturn]):
    """Dispense command implementation."""

    def __init__(
        self,
        state_view: StateView,
        movement: MovementHandler,
        pipetting: PipettingHandler,
        model_utils: ModelUtils,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._movement = movement
        self._pipetting = pipetting
        self._model_utils = model_utils

    async def execute(self, params: DispenseParams) -> _ExecuteReturn:
        """Move to and dispense to the requested well."""
        state_update = StateUpdate()
        well_location = params.wellLocation
        labware_id = params.labwareId
        well_name = params.wellName
        volume = params.volume

        # TODO(pbm, 10-15-24): call self._state_view.geometry.validate_dispense_volume_into_well()

        position = await self._movement.move_to_well(
            pipette_id=params.pipetteId,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        deck_point = DeckPoint.construct(x=position.x, y=position.y, z=position.z)
        state_update.set_pipette_location(
            pipette_id=params.pipetteId,
            new_labware_id=labware_id,
            new_well_name=well_name,
            new_deck_point=deck_point,
        )

        try:
            volume = await self._pipetting.dispense_in_place(
                pipette_id=params.pipetteId,
                volume=volume,
                flow_rate=params.flowRate,
                push_out=params.pushOut,
            )
        except PipetteOverpressureError as e:
            # can we get dispensed_amount_prior_to_error? If not, can we assume no liquid was added to well? Ask Ryan
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
                state_update=state_update,
            )
        else:
            state_update.set_liquid_operated(
                labware_id=labware_id,
                well_name=well_name,
                volume=volume,
            )
            return SuccessData(
                public=DispenseResult(volume=volume, position=deck_point),
                private=None,
                state_update=state_update,
            )


class Dispense(BaseCommand[DispenseParams, DispenseResult, OverpressureError]):
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
