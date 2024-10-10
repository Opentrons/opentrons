"""Touch tip command request, result, and implementation models."""
from __future__ import annotations
from pydantic import Field
from typing import TYPE_CHECKING, Optional, Type
from typing_extensions import Literal

from opentrons.protocol_engine.state import update_types

from ..errors import TouchTipDisabledError, LabwareIsTipRackError
from ..types import DeckPoint
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from ..errors.error_occurrence import ErrorOccurrence
from .pipetting_common import (
    PipetteIdMixin,
    WellLocationMixin,
    DestinationPositionResult,
)

if TYPE_CHECKING:
    from ..execution import MovementHandler, GantryMover
    from ..state.state import StateView


TouchTipCommandType = Literal["touchTip"]


class TouchTipParams(PipetteIdMixin, WellLocationMixin):
    """Payload needed to touch a pipette tip the sides of a specific well."""

    radius: float = Field(
        1.0,
        description=(
            "The proportion of the target well's radius the pipette tip will move towards."
        ),
    )

    speed: Optional[float] = Field(
        None,
        description=(
            "Override the travel speed in mm/s."
            " This controls the straight linear speed of motion."
        ),
    )


class TouchTipResult(DestinationPositionResult):
    """Result data from the execution of a TouchTip."""

    pass


class TouchTipImplementation(
    AbstractCommandImpl[TouchTipParams, SuccessData[TouchTipResult, None]]
):
    """Touch tip command implementation."""

    def __init__(
        self,
        state_view: StateView,
        movement: MovementHandler,
        gantry_mover: GantryMover,
        **kwargs: object,
    ) -> None:
        self._state_view = state_view
        self._movement = movement
        self._gantry_mover = gantry_mover

    async def execute(
        self, params: TouchTipParams
    ) -> SuccessData[TouchTipResult, None]:
        """Touch tip to sides of a well using the requested pipette."""
        pipette_id = params.pipetteId
        labware_id = params.labwareId
        well_name = params.wellName

        state_update = update_types.StateUpdate()

        if self._state_view.labware.get_has_quirk(labware_id, "touchTipDisabled"):
            raise TouchTipDisabledError(
                f"Touch tip not allowed on labware {labware_id}"
            )

        if self._state_view.labware.is_tiprack(labware_id):
            raise LabwareIsTipRackError("Cannot touch tip on tip rack")

        center_point = await self._movement.move_to_well(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=params.wellLocation,
        )

        touch_speed = self._state_view.pipettes.get_movement_speed(
            pipette_id, params.speed
        )

        touch_waypoints = self._state_view.motion.get_touch_tip_waypoints(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            radius=params.radius,
            center_point=center_point,
        )

        final_point = await self._gantry_mover.move_to(
            pipette_id=pipette_id,
            waypoints=touch_waypoints,
            speed=touch_speed,
        )
        final_deck_point = DeckPoint.construct(
            x=final_point.x, y=final_point.y, z=final_point.z
        )
        state_update.set_pipette_location(
            pipette_id=pipette_id,
            new_labware_id=labware_id,
            new_well_name=well_name,
            new_deck_point=final_deck_point,
        )

        return SuccessData(
            public=TouchTipResult(position=final_deck_point),
            private=None,
            state_update=state_update,
        )


class TouchTip(BaseCommand[TouchTipParams, TouchTipResult, ErrorOccurrence]):
    """Touch up tip command model."""

    commandType: TouchTipCommandType = "touchTip"
    params: TouchTipParams
    result: Optional[TouchTipResult]

    _ImplementationCls: Type[TouchTipImplementation] = TouchTipImplementation


class TouchTipCreate(BaseCommandCreate[TouchTipParams]):
    """Touch tip command creation request model."""

    commandType: TouchTipCommandType = "touchTip"
    params: TouchTipParams

    _CommandCls: Type[TouchTip] = TouchTip
