"""Test state getters for retrieving motion planning views of state."""
# TODO(mc, 2021-01-08): rewrite tests using Decoy

import pytest
from dataclasses import dataclass, field
from mock import MagicMock
from typing import Optional

from opentrons.types import Point, MountType
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocols.geometry.planning import MoveType, get_waypoints

from opentrons.protocol_engine import errors, DeckLocation, WellLocation, WellOrigin
from opentrons.protocol_engine.state import PipetteData, PipetteLocationData
from opentrons.protocol_engine.state.labware import LabwareStore
from opentrons.protocol_engine.state.pipettes import PipetteStore
from opentrons.protocol_engine.state.geometry import GeometryStore
from opentrons.protocol_engine.state.motion import MotionStore


@pytest.fixture
def mock_labware_store() -> MagicMock:
    """Get a mock in the shape of a LabwareStore."""
    return MagicMock(spec=LabwareStore)


@pytest.fixture
def mock_pipette_store() -> MagicMock:
    """Get a mock in the shape of a PipetteStore."""
    return MagicMock(spec=PipetteStore)


@pytest.fixture
def mock_geometry_store() -> MagicMock:
    """Get a mock in the shape of a GeometryStore."""
    return MagicMock(spec=GeometryStore)


@pytest.fixture
def motion_store(
    mock_labware_store: MagicMock,
    mock_pipette_store: MagicMock,
    mock_geometry_store: MagicMock,
) -> MotionStore:
    """Get a MotionStore with its dependencies mocked out."""
    return MotionStore(
        labware_store=mock_labware_store,
        pipette_store=mock_pipette_store,
        geometry_store=mock_geometry_store,
    )


# TODO(mc, 2021-01-14): this testing pain is code smell and probably an
# indication that the "current deck location" data needs to be in a
# different store. Alternatively, this data should be fed in via a public
# interface, like handling a MoveToWellResult.
def mock_location_data(
    motion_store: MotionStore,
    data: Optional[DeckLocation]
) -> None:
    """Insert mock location data into the store."""
    motion_store.state._current_location = data
    assert motion_store.state.get_current_deck_location() == data


def test_get_pipette_location_with_no_current_location(
    mock_pipette_store: MagicMock,
    motion_store: MotionStore,
) -> None:
    """It should return mount and critical_point=None if no location."""
    mock_pipette_store.state.get_pipette_data_by_id.return_value = PipetteData(
        mount=MountType.LEFT,
        pipette_name="p300_single"
    )

    result = motion_store.state.get_pipette_location("pipette-id")

    mock_pipette_store.state.get_pipette_data_by_id.assert_called_with(
        "pipette-id"
    )
    assert result == PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=None
    )


def test_get_pipette_location_with_current_location_with_quirks(
    mock_pipette_store: MagicMock,
    mock_labware_store: MagicMock,
    motion_store: MotionStore
) -> None:
    """It should return cp=XY_CENTER if location labware has center quirk."""
    mock_location_data(
        motion_store,
        DeckLocation(
            pipette_id="pipette-id",
            labware_id="reservoir-id",
            well_name="A1"
        ),
    )

    mock_labware_store.state.get_labware_has_quirk.return_value = True
    mock_pipette_store.state.get_pipette_data_by_id.return_value = PipetteData(
        mount=MountType.RIGHT,
        pipette_name="p300_single"
    )

    result = motion_store.state.get_pipette_location("pipette-id")

    mock_labware_store.state.get_labware_has_quirk.assert_called_with(
        "reservoir-id",
        "centerMultichannelOnWells",
    )
    assert result == PipetteLocationData(
        mount=MountType.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
    )


def test_get_pipette_location_with_current_location_different_pipette(
    mock_pipette_store: MagicMock,
    mock_labware_store: MagicMock,
    motion_store: MotionStore
) -> None:
    """It should return mount and cp=None if location used other pipette."""
    mock_location_data(
        motion_store,
        DeckLocation(
            pipette_id="other-pipette-id",
            labware_id="reservoir-id",
            well_name="A1"
        ),
    )

    mock_labware_store.state.get_labware_has_quirk.return_value = False
    mock_pipette_store.state.get_pipette_data_by_id.return_value = PipetteData(
        mount=MountType.LEFT,
        pipette_name="p300_single"
    )

    result = motion_store.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=None,
    )


def test_get_pipette_location_override_current_location(
    mock_pipette_store: MagicMock,
    mock_labware_store: MagicMock,
    motion_store: MotionStore
) -> None:
    """It should calculate pipette location from a passed in deck location."""
    current_location = DeckLocation(
        pipette_id="pipette-id",
        labware_id="reservoir-id",
        well_name="A1"
    )

    mock_labware_store.state.get_labware_has_quirk.return_value = True
    mock_pipette_store.state.get_pipette_data_by_id.return_value = PipetteData(
        mount=MountType.RIGHT,
        pipette_name="p300_single"
    )

    result = motion_store.state.get_pipette_location(
        pipette_id="pipette-id",
        current_location=current_location,
    )

    mock_labware_store.state.get_labware_has_quirk.assert_called_with(
        "reservoir-id",
        "centerMultichannelOnWells",
    )
    assert result == PipetteLocationData(
        mount=MountType.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
    )


@dataclass(frozen=True)
class WaypointSpec:
    """Spec data for testing the get_movement_waypoints selector."""

    name: str
    expected_move_type: MoveType
    pipette_id: str = "pipette-id"
    labware_id: str = "labware-id"
    well_name: str = "A1"
    well_location: Optional[WellLocation] = None
    origin: Point = field(default_factory=lambda: Point(1, 2, 3))
    dest: Point = field(default_factory=lambda: Point(4, 5, 6))
    origin_cp: Optional[CriticalPoint] = None
    location: Optional[DeckLocation] = None
    expected_dest_cp: Optional[CriticalPoint] = None
    has_center_multichannel_quirk: bool = False
    labware_z: Optional[float] = None
    all_labware_z: Optional[float] = None
    max_travel_z: float = 50


# TODO(mc, 2021-01-14): these tests probably need to be rethought; this fixture
# is impossible to reason with. The test is really just trying to be a collaborator
# test for the `get_waypoints` function, so we should rewrite it as such.
@pytest.mark.parametrize("spec", [
    WaypointSpec(
        name="General arc if moving from unknown location",
        all_labware_z=20,
        expected_move_type=MoveType.GENERAL_ARC,
    ),
    WaypointSpec(
        name="General arc if moving from other labware",
        location=DeckLocation(
            pipette_id="pipette-id",
            labware_id="other-labware-id",
            well_name="A1"),
        all_labware_z=20,
        expected_move_type=MoveType.GENERAL_ARC,
    ),
    WaypointSpec(
        name="In-labware arc if moving to same labware",
        location=DeckLocation(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2"),
        labware_z=10,
        expected_move_type=MoveType.IN_LABWARE_ARC,
    ),
    WaypointSpec(
        name="General arc if moving to same labware with different pipette",
        location=DeckLocation(
            pipette_id="other-pipette-id",
            labware_id="labware-id",
            well_name="A1"),
        all_labware_z=20,
        expected_move_type=MoveType.GENERAL_ARC,
    ),
    WaypointSpec(
        name="Direct movement from well to same well",
        location=DeckLocation(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A1"),
        labware_z=10,
        expected_move_type=MoveType.DIRECT,
    ),
    WaypointSpec(
        name="General arc with XY_CENTER destination CP",
        has_center_multichannel_quirk=True,
        all_labware_z=20,
        expected_move_type=MoveType.GENERAL_ARC,
        expected_dest_cp=CriticalPoint.XY_CENTER,
    ),
    WaypointSpec(
        name="General arc with a well offset",
        all_labware_z=20,
        well_location=WellLocation(origin=WellOrigin.TOP, offset=(0, 0, 1)),
        expected_move_type=MoveType.GENERAL_ARC,
    ),
    # TODO(mc, 2021-01-08): add test for override current location
])
def test_get_movement_waypoints(
    mock_labware_store: MagicMock,
    mock_geometry_store: MagicMock,
    motion_store: MotionStore,
    spec: WaypointSpec
) -> None:
    """It should calculate the correct set of waypoints for a move."""
    mock_labware_store.state.get_labware_has_quirk.return_value = \
        spec.has_center_multichannel_quirk

    if spec.labware_z is not None:
        min_travel_z = spec.labware_z
        mock_geometry_store.state.get_labware_highest_z.return_value = \
            spec.labware_z
    elif spec.all_labware_z is not None:
        min_travel_z = spec.all_labware_z
        mock_geometry_store.state.get_all_labware_highest_z.return_value = \
            spec.all_labware_z
    else:
        assert False, "One of spec.labware_z or all_labware_z must be defined."

    mock_geometry_store.state.get_well_position.return_value = spec.dest
    mock_location_data(motion_store, spec.location)

    result = motion_store.state.get_movement_waypoints(
        pipette_id=spec.pipette_id,
        labware_id=spec.labware_id,
        well_name=spec.well_name,
        well_location=spec.well_location,
        origin=spec.origin,
        origin_cp=spec.origin_cp,
        max_travel_z=spec.max_travel_z,
    )

    expected = get_waypoints(
        move_type=spec.expected_move_type,
        origin=spec.origin,
        origin_cp=spec.origin_cp,
        max_travel_z=spec.max_travel_z,
        min_travel_z=min_travel_z,
        dest=spec.dest,
        dest_cp=spec.expected_dest_cp,
        xy_waypoints=[],
    )

    mock_labware_store.state.get_labware_has_quirk.assert_called_with(
        spec.labware_id,
        "centerMultichannelOnWells"
    )
    mock_geometry_store.state.get_well_position.assert_called_with(
        spec.labware_id,
        spec.well_name,
        spec.well_location,
    )
    if spec.labware_z is not None:
        mock_geometry_store.state.get_labware_highest_z.assert_called_with(
            spec.labware_id
        )

    assert result == expected


def test_get_movement_waypoints_raises(
    mock_geometry_store: MagicMock,
    motion_store: MotionStore,
) -> None:
    """It should raise FailedToPlanMoveError if get_waypoints raises."""
    mock_geometry_store.state.get_well_position.return_value = Point(4, 5, 6)
    mock_location_data(motion_store, None)

    with pytest.raises(errors.FailedToPlanMoveError, match="out of bounds"):
        motion_store.state.get_movement_waypoints(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A1",
            well_location=None,
            origin=Point(1, 2, 3),
            origin_cp=None,
            # this max_travel_z is too low and will induce failure
            max_travel_z=1,
        )
