"""Test state getters for retrieving motion planning views of state."""
import pytest
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import Point, MountType
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocols.geometry.planning import MoveType, get_waypoints

from opentrons.protocol_engine.state import (
    StateStore,
    LabwareData,
    LocationData,
    PipetteData,
    PipetteLocationData,
)


def mock_labware_data(
    store: StateStore,
    data: LabwareData,
    labware_id: str,
) -> None:
    """Insert mock location data into the store."""
    store.state._labware_by_id[labware_id] = data
    assert store.state.get_labware_data_by_id(labware_id) == data


def mock_pipette_data(
    store: StateStore,
    data: PipetteData,
    pipette_id: str,
) -> None:
    """Insert mock location data into the store."""
    store.state._pipettes_by_id[pipette_id] = data
    assert store.state.get_pipette_data_by_id(pipette_id) == data


def mock_location_data(store: StateStore, data: LocationData) -> None:
    """Insert mock location data into the store."""
    store.state._current_location = data
    assert store.state.get_current_location_data() == data


@pytest.fixture
def store_with_lw(
    store: StateStore,
    reservoir_def: LabwareDefinition,
    well_plate_def: LabwareDefinition,
) -> StateStore:
    mock_labware_data(
        store,
        LabwareData(
            location=3,
            definition=reservoir_def,
            calibration=(1, 2, 3)
        ),
        "reservoir-id",
    )
    mock_labware_data(
        store,
        LabwareData(
            location=4,
            definition=well_plate_def,
            calibration=(4, 5, 6)
        ),
        "plate-id",
    )

    return store


def test_get_pipette_location_with_no_current_location(
    store: StateStore,
) -> None:
    """It should return mount and critical_point=None if no location."""
    mock_pipette_data(
        store,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    result = store.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=None
    )


def test_get_pipette_location_with_current_location_with_quirks(
    store_with_lw: StateStore
) -> None:
    """It should return cp=XY_CENTER if location labware has center quirk."""
    mock_location_data(
        store_with_lw,
        LocationData(
            pipette_id="pipette-id",
            labware_id="reservoir-id",
            well_id="A1"
        ),
    )

    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.RIGHT, pipette_name="p300_single"),
        "pipette-id",
    )

    result = store_with_lw.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
    )


def test_get_pipette_location_with_current_location_different_pipette(
    store_with_lw: StateStore,
) -> None:
    """It should return mount and cp=None if location used other pipette."""
    mock_location_data(
        store_with_lw,
        LocationData(
            pipette_id="other-pipette-id",
            labware_id="reservoir-id",
            well_id="A1"
        ),
    )

    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    result = store_with_lw.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=None,
    )


def test_get_movement_endpoints_general_arc(
    store_with_lw: StateStore,
) -> None:
    """It should use a general arc for movement from no location."""
    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    origin = Point(1, 2, 3)
    origin_cp = None
    max_travel_z = 42.0

    result = store_with_lw.state.get_movement_waypoints(
        pipette_id="pipette_id",
        labware_id="plate-id",
        well_id="B2",
        origin=origin,
        origin_cp=origin_cp,
        max_travel_z=max_travel_z,
    )

    expected = get_waypoints(
        move_type=MoveType.GENERAL_ARC,
        origin=origin,
        origin_cp=None,
        max_travel_z=max_travel_z,
        min_travel_z=store_with_lw.state.get_all_labware_highest_z(),
        dest=store_with_lw.state.get_well_position("plate-id", "B2"),
        dest_cp=None,
        xy_waypoints=[],
    )

    assert result == expected


def test_get_movement_endpoints_in_labware_arc(
    store_with_lw: StateStore,
) -> None:
    """It should use an in-labware arc for movement from same labware."""
    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    mock_location_data(
        store_with_lw,
        LocationData(
            pipette_id="pipette-id",
            labware_id="plate-id",
            well_id="A1"
        ),
    )

    origin = store_with_lw.state.get_well_position("plate-id", "A1")
    origin_cp = None
    max_travel_z = 42.0

    result = store_with_lw.state.get_movement_waypoints(
        pipette_id="pipette-id",
        labware_id="plate-id",
        well_id="B2",
        origin=origin,
        origin_cp=origin_cp,
        max_travel_z=max_travel_z,
    )

    expected = get_waypoints(
        move_type=MoveType.IN_LABWARE_ARC,
        origin=origin,
        origin_cp=None,
        max_travel_z=max_travel_z,
        min_travel_z=store_with_lw.state.get_labware_highest_z("plate-id"),
        dest=store_with_lw.state.get_well_position("plate-id", "B2"),
        dest_cp=None,
        xy_waypoints=[],
    )

    assert result == expected


def test_get_movement_endpoints_general_arc_if_new_pipette(
    store_with_lw: StateStore,
) -> None:
    """It should use a general arc for same labware moves with new pipette."""
    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    mock_location_data(
        store_with_lw,
        LocationData(
            pipette_id="other-pipette-id",
            labware_id="plate-id",
            well_id="A1"
        ),
    )

    origin = store_with_lw.state.get_well_position("plate-id", "A1")
    origin_cp = None
    max_travel_z = 42.0

    result = store_with_lw.state.get_movement_waypoints(
        pipette_id="pipette_id",
        labware_id="plate-id",
        well_id="B2",
        origin=origin,
        origin_cp=origin_cp,
        max_travel_z=42.0,
    )

    expected = get_waypoints(
        move_type=MoveType.GENERAL_ARC,
        origin=origin,
        origin_cp=None,
        max_travel_z=max_travel_z,
        min_travel_z=store_with_lw.state.get_all_labware_highest_z(),
        dest=store_with_lw.state.get_well_position("plate-id", "B2"),
        dest_cp=None,
        xy_waypoints=[],
    )

    assert result == expected


def test_get_movement_endpoints_in_well_direct(
    store_with_lw: StateStore,
) -> None:
    """It should use an direct movement from same well."""
    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    mock_location_data(
        store_with_lw,
        LocationData(
            pipette_id="pipette-id",
            labware_id="plate-id",
            well_id="B2"
        ),
    )

    origin = store_with_lw.state.get_well_position("plate-id", "B2")
    origin_cp = None
    max_travel_z = 42.0

    result = store_with_lw.state.get_movement_waypoints(
        pipette_id="pipette-id",
        labware_id="plate-id",
        well_id="B2",
        origin=origin,
        origin_cp=origin_cp,
        max_travel_z=max_travel_z,
    )

    expected = get_waypoints(
        move_type=MoveType.DIRECT,
        origin=origin,
        origin_cp=None,
        max_travel_z=max_travel_z,
        min_travel_z=store_with_lw.state.get_labware_highest_z("plate-id"),
        dest=store_with_lw.state.get_well_position("plate-id", "B2"),
        dest_cp=None,
        xy_waypoints=[],
    )

    assert result == expected


def test_get_movement_endpoints_general_arc_with_dest_cp(
    store_with_lw: StateStore,
) -> None:
    """It should add a XY_CENTER destination cp if necessary."""
    mock_pipette_data(
        store_with_lw,
        PipetteData(mount=MountType.LEFT, pipette_name="p300_single"),
        "pipette-id",
    )

    mock_location_data(
        store_with_lw,
        LocationData(
            pipette_id="pipette-id",
            labware_id="plate-id",
            well_id="A1"
        ),
    )

    origin = store_with_lw.state.get_well_position("plate-id", "A1")
    origin_cp = None
    max_travel_z = 42.0

    result = store_with_lw.state.get_movement_waypoints(
        pipette_id="pipette_id",
        labware_id="reservoir-id",
        well_id="A1",
        origin=origin,
        origin_cp=origin_cp,
        max_travel_z=max_travel_z,
    )

    expected = get_waypoints(
        move_type=MoveType.GENERAL_ARC,
        origin=origin,
        origin_cp=None,
        max_travel_z=max_travel_z,
        min_travel_z=store_with_lw.state.get_all_labware_highest_z(),
        dest=store_with_lw.state.get_well_position("reservoir-id", "A1"),
        dest_cp=CriticalPoint.XY_CENTER,
        xy_waypoints=[],
    )

    assert result == expected
