"""Motion state store and getters."""
from dataclasses import dataclass
from typing import List, Optional

from opentrons.types import MountType, Point
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning.adjacent_slots_getters import (
    get_east_west_slots,
    get_adjacent_slots,
)
from opentrons import motion_planning

from . import move_types
from .. import errors
from ..types import WellLocation, CurrentWell, MotorAxis
from .config import Config
from .labware import LabwareView
from .pipettes import PipetteView
from .geometry import GeometryView
from .modules import ModuleView
from .module_substates import HeaterShakerModuleId


@dataclass(frozen=True)
class PipetteLocationData:
    """Pipette data used to determine the current gantry position."""

    mount: MountType
    critical_point: Optional[CriticalPoint]


class MotionView:
    """Complete motion planning state and getter methods."""

    def __init__(
        self,
        config: Config,
        labware_view: LabwareView,
        pipette_view: PipetteView,
        geometry_view: GeometryView,
        module_view: ModuleView,
    ) -> None:
        """Initialize a MotionState instance."""
        self._config = config
        self._labware = labware_view
        self._pipettes = pipette_view
        self._geometry = geometry_view
        self._modules = module_view

    def get_pipette_location(
        self,
        pipette_id: str,
        current_well: Optional[CurrentWell] = None,
    ) -> PipetteLocationData:
        """Get the critical point of a pipette given the current location."""
        current_well = current_well or self._pipettes.get_current_well()
        pipette_data = self._pipettes.get(pipette_id)

        mount = pipette_data.mount
        critical_point = None

        # if the pipette was last used to move to a labware that requires
        # centering, set the critical point to XY_CENTER
        if (
            current_well is not None
            and current_well.pipette_id == pipette_id
            and self._labware.get_has_quirk(
                current_well.labware_id,
                "centerMultichannelOnWells",
            )
        ):
            critical_point = CriticalPoint.XY_CENTER
        return PipetteLocationData(mount=mount, critical_point=critical_point)

    def get_movement_waypoints_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation],
        origin: Point,
        origin_cp: Optional[CriticalPoint],
        max_travel_z: float,
        current_well: Optional[CurrentWell] = None,
        force_direct: bool = False,
        minimum_z_height: Optional[float] = None,
    ) -> List[motion_planning.Waypoint]:
        """Calculate waypoints to a destination that's specified as a well."""
        location = current_well or self._pipettes.get_current_well()
        center_destination = self._labware.get_has_quirk(
            labware_id,
            "centerMultichannelOnWells",
        )

        destination = self._geometry.get_well_position(
            labware_id,
            well_name,
            well_location,
        )
        destination_cp = CriticalPoint.XY_CENTER if center_destination else None

        move_type = move_types.get_move_type_to_well(
            pipette_id, labware_id, well_name, location, force_direct
        )
        min_travel_z = self._geometry.get_min_travel_z(
            pipette_id, labware_id, location, minimum_z_height
        )
        # TODO (spp, 11-29-2021): Should log some kind of warning that pipettes
        #  could crash onto the thermocycler if current well is not known.
        extra_waypoints = self._geometry.get_extra_waypoints(labware_id, location)

        try:
            return motion_planning.get_waypoints(
                move_type=move_type,
                origin=origin,
                origin_cp=origin_cp,
                dest=destination,
                dest_cp=destination_cp,
                min_travel_z=min_travel_z,
                max_travel_z=max_travel_z,
                xy_waypoints=extra_waypoints,
            )
        except motion_planning.MotionPlanningError as error:
            raise errors.FailedToPlanMoveError(str(error))

    def get_movement_waypoints_to_coords(
        self,
        origin: Point,
        dest: Point,
        max_travel_z: float,
        direct: bool,
        additional_min_travel_z: Optional[float],
    ) -> List[motion_planning.Waypoint]:
        """Calculate waypoints to a destination that's specified as deck coordinates.

        Args:
            origin: The start point of the movement.
            dest: The end point of the movement.
            max_travel_z: How high, in deck coordinates, the pipette can go.
                This should be measured at the bottom of whatever tip is currently
                attached (if any).
            direct: If True, move directly. If False, move in an arc.
            additional_min_travel_z: The minimum height to clear, if moving in an arc.
                Ignored if `direct` is True. If lower than the default height,
                the default is used; this can only increase the height, not decrease it.
        """
        all_labware_highest_z = self._geometry.get_all_labware_highest_z()
        if additional_min_travel_z is None:
            additional_min_travel_z = float("-inf")
        min_travel_z = max(all_labware_highest_z, additional_min_travel_z)

        move_type = (
            motion_planning.MoveType.DIRECT
            if direct
            else motion_planning.MoveType.GENERAL_ARC
        )

        try:
            return motion_planning.get_waypoints(
                origin=origin,
                dest=dest,
                min_travel_z=min_travel_z,
                max_travel_z=max_travel_z,
                move_type=move_type,
                origin_cp=None,
                dest_cp=None,
            )
        except motion_planning.MotionPlanningError as error:
            raise errors.FailedToPlanMoveError(str(error))

    def check_pipette_blocking_hs_latch(
        self, hs_module_id: HeaterShakerModuleId
    ) -> bool:
        """Check if pipette would block h/s latch from opening if it is east, west or on module."""
        pipette_blocking = True
        current_well = self._pipettes.get_current_well()
        if current_well is not None:
            pipette_deck_slot = self._geometry.get_ancestor_slot_name(
                current_well.labware_id
            ).as_int()
            hs_deck_slot = self._modules.get_location(hs_module_id).slotName.as_int()
            conflicting_slots = get_east_west_slots(hs_deck_slot) + [hs_deck_slot]
            pipette_blocking = pipette_deck_slot in conflicting_slots
        return pipette_blocking

    def check_pipette_blocking_hs_shaker(
        self, hs_module_id: HeaterShakerModuleId
    ) -> bool:
        """Check if pipette would block h/s latch from starting shake if it is adjacent or on module."""
        pipette_blocking = True
        current_well = self._pipettes.get_current_well()
        if current_well is not None:
            pipette_deck_slot = self._geometry.get_ancestor_slot_name(
                current_well.labware_id
            ).as_int()
            hs_deck_slot = self._modules.get_location(hs_module_id).slotName.as_int()
            conflicting_slots = get_adjacent_slots(hs_deck_slot) + [hs_deck_slot]
            pipette_blocking = pipette_deck_slot in conflicting_slots
        return pipette_blocking

    def get_touch_tip_waypoints(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        center_point: Point,
        radius: float = 1.0,
    ) -> List[motion_planning.Waypoint]:
        """Get a list of touch points for a touch tip operation."""
        mount = self._pipettes.get_mount(pipette_id)
        labware_slot = self._geometry.get_ancestor_slot_name(labware_id)
        next_to_module = self._modules.is_edge_move_unsafe(mount, labware_slot)
        edge_path_type = self._labware.get_edge_path_type(
            labware_id, well_name, mount, labware_slot, next_to_module
        )

        x_offset, y_offset = self._labware.get_well_radial_offsets(
            labware_id, well_name, radius
        )

        positions = move_types.get_edge_point_list(
            center_point, x_offset, y_offset, edge_path_type
        )

        critical_point = (
            CriticalPoint.XY_CENTER
            if self._labware.get_has_quirk(labware_id, "centerMultichannelOnWells")
            else None
        )

        return [
            motion_planning.Waypoint(position=p, critical_point=critical_point)
            for p in positions
        ]

    def get_robot_mount_axes(self) -> List[MotorAxis]:
        """Get a list of axes belonging to all mounts on the robot."""
        mount_axes = [MotorAxis.LEFT_Z, MotorAxis.RIGHT_Z]
        if self._config.robot_type == "OT-3 Standard":
            mount_axes.append(MotorAxis.EXTENSION_Z)
        return mount_axes
