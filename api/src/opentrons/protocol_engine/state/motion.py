"""Motion state store and getters."""
from dataclasses import dataclass
from typing import List, Optional

from opentrons.types import MountType, Point
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import (
    MoveType,
    Waypoint,
    MotionPlanningError,
    get_waypoints,
)

from .. import errors
from ..types import WellLocation
from .labware import LabwareView
from .pipettes import PipetteView, CurrentWell
from .geometry import GeometryView


@dataclass(frozen=True)
class PipetteLocationData:
    """Pipette data used to determine the current gantry position."""

    mount: MountType
    critical_point: Optional[CriticalPoint]


class MotionView:
    """Complete motion planning state and getter methods."""

    _labware: LabwareView
    _pipette: PipetteView
    _geometry: GeometryView

    def __init__(
        self,
        labware_view: LabwareView,
        pipette_view: PipetteView,
        geometry_view: GeometryView,
    ) -> None:
        """Initialize a MotionState instance."""
        self._labware = labware_view
        self._pipettes = pipette_view
        self._geometry = geometry_view

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

    def get_movement_waypoints(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: Optional[WellLocation],
        origin: Point,
        origin_cp: Optional[CriticalPoint],
        max_travel_z: float,
        current_well: Optional[CurrentWell] = None,
    ) -> List[Waypoint]:
        """Get the movement waypoints from an origin to a given location."""
        location = current_well or self._pipettes.get_current_well()
        center_dest = self._labware.get_has_quirk(
            labware_id,
            "centerMultichannelOnWells",
        )

        dest = self._geometry.get_well_position(
            labware_id,
            well_name,
            well_location,
        )
        dest_cp = CriticalPoint.XY_CENTER if center_dest else None

        if (
            location is not None
            and pipette_id == location.pipette_id
            and labware_id == location.labware_id
        ):
            move_type = (
                MoveType.IN_LABWARE_ARC
                if well_name != location.well_name
                else MoveType.DIRECT
            )
            min_travel_z = self._geometry.get_labware_highest_z(labware_id)
        else:
            move_type = MoveType.GENERAL_ARC
            min_travel_z = self._geometry.get_all_labware_highest_z()

        try:
            # TODO(mc, 2021-01-08): inject `get_waypoints` via constructor
            return get_waypoints(
                move_type=move_type,
                origin=origin,
                origin_cp=origin_cp,
                dest=dest,
                dest_cp=dest_cp,
                min_travel_z=min_travel_z,
                max_travel_z=max_travel_z,
                xy_waypoints=[],
            )
        except MotionPlanningError as error:
            raise errors.FailedToPlanMoveError(str(error))
