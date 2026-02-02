"""Place labware payload, result, and implementaiton."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Type

from pydantic import BaseModel, Field
from typing_extensions import Literal

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.labware.types import LabwareUri

from ...errors.error_occurrence import ErrorOccurrence
from ...resources import ensure_ot3_hardware
from ...types import (
    DeckSlotLocation,
    GripperMoveType,
    ModuleModel,
    OnDeckLabwareLocation,
)
from ..command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData
from opentrons.hardware_control import HardwareControlAPI, OT3HardwareControlAPI
from opentrons.hardware_control.types import Axis, OT3Mount
from opentrons.motion_planning.waypoints import get_gripper_labware_placement_waypoints
from opentrons.protocol_engine.errors.exceptions import (
    CannotPerformGripperAction,
    GripperNotAttachedError,
)

if TYPE_CHECKING:
    from ...execution.equipment import EquipmentHandler
    from ...state.state import StateView


UnsafePlaceLabwareCommandType = Literal["unsafe/placeLabware"]


class UnsafePlaceLabwareParams(BaseModel):
    """Payload required for an UnsafePlaceLabware command."""

    labwareURI: str = Field(..., description="Labware URI for labware.")
    location: OnDeckLabwareLocation = Field(
        ..., description="Where to place the labware."
    )


class UnsafePlaceLabwareResult(BaseModel):
    """Result data from the execution of an UnsafePlaceLabware command."""


class UnsafePlaceLabwareImplementation(
    AbstractCommandImpl[
        UnsafePlaceLabwareParams,
        SuccessData[UnsafePlaceLabwareResult],
    ]
):
    """The UnsafePlaceLabware command implementation."""

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_view: StateView,
        equipment: EquipmentHandler,
        **kwargs: object,
    ) -> None:
        self._hardware_api = hardware_api
        self._state_view = state_view
        self._equipment = equipment

    async def execute(
        self, params: UnsafePlaceLabwareParams
    ) -> SuccessData[UnsafePlaceLabwareResult]:
        """Place Labware.

        This command is used only when the gripper is in the middle of moving
        labware but is interrupted before completing the move. (i.e., the e-stop
        is pressed, get into error recovery, etc).

        Unlike the `moveLabware` command, where you pick a source and destination
        location, this command takes the labwareURI of the labware to be moved
        and location to move it to.

        """
        ot3api = ensure_ot3_hardware(self._hardware_api)
        if not ot3api.has_gripper():
            raise GripperNotAttachedError("No gripper found to perform labware place.")

        if ot3api.gripper_jaw_can_home():
            raise CannotPerformGripperAction(
                "Cannot place labware when gripper is not gripping."
            )

        location = self._state_view.geometry.ensure_valid_gripper_location(
            params.location,
        )

        definition = self._state_view.labware.get_definition_by_uri(
            # todo(mm, 2024-11-07): This is an unsafe cast from untrusted input.
            # We need a str -> LabwareUri parse/validate function.
            LabwareUri(params.labwareURI)
        )

        if isinstance(params.location, DeckSlotLocation):
            self._state_view.addressable_areas.raise_if_area_not_in_deck_configuration(
                params.location.slotName.id
            )

        # This is an absorbance reader, move the lid to its dock (staging area).
        if isinstance(location, DeckSlotLocation):
            module = self._state_view.modules.get_by_slot(location.slotName)
            if module and module.model == ModuleModel.ABSORBANCE_READER_V1:
                location = self._state_view.modules.absorbance_reader_dock_location(
                    module.id
                )

        # NOTE: When the estop is pressed, the gantry loses position, lets use
        # the encoders to sync position.
        # Ideally, we'd do a full home, but this command is used when
        # the gripper is holding the plate reader, and a full home would
        # bang it into the right window.
        await ot3api.home(axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G])
        await ot3api.engage_axes([Axis.X, Axis.Y])
        await ot3api.update_axis_position_estimations([Axis.X, Axis.Y])

        # Place the labware down
        await self._start_movement(ot3api, definition, location)

        return SuccessData(public=UnsafePlaceLabwareResult())

    async def _start_movement(
        self,
        ot3api: OT3HardwareControlAPI,
        labware_definition: LabwareDefinition,
        location: OnDeckLabwareLocation,
    ) -> None:
        gripper_homed_position = await ot3api.gantry_position(
            mount=OT3Mount.GRIPPER,
            refresh=True,
        )

        to_labware_center = self._state_view.geometry.get_labware_grip_point(
            labware_definition=labware_definition,
            location=location,
            move_type=GripperMoveType.DROP_LABWARE,
            user_additional_offset=None,
        )

        movement_waypoints = get_gripper_labware_placement_waypoints(
            to_labware_center=to_labware_center,
            gripper_home_z=gripper_homed_position.z,
        )

        # start movement
        for waypoint_data in movement_waypoints:
            if waypoint_data.jaw_open:
                if waypoint_data.dropping:
                    # This `disengage_axes` step is important in order to engage
                    # the electronic brake on the Z axis of the gripper. The brake
                    # has a stronger holding force on the axis than the hold current,
                    # and prevents the axis from spuriously dropping when  e.g. the notch
                    # on the side of a falling tiprack catches the jaw.
                    await ot3api.disengage_axes([Axis.Z_G])
                await ot3api.ungrip()
                if waypoint_data.dropping:
                    # We lost the position estimation after disengaging the axis, so
                    # it is necessary to home it next
                    await ot3api.home_z(OT3Mount.GRIPPER)
            await ot3api.move_to(
                mount=OT3Mount.GRIPPER, abs_position=waypoint_data.position
            )


class UnsafePlaceLabware(
    BaseCommand[UnsafePlaceLabwareParams, UnsafePlaceLabwareResult, ErrorOccurrence]
):
    """UnsafePlaceLabware command model."""

    commandType: UnsafePlaceLabwareCommandType = "unsafe/placeLabware"
    params: UnsafePlaceLabwareParams
    result: Optional[UnsafePlaceLabwareResult] = None

    _ImplementationCls: Type[UnsafePlaceLabwareImplementation] = (
        UnsafePlaceLabwareImplementation
    )


class UnsafePlaceLabwareCreate(BaseCommandCreate[UnsafePlaceLabwareParams]):
    """UnsafePlaceLabware command request model."""

    commandType: UnsafePlaceLabwareCommandType = "unsafe/placeLabware"
    params: UnsafePlaceLabwareParams

    _CommandCls: Type[UnsafePlaceLabware] = UnsafePlaceLabware
