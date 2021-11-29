"""Motion state store and getters."""
from dataclasses import dataclass
from typing import List, Optional

from opentrons.types import MountType, Point, DeckSlotName
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import (
    MoveType,
    Waypoint,
    MotionPlanningError,
    get_waypoints,
)

from .. import errors
from ..types import (
    WellLocation,
    DeckSlotLocation,
    LabwareLocation,
    ModuleLocation,
    ModuleModel,
)
from .labware import LabwareView
from .pipettes import PipetteView, CurrentWell
from .geometry import GeometryView
from .modules import ModuleView


BAD_PAIRS = [
    ("1", "12"),
    ("12", "1"),
    ("4", "12"),
    ("12", "4"),
    ("4", "9"),
    ("9", "4"),
    ("4", "8"),
    ("8", "4"),
    ("1", "8"),
    ("8", "1"),
    ("4", "11"),
    ("11", "4"),
    ("1", "11"),
    ("11", "1"),
]


@dataclass(frozen=True)
class PipetteLocationData:
    """Pipette data used to determine the current gantry position."""

    mount: MountType
    critical_point: Optional[CriticalPoint]


class MotionView:
    """Complete motion planning state and getter methods."""

    def __init__(
        self,
        labware_view: LabwareView,
        pipette_view: PipetteView,
        geometry_view: GeometryView,
        module_view: ModuleView,
    ) -> None:
        """Initialize a MotionState instance."""
        self._labware = labware_view
        self._pipettes = pipette_view
        self._geometry = geometry_view
        self._module = module_view

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
        extra_waypoints = []

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
            if self._should_dodge_thermocycler(
                    from_loc=self._labware.get_location(location.labware_id),
                    to_loc=self._labware.get_location(labware_id)):
                slot_5_center = self._labware.get_slot_position(
                    slot=DeckSlotName.SLOT_5)
                extra_waypoints = [(slot_5_center.x, slot_5_center.y)]
        else:
            move_type = MoveType.GENERAL_ARC
            min_travel_z = self._geometry.get_all_labware_highest_z()
            # TODO (spp, 11-29-2021): Should log some kind of warning that pipettes
            #  could crash onto the thermocycler

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
                xy_waypoints=extra_waypoints,
            )
        except MotionPlanningError as error:
            raise errors.FailedToPlanMoveError(str(error))

    def _should_dodge_thermocycler(
        self, from_loc: LabwareLocation, to_loc: LabwareLocation
    ) -> bool:
        """
        Decide if the requested path would cross the thermocycler, if installed.

        Returns True if we need to dodge, False otherwise
        """

        def get_slot_name(location: LabwareLocation) -> DeckSlotName:
            slot_name: DeckSlotName
            if isinstance(location, DeckSlotLocation):
                slot_name = location.slotName
            else:
                slot_name = self._module.get_location(location.moduleId).slotName
            return slot_name

        if ModuleModel.THERMOCYCLER_MODULE_V1 in [mod.model
                                                  for mod in self._module.get_all()]:
            transit = (get_slot_name(from_loc).value, get_slot_name(to_loc).value)
            if transit in BAD_PAIRS:
                return True
        return False
