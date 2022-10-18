"""Labware movement command handling."""
from typing import Optional, Union, List

from opentrons.types import Point
from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, OT3Axis
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import StateStore

from ..errors import (
    GripperNotAttachedError,
    HardwareNotSupportedError,
)

from ..types import (
    DeckSlotLocation,
    ModuleLocation,
)


# TODO: remove once hardware control is able to calibrate & handle the offsets
GRIPPER_OFFSET = Point(0.0, 1.0, 0.0)
GRIP_FORCE = 20  # Newtons


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
    ) -> None:
        """Move a loaded labware from one location to another."""
        if not isinstance(self._hardware_api, OT3API):
            raise HardwareNotSupportedError("Gripper is only available on the OT3")

        if self._hardware_api.attached_gripper is None:
            raise GripperNotAttachedError(
                "No gripper found for performing labware movements."
            )

        gripper_mount = OT3Mount.GRIPPER

        # Retract all mounts
        await self._hardware_api.home(axes=[OT3Axis.Z_L, OT3Axis.Z_R, OT3Axis.Z_G])
        # TODO: reset well location cache upon completion of command execution
        await self._hardware_api.home_gripper_jaw()

        gripper_homed_position = await self._hardware_api.gantry_position(
            mount=gripper_mount
        )
        waypoints_to_labware = self._get_gripper_movement_waypoints(
            labware_id=labware_id,
            location=current_location,
            current_position=await self._hardware_api.gantry_position(
                mount=gripper_mount
            ),
            gripper_home_z=gripper_homed_position.z,
        )
        for waypoint in waypoints_to_labware:
            await self._hardware_api.move_to(mount=gripper_mount, abs_position=waypoint)

        await self._hardware_api.grip(force_newtons=GRIP_FORCE)

        waypoints_to_new_location = self._get_gripper_movement_waypoints(
            labware_id=labware_id,
            location=new_location,
            current_position=waypoints_to_labware[-1],
            gripper_home_z=gripper_homed_position.z,
        )
        for waypoint in waypoints_to_new_location:
            await self._hardware_api.move_to(mount=gripper_mount, abs_position=waypoint)

        await self._hardware_api.ungrip()
        await self._hardware_api.move_to(
            mount=OT3Mount.GRIPPER,
            abs_position=Point(
                waypoints_to_new_location[-1].x,
                waypoints_to_new_location[-1].y,
                gripper_homed_position.z,
            ),
        )

    def _get_gripper_movement_waypoints(
        self,
        labware_id: str,
        location: Union[DeckSlotLocation, ModuleLocation],
        current_position: Point,
        gripper_home_z: float,
    ) -> List[Point]:
        """Get waypoints for gripper to move to a specified location."""
        # TODO: remove this after support for module locations is added
        assert isinstance(
            location, DeckSlotLocation
        ), "Moving labware to & from modules with a gripper is not implemented yet."

        # Keeping grip height as half of overall height of labware
        grip_height = (
            self._state_store.labware.get_dimensions(labware_id=labware_id).z / 2
        )
        slot_loc = (
            self._state_store.labware.get_slot_center_position(location.slotName)
            + GRIPPER_OFFSET
        )
        waypoints: List[Point] = [
            Point(current_position.x, current_position.y, gripper_home_z),
            Point(slot_loc.x, slot_loc.y, gripper_home_z),
            Point(slot_loc.x, slot_loc.y, grip_height),
        ]
        return waypoints
