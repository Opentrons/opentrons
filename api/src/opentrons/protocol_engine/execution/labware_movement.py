"""Labware movement command handling."""
from typing import Optional, Union, List

from opentrons.types import Point
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

from ..errors import GripperNotAttachedError, UnsupportedLabwareMovementError
from ..types import (
    DeckSlotLocation,
    ModuleLocation,
    LabwareLocation,
    LabwareOffsetVector,
)


# TODO: remove once hardware control is able to calibrate & handle the offsets
GRIPPER_OFFSET = Point(0.0, 1.0, 0.0)
GRIP_FORCE = 20  # Newtons


# TODO (spp, 2022-10-20): name this GripperMovementHandler if it doesn't handle
#  any non-gripper implementations
class LabwareMovementHandler:
    """Implementation logic for labware movement."""

    _hardware_api: HardwareControlAPI
    _state_store: StateStore
    _model_utils: ModelUtils

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_store: StateStore,
        model_utils: Optional[ModelUtils] = None,
    ) -> None:
        """Initialize a LabwareMovementHandler instance."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._model_utils = model_utils or ModelUtils()

    async def move_labware_with_gripper(
        self,
        labware_id: str,
        current_location: Union[DeckSlotLocation, ModuleLocation],
        new_location: Union[DeckSlotLocation, ModuleLocation],
        new_offset_id: Optional[str],
    ) -> None:
        """Move a loaded labware from one location to another."""
        ot3api = ensure_ot3_hardware(
            hardware_api=self._hardware_api,
            error_msg="Gripper is only available on the OT-3",
        )

        if not ot3api.has_gripper():
            raise GripperNotAttachedError(
                "No gripper found for performing labware movements."
            )

        gripper_mount = OT3Mount.GRIPPER

        # Retract all mounts
        await ot3api.home(axes=[OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.Z_G])
        # TODO: reset well location cache upon completion of command execution
        await ot3api.home_gripper_jaw()

        gripper_homed_position = await ot3api.gantry_position(mount=gripper_mount)
        waypoints_to_labware = self._get_gripper_movement_waypoints(
            labware_id=labware_id,
            location=current_location,
            current_position=await ot3api.gantry_position(mount=gripper_mount),
            gripper_home_z=gripper_homed_position.z,
            labware_offset_vector=self._state_store.labware.get_labware_offset_vector(
                labware_id
            ),
        )
        for waypoint in waypoints_to_labware:
            await ot3api.move_to(mount=gripper_mount, abs_position=waypoint)

        await ot3api.grip(force_newtons=GRIP_FORCE)

        new_labware_offset = (
            self._state_store.labware.get_labware_offset(new_offset_id).vector
            if new_offset_id
            else None
        )
        waypoints_to_new_location = self._get_gripper_movement_waypoints(
            labware_id=labware_id,
            location=new_location,
            current_position=waypoints_to_labware[-1],
            gripper_home_z=gripper_homed_position.z,
            labware_offset_vector=new_labware_offset,
        )
        for waypoint in waypoints_to_new_location:
            await ot3api.move_to(mount=gripper_mount, abs_position=waypoint)

        await ot3api.ungrip()
        await ot3api.move_to(
            mount=OT3Mount.GRIPPER,
            abs_position=Point(
                waypoints_to_new_location[-1].x,
                waypoints_to_new_location[-1].y,
                gripper_homed_position.z,
            ),
        )

    # TODO (spp, 2022-10-19): Move this to motion planning and
    #  test waypoints generation in isolation.
    def _get_gripper_movement_waypoints(
        self,
        labware_id: str,
        location: Union[DeckSlotLocation, ModuleLocation],
        current_position: Point,
        gripper_home_z: float,
        labware_offset_vector: Optional[LabwareOffsetVector],
    ) -> List[Point]:
        """Get waypoints for gripper to move to a specified location."""
        # TODO: remove this after support for module locations is added
        if not isinstance(location, DeckSlotLocation):
            raise NotImplementedError(
                "Moving labware to & from modules with a gripper is not implemented yet."
            )

        # Keeping grip height as half of overall height of labware
        grip_height = (
            self._state_store.labware.get_dimensions(labware_id=labware_id).z / 2
        )
        slot_loc = (
            self._state_store.labware.get_slot_center_position(location.slotName)
            + GRIPPER_OFFSET
        )
        labware_offset_vector = labware_offset_vector or LabwareOffsetVector(
            x=0, y=0, z=0
        )
        waypoints: List[Point] = [
            Point(current_position.x, current_position.y, gripper_home_z),
            Point(
                slot_loc.x + labware_offset_vector.x,
                slot_loc.y + labware_offset_vector.y,
                gripper_home_z,
            ),
            Point(
                slot_loc.x + labware_offset_vector.x,
                slot_loc.y + labware_offset_vector.y,
                grip_height + labware_offset_vector.z,
            ),
        ]
        return waypoints

    # TODO (spp, 2022-10-20): move to labware view
    @staticmethod
    def ensure_valid_gripper_location(
        location: LabwareLocation,
    ) -> Union[DeckSlotLocation, ModuleLocation]:
        """Ensure valid on-deck location for gripper, otherwise raise error."""
        if not isinstance(location, (DeckSlotLocation, ModuleLocation)):
            raise UnsupportedLabwareMovementError(
                "Off-deck labware movements are not supported using the gripper."
            )
        return location
