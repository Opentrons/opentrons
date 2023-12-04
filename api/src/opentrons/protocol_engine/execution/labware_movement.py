"""Labware movement command handling."""
from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from opentrons.types import Point

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.motion_planning import get_gripper_labware_movement_waypoints

from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.resources.ot3_validation import ensure_ot3_hardware

from .thermocycler_movement_flagger import ThermocyclerMovementFlagger
from .heater_shaker_movement_flagger import HeaterShakerMovementFlagger
from .thermocycler_plate_lifter import ThermocyclerPlateLifter

from ..errors import (
    GripperNotAttachedError,
    LabwareMovementNotAllowedError,
    ThermocyclerNotOpenError,
    HeaterShakerLabwareLatchNotOpenError,
    CannotPerformGripperAction,
)

from ..types import (
    OnLabwareLocation,
    LabwareLocation,
    LabwareMovementOffsetData,
    OnDeckLabwareLocation,
)

if TYPE_CHECKING:
    from opentrons.protocol_engine.execution import EquipmentHandler, MovementHandler


# TODO (spp, 2022-10-20): name this GripperMovementHandler if it doesn't handle
#  any non-gripper implementations
class LabwareMovementHandler:
    """Implementation logic for labware movement."""

    _hardware_api: HardwareControlAPI
    _state_store: StateStore
    _movement: MovementHandler
    _equipment: EquipmentHandler

    def __init__(
        self,
        hardware_api: HardwareControlAPI,
        state_store: StateStore,
        equipment: EquipmentHandler,
        movement: MovementHandler,
        thermocycler_plate_lifter: Optional[ThermocyclerPlateLifter] = None,
        thermocycler_movement_flagger: Optional[ThermocyclerMovementFlagger] = None,
        heater_shaker_movement_flagger: Optional[HeaterShakerMovementFlagger] = None,
    ) -> None:
        """Initialize a LabwareMovementHandler instance."""
        self._hardware_api = hardware_api
        self._state_store = state_store
        self._thermocycler_plate_lifter = (
            thermocycler_plate_lifter
            or ThermocyclerPlateLifter(
                state_store=self._state_store,
                equipment=equipment,
                movement=movement,
            )
        )
        self._tc_movement_flagger = (
            thermocycler_movement_flagger
            or ThermocyclerMovementFlagger(
                state_store=self._state_store, hardware_api=self._hardware_api
            )
        )
        self._hs_movement_flagger = (
            heater_shaker_movement_flagger
            or HeaterShakerMovementFlagger(
                state_store=self._state_store, hardware_api=self._hardware_api
            )
        )

    async def move_labware_with_gripper(
        self,
        labware_id: str,
        current_location: OnDeckLabwareLocation,
        new_location: OnDeckLabwareLocation,
        user_offset_data: LabwareMovementOffsetData,
        post_drop_slide_offset: Optional[Point],
    ) -> None:
        """Move a loaded labware from one location to another using gripper."""
        use_virtual_gripper = self._state_store.config.use_virtual_gripper
        if use_virtual_gripper:
            return
        ot3api = ensure_ot3_hardware(
            hardware_api=self._hardware_api,
            error_msg="Gripper is only available on Opentrons Flex",
        )

        if not ot3api.has_gripper():
            raise GripperNotAttachedError(
                "No gripper found for performing labware movements."
            )
        if not ot3api._gripper_handler.is_ready_for_jaw_home():
            raise CannotPerformGripperAction(
                "Cannot pick up labware when gripper is already gripping."
            )

        gripper_mount = OT3Mount.GRIPPER

        # Retract all mounts
        await ot3api.home(axes=[Axis.Z_L, Axis.Z_R, Axis.Z_G])
        gripper_homed_position = await ot3api.gantry_position(mount=gripper_mount)

        async with self._thermocycler_plate_lifter.lift_plate_for_labware_movement(
            labware_location=current_location
        ):
            final_offsets = (
                self._state_store.geometry.get_final_labware_movement_offset_vectors(
                    from_location=current_location,
                    to_location=new_location,
                    additional_offset_vector=user_offset_data,
                )
            )
            from_labware_center = self._state_store.geometry.get_labware_grip_point(
                labware_id=labware_id, location=current_location
            )
            to_labware_center = self._state_store.geometry.get_labware_grip_point(
                labware_id=labware_id, location=new_location
            )
            movement_waypoints = get_gripper_labware_movement_waypoints(
                from_labware_center=from_labware_center,
                to_labware_center=to_labware_center,
                gripper_home_z=gripper_homed_position.z,
                offset_data=final_offsets,
                post_drop_slide_offset=post_drop_slide_offset,
            )
            labware_grip_force = self._state_store.labware.get_grip_force(labware_id)

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
                else:
                    await ot3api.grip(force_newtons=labware_grip_force)
                await ot3api.move_to(
                    mount=gripper_mount, abs_position=waypoint_data.position
                )

            # this makes sure gripper jaw is closed between two move labware calls
            await ot3api.idle_gripper()

    async def ensure_movement_not_obstructed_by_module(
        self, labware_id: str, new_location: LabwareLocation
    ) -> None:
        """Ensure that the labware movement is not obstructed by a parent module.

        Raises: LabwareMovementNotAllowedError if either current location or
        new location is a module that is in a state that prevents the labware from
        being moved (either manually or using gripper).
        """
        current_parent = self._state_store.labware.get_parent_location(
            labware_id=labware_id
        )
        if isinstance(new_location, OnLabwareLocation):
            new_location = self._state_store.labware.get_parent_location(
                labware_id=new_location.labwareId
            )
        for parent in (current_parent, new_location):
            try:
                await self._tc_movement_flagger.raise_if_labware_in_non_open_thermocycler(
                    labware_parent=parent
                )
                await self._hs_movement_flagger.raise_if_labware_latched_on_heater_shaker(
                    labware_parent=parent
                )
            except ThermocyclerNotOpenError:
                raise LabwareMovementNotAllowedError(
                    "Cannot move labware to or from a Thermocycler with its lid closed."
                )
            except HeaterShakerLabwareLatchNotOpenError:
                raise LabwareMovementNotAllowedError(
                    "Cannot move labware to or from a Heater-Shaker"
                    " with its labware latch closed."
                )
