"""Test state getters for retrieving motion planning views of state."""
import pytest
from decoy import Decoy
from dataclasses import dataclass, field
from typing import Optional, Sequence, Tuple

from opentrons.types import Point, MountType, DeckSlotName, PipetteName
from opentrons.hardware_control.types import CriticalPoint
from opentrons import motion_planning

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.types import (
    WellLocation,
    WellOrigin,
    WellOffset,
    LoadedPipette,
    DeckSlotLocation,
)
from opentrons.protocol_engine.state import PipetteLocationData
from opentrons.protocol_engine.state.labware import LabwareView
from opentrons.protocol_engine.state.pipettes import PipetteView, CurrentWell
from opentrons.protocol_engine.state.geometry import GeometryView
from opentrons.protocol_engine.state.motion import MotionView
from opentrons.protocol_engine.state.modules import ModuleView
from opentrons.protocol_engine.state.module_substates import HeaterShakerModuleId


@pytest.fixture
def mock_module_view(decoy: Decoy) -> ModuleView:
    """Get a mock in the shape of a ModuleView."""
    return decoy.mock(cls=ModuleView)


@pytest.fixture(autouse=True)
def patch_mock_get_waypoints(decoy: Decoy, monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace motion_planning.get_waypoints() with a mock."""
    mock_get_waypoints = decoy.mock(func=motion_planning.get_waypoints)
    monkeypatch.setattr(motion_planning, "get_waypoints", mock_get_waypoints)


@pytest.fixture
def subject(
    labware_view: LabwareView,
    pipette_view: PipetteView,
    geometry_view: GeometryView,
    mock_module_view: ModuleView,
) -> MotionView:
    """Get a MotionView with its dependencies mocked out."""
    return MotionView(
        labware_view=labware_view,
        pipette_view=pipette_view,
        geometry_view=geometry_view,
        module_view=mock_module_view,
    )


def test_get_pipette_location_with_no_current_location(
    decoy: Decoy,
    pipette_view: PipetteView,
    subject: MotionView,
) -> None:
    """It should return mount and critical_point=None if no location."""
    decoy.when(pipette_view.get_current_well()).then_return(None)

    decoy.when(pipette_view.get("pipette-id")).then_return(
        LoadedPipette(
            id="pipette-id",
            mount=MountType.LEFT,
            pipetteName=PipetteName.P300_SINGLE,
        )
    )

    result = subject.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(mount=MountType.LEFT, critical_point=None)


def test_get_pipette_location_with_current_location_with_quirks(
    decoy: Decoy,
    labware_view: LabwareView,
    pipette_view: PipetteView,
    subject: MotionView,
) -> None:
    """It should return cp=XY_CENTER if location labware has center quirk."""
    decoy.when(pipette_view.get_current_well()).then_return(
        CurrentWell(pipette_id="pipette-id", labware_id="reservoir-id", well_name="A1")
    )

    decoy.when(pipette_view.get("pipette-id")).then_return(
        LoadedPipette(
            id="pipette-id",
            mount=MountType.RIGHT,
            pipetteName=PipetteName.P300_SINGLE,
        )
    )

    decoy.when(
        labware_view.get_has_quirk(
            "reservoir-id",
            "centerMultichannelOnWells",
        )
    ).then_return(True)

    result = subject.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
    )


def test_get_pipette_location_with_current_location_different_pipette(
    decoy: Decoy,
    labware_view: LabwareView,
    pipette_view: PipetteView,
    subject: MotionView,
) -> None:
    """It should return mount and cp=None if location used other pipette."""
    decoy.when(pipette_view.get_current_well()).then_return(
        CurrentWell(
            pipette_id="other-pipette-id",
            labware_id="reservoir-id",
            well_name="A1",
        )
    )

    decoy.when(pipette_view.get("pipette-id")).then_return(
        LoadedPipette(
            id="pipette-id",
            mount=MountType.LEFT,
            pipetteName=PipetteName.P300_SINGLE,
        )
    )

    decoy.when(
        labware_view.get_has_quirk(
            "reservoir-id",
            "centerMultichannelOnWells",
        )
    ).then_return(False)

    result = subject.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=None,
    )


def test_get_pipette_location_override_current_location(
    decoy: Decoy,
    labware_view: LabwareView,
    pipette_view: PipetteView,
    subject: MotionView,
) -> None:
    """It should calculate pipette location from a passed in deck location."""
    current_well = CurrentWell(
        pipette_id="pipette-id",
        labware_id="reservoir-id",
        well_name="A1",
    )

    decoy.when(pipette_view.get("pipette-id")).then_return(
        LoadedPipette(
            id="pipette-id",
            mount=MountType.RIGHT,
            pipetteName=PipetteName.P300_SINGLE,
        )
    )

    decoy.when(
        labware_view.get_has_quirk(
            "reservoir-id",
            "centerMultichannelOnWells",
        )
    ).then_return(True)

    result = subject.get_pipette_location(
        pipette_id="pipette-id",
        current_well=current_well,
    )

    assert result == PipetteLocationData(
        mount=MountType.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
    )


@dataclass(frozen=True)
class WaypointSpec:
    """Spec data for testing the get_movement_waypoints_to_well selector."""

    name: str
    expected_move_type: motion_planning.MoveType
    pipette_id: str = "pipette-id"
    labware_id: str = "labware-id"
    well_name: str = "A1"
    well_location: Optional[WellLocation] = None
    origin: Point = field(default_factory=lambda: Point(1, 2, 3))
    dest: Point = field(default_factory=lambda: Point(4, 5, 6))
    origin_cp: Optional[CriticalPoint] = None
    location: Optional[CurrentWell] = None
    expected_dest_cp: Optional[CriticalPoint] = None
    has_center_multichannel_quirk: bool = False
    labware_z: Optional[float] = None
    all_labware_z: Optional[float] = None
    max_travel_z: float = 50
    should_dodge_thermocycler: bool = False
    extra_waypoints: Sequence[Tuple[float, float]] = field(default_factory=list)


# TODO(mm, 2022-06-22): Break this test apart into the parts that are orthogonal
# (see this test's docstring) or refactor the subject to do less at once.
@pytest.mark.parametrize(
    "spec",
    [
        WaypointSpec(
            name="General arc if moving from unknown location",
            all_labware_z=20,
            expected_move_type=motion_planning.MoveType.GENERAL_ARC,
        ),
        WaypointSpec(
            name="General arc if moving from other labware",
            location=CurrentWell(
                pipette_id="pipette-id",
                labware_id="other-labware-id",
                well_name="A1",
            ),
            all_labware_z=20,
            expected_move_type=motion_planning.MoveType.GENERAL_ARC,
        ),
        WaypointSpec(
            name="In-labware arc if moving to same labware",
            location=CurrentWell(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="B2",
            ),
            labware_z=10,
            expected_move_type=motion_planning.MoveType.IN_LABWARE_ARC,
        ),
        WaypointSpec(
            name="General arc if moving to same labware with different pipette",
            location=CurrentWell(
                pipette_id="other-pipette-id",
                labware_id="labware-id",
                well_name="A1",
            ),
            all_labware_z=20,
            expected_move_type=motion_planning.MoveType.GENERAL_ARC,
        ),
        WaypointSpec(
            name="Direct movement from well to same well",
            location=CurrentWell(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="A1",
            ),
            labware_z=10,
            expected_move_type=motion_planning.MoveType.DIRECT,
        ),
        WaypointSpec(
            name="General arc with XY_CENTER destination CP",
            has_center_multichannel_quirk=True,
            all_labware_z=20,
            expected_move_type=motion_planning.MoveType.GENERAL_ARC,
            expected_dest_cp=CriticalPoint.XY_CENTER,
        ),
        WaypointSpec(
            name="General arc with a well offset",
            all_labware_z=20,
            well_location=WellLocation(
                origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=1)
            ),
            expected_move_type=motion_planning.MoveType.GENERAL_ARC,
        ),
        WaypointSpec(
            name="General arc with extra waypoints to dodge thermocycler",
            location=CurrentWell(
                pipette_id="pipette-id",
                labware_id="other-labware-id",
                well_name="A1",
            ),
            all_labware_z=20,
            should_dodge_thermocycler=True,
            expected_move_type=motion_planning.MoveType.GENERAL_ARC,
            extra_waypoints=[(123, 456)],
        )
        # TODO(mc, 2021-01-08): add test for override current location (current_well)
    ],
)
def test_get_movement_waypoints_to_well(
    decoy: Decoy,
    labware_view: LabwareView,
    pipette_view: PipetteView,
    geometry_view: GeometryView,
    mock_module_view: ModuleView,
    subject: MotionView,
    spec: WaypointSpec,
) -> None:
    """It should call get_waypoints() with the correct args to move to a well.

    The arguments to get_waypoints() should be as follows:

    * move_type:
        * DIRECT if moving within a single well.
        * IN_LABWARE_ARC if going well-to-well in a single labware.
        * GENERAL_ARC otherwise.
    * origin:
        Always passed through as-is from subject's arguments.
    * origin_cp:
        Always passed through as-is from subject's arguments.
    * max_travel_z:
        Always passed through as-is from subject's arguments.
    * min_travel_z:
        * Labware's highest Z if going well-to-well in a single labware.
        * Doesn't matter if moving within a single well (because it'll be DIRECT).
        * get_all_labware_highest_z() deck-wide safe height otherwise.
    * dest:
        Point calculated from subject's labware_id, well_name, and well_location
        arguments.
    * dest_cp:
        None or XY_CENTER depending on the labware's centerMultichannelOnWells quirk.
    * max_travel_z:
        Always passed through as-is from subject's arguments.
    * xy_waypoints:
        * Center of slot 5 if source is known and path warrants a Thermocycler dodge.
        * [] otherwise.
    """
    decoy.when(
        labware_view.get_has_quirk(
            spec.labware_id,
            "centerMultichannelOnWells",
        )
    ).then_return(spec.has_center_multichannel_quirk)

    if spec.labware_z is not None:
        min_travel_z = spec.labware_z

        decoy.when(geometry_view.get_labware_highest_z(spec.labware_id)).then_return(
            spec.labware_z
        )

    elif spec.all_labware_z is not None:
        min_travel_z = spec.all_labware_z

        decoy.when(geometry_view.get_all_labware_highest_z()).then_return(
            spec.all_labware_z
        )

    else:
        assert False, "One of spec.labware_z or all_labware_z must be defined."

    decoy.when(
        geometry_view.get_well_position(
            spec.labware_id,
            spec.well_name,
            spec.well_location,
        )
    ).then_return(spec.dest)

    decoy.when(pipette_view.get_current_well()).then_return(spec.location)

    if spec.location:
        decoy.when(geometry_view.get_ancestor_slot_name(spec.labware_id)).then_return(
            DeckSlotName.SLOT_1
        )
        decoy.when(
            geometry_view.get_ancestor_slot_name(spec.location.labware_id)
        ).then_return(DeckSlotName.SLOT_1)
        decoy.when(
            mock_module_view.should_dodge_thermocycler(
                from_slot=DeckSlotName.SLOT_1, to_slot=DeckSlotName.SLOT_1
            )
        ).then_return(spec.should_dodge_thermocycler)

    if spec.should_dodge_thermocycler:
        decoy.when(
            labware_view.get_slot_center_position(slot=DeckSlotName.SLOT_5)
        ).then_return(
            Point(x=spec.extra_waypoints[0][0], y=spec.extra_waypoints[0][1], z=123)
        )

    waypoints = [
        motion_planning.Waypoint(
            position=Point(1, 2, 3), critical_point=CriticalPoint.XY_CENTER
        ),
        motion_planning.Waypoint(
            position=Point(4, 5, 6), critical_point=CriticalPoint.MOUNT
        ),
    ]

    decoy.when(
        motion_planning.get_waypoints(
            move_type=spec.expected_move_type,
            origin=spec.origin,
            origin_cp=spec.origin_cp,
            max_travel_z=spec.max_travel_z,
            min_travel_z=min_travel_z,
            dest=spec.dest,
            dest_cp=spec.expected_dest_cp,
            xy_waypoints=spec.extra_waypoints,
        )
    ).then_return(waypoints)

    result = subject.get_movement_waypoints_to_well(
        pipette_id=spec.pipette_id,
        labware_id=spec.labware_id,
        well_name=spec.well_name,
        well_location=spec.well_location,
        origin=spec.origin,
        origin_cp=spec.origin_cp,
        max_travel_z=spec.max_travel_z,
    )

    assert result == waypoints


def test_get_movement_waypoints_to_well_raises(
    decoy: Decoy,
    pipette_view: PipetteView,
    geometry_view: GeometryView,
    subject: MotionView,
) -> None:
    """It should raise FailedToPlanMoveError if motion_planning.get_waypoints raises."""
    decoy.when(
        geometry_view.get_well_position(
            labware_id="labware-id",
            well_name="A1",
            well_location=None,
        )
    ).then_return(Point(x=4, y=5, z=6))
    decoy.when(pipette_view.get_current_well()).then_return(None)
    decoy.when(geometry_view.get_all_labware_highest_z()).then_return(456)
    decoy.when(
        # TODO(mm, 2022-06-22): We should use decoy.matchers.Anything() for all
        # arguments. For some reason, Decoy does not match the call unless we
        # specify concrete values for all (?) arguments?
        motion_planning.get_waypoints(
            Point(x=1, y=2, z=3),
            Point(x=4, y=5, z=6),
            max_travel_z=123,
            min_travel_z=456,
        ),
        ignore_extra_args=True,
    ).then_raise(
        motion_planning.MotionPlanningError(
            origin=Point(1, 2, 3),
            dest=Point(1, 2, 3),
            clearance=123,
            min_travel_z=123,
            max_travel_z=123,
            message="oh the humanity",
        )
    )

    with pytest.raises(errors.FailedToPlanMoveError, match="oh the humanity"):
        subject.get_movement_waypoints_to_well(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A1",
            well_location=None,
            origin=Point(1, 2, 3),
            origin_cp=None,
            max_travel_z=123,
        )


@pytest.mark.parametrize(
    ("direct", "expected_move_type"),
    [
        (False, motion_planning.MoveType.GENERAL_ARC),
        (True, motion_planning.MoveType.DIRECT),
    ],
)
@pytest.mark.parametrize(
    ("additional_min_travel_z", "all_labware_highest_z", "expected_min_travel_z"),
    [
        (None, 100, 100),
        (200, 100, 200),
        (100, 200, 200),
        (None, -100, -100),
        (-200, -100, -100),
        (-100, -200, -100),
    ],
)
def test_get_movement_waypoints_to_coords(
    decoy: Decoy,
    geometry_view: GeometryView,
    subject: MotionView,
    direct: bool,
    expected_move_type: motion_planning.MoveType,
    additional_min_travel_z: float,
    all_labware_highest_z: float,
    expected_min_travel_z: float,
) -> None:
    """It should call get_waypoints() with the correct args to move to coordinates."""
    origin = Point(1, 2, 3)
    dest = Point(4, 5, 6)
    max_travel_z = 789

    decoy.when(geometry_view.get_all_labware_highest_z()).then_return(
        all_labware_highest_z
    )

    waypoints = [
        motion_planning.Waypoint(
            position=Point(1, 2, 3), critical_point=CriticalPoint.XY_CENTER
        ),
        motion_planning.Waypoint(
            position=Point(4, 5, 6), critical_point=CriticalPoint.MOUNT
        ),
    ]

    decoy.when(
        motion_planning.get_waypoints(
            origin=origin,
            origin_cp=None,
            dest=dest,
            dest_cp=None,
            min_travel_z=expected_min_travel_z,
            max_travel_z=max_travel_z,
            move_type=expected_move_type,
        )
    ).then_return(waypoints)

    result = subject.get_movement_waypoints_to_coords(
        origin=origin,
        dest=dest,
        max_travel_z=max_travel_z,
        direct=direct,
        additional_min_travel_z=additional_min_travel_z,
    )

    assert result == waypoints


def test_get_movement_waypoints_to_coords_raises(
    decoy: Decoy,
    geometry_view: GeometryView,
    subject: MotionView,
) -> None:
    """It should raise FailedToPlanMoveError if motion_planning.get_waypoints raises."""
    decoy.when(geometry_view.get_all_labware_highest_z()).then_return(123)
    decoy.when(
        # TODO(mm, 2022-06-22): We should use decoy.matchers.Anything() for all
        # arguments. For some reason, Decoy does not match the call unless we
        # specify concrete values for all (?) arguments?
        motion_planning.get_waypoints(
            Point(x=1, y=2, z=3),
            Point(x=1, y=2, z=3),
            max_travel_z=123,
            min_travel_z=123,
        ),
        ignore_extra_args=True,
    ).then_raise(
        motion_planning.MotionPlanningError(
            origin=Point(1, 2, 3),
            dest=Point(1, 2, 3),
            clearance=123,
            min_travel_z=123,
            max_travel_z=123,
            message="oh the humanity",
        )
    )

    with pytest.raises(errors.FailedToPlanMoveError, match="oh the humanity"):
        subject.get_movement_waypoints_to_coords(
            origin=Point(1, 2, 3),
            dest=Point(1, 2, 3),
            max_travel_z=123,
            direct=False,
            additional_min_travel_z=None,
        )


@pytest.mark.parametrize(
    ("labware_deck_slot", "expected_result"),
    [
        (DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_5, True),
        (DeckSlotName.SLOT_6, True),
        (DeckSlotName.SLOT_2, False),
        (DeckSlotName.SLOT_8, False),
        (DeckSlotName.SLOT_1, False),
    ],
)
def test_check_pipette_blocking_hs_latch(
    decoy: Decoy,
    geometry_view: GeometryView,
    pipette_view: PipetteView,
    mock_module_view: ModuleView,
    subject: MotionView,
    labware_deck_slot: DeckSlotName,
    expected_result: bool,
) -> None:
    """It should return True if pipette is blocking opening the latch."""
    decoy.when(pipette_view.get_current_well()).then_return(
        CurrentWell(pipette_id="pipette-id", labware_id="labware-id", well_name="A1")
    )

    decoy.when(geometry_view.get_ancestor_slot_name("labware-id")).then_return(
        labware_deck_slot
    )

    decoy.when(
        mock_module_view.get_location(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_5))

    result = subject.check_pipette_blocking_hs_latch(
        HeaterShakerModuleId("heater-shaker-id")
    )

    assert result == expected_result


@pytest.mark.parametrize(
    ("labware_deck_slot", "expected_result"),
    [
        (DeckSlotName.SLOT_4, True),
        (DeckSlotName.SLOT_5, True),
        (DeckSlotName.SLOT_6, True),
        (DeckSlotName.SLOT_2, True),
        (DeckSlotName.SLOT_8, True),
        (DeckSlotName.SLOT_1, False),
    ],
)
def test_check_pipette_blocking_hs_shake(
    decoy: Decoy,
    geometry_view: GeometryView,
    pipette_view: PipetteView,
    mock_module_view: ModuleView,
    subject: MotionView,
    labware_deck_slot: DeckSlotName,
    expected_result: bool,
) -> None:
    """It should return True if pipette is blocking the h/s from shaking."""
    decoy.when(pipette_view.get_current_well()).then_return(
        CurrentWell(pipette_id="pipette-id", labware_id="labware-id", well_name="A1")
    )

    decoy.when(geometry_view.get_ancestor_slot_name("labware-id")).then_return(
        labware_deck_slot
    )

    decoy.when(
        mock_module_view.get_location(HeaterShakerModuleId("heater-shaker-id"))
    ).then_return(DeckSlotLocation(slotName=DeckSlotName.SLOT_5))

    result = subject.check_pipette_blocking_hs_shaker(
        HeaterShakerModuleId("heater-shaker-id")
    )

    assert result == expected_result
