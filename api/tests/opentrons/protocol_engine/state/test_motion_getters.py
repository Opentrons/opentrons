"""Test state getters for retrieving motion planning views of state."""
import pytest
from decoy import Decoy
from dataclasses import dataclass, field
from typing import Optional

from opentrons.types import Point, MountType
from opentrons.hardware_control.types import CriticalPoint
from opentrons.protocols.geometry.planning import MoveType, get_waypoints

from opentrons.protocol_engine import errors
from opentrons.protocol_engine.state import PipetteData, PipetteLocationData
from opentrons.protocol_engine.state.labware import LabwareStore
from opentrons.protocol_engine.state.pipettes import PipetteStore
from opentrons.protocol_engine.state.geometry import GeometryStore
from opentrons.protocol_engine.state.motion import MotionStore

from opentrons.protocol_engine.types import (
    DeckLocation,
    WellLocation,
    WellOrigin,
    PipetteName,
)


@pytest.fixture
def labware_store(decoy: Decoy) -> LabwareStore:
    """Get a mock in the shape of a LabwareStore."""
    return decoy.create_decoy(spec=LabwareStore)


@pytest.fixture
def pipette_store(decoy: Decoy) -> PipetteStore:
    """Get a mock in the shape of a PipetteStore."""
    return decoy.create_decoy(spec=PipetteStore)


@pytest.fixture
def geometry_store(decoy: Decoy) -> GeometryStore:
    """Get a mock in the shape of a GeometryStore."""
    return decoy.create_decoy(spec=GeometryStore)


@pytest.fixture
def subject(
    labware_store: LabwareStore,
    pipette_store: PipetteStore,
    geometry_store: GeometryStore,
) -> MotionStore:
    """Get a MotionStore with its dependencies mocked out."""
    return MotionStore(
        labware_store=labware_store,
        pipette_store=pipette_store,
        geometry_store=geometry_store,
    )


def test_get_pipette_location_with_no_current_location(
    decoy: Decoy,
    pipette_store: PipetteStore,
    subject: MotionStore,
) -> None:
    """It should return mount and critical_point=None if no location."""
    decoy.when(pipette_store.state.get_current_deck_location()).then_return(None)

    decoy.when(pipette_store.state.get_pipette_data_by_id("pipette-id")).then_return(
        PipetteData(
            mount=MountType.LEFT,
            pipette_name=PipetteName.P300_SINGLE,
        )
    )

    result = subject.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(mount=MountType.LEFT, critical_point=None)


def test_get_pipette_location_with_current_location_with_quirks(
    decoy: Decoy,
    labware_store: LabwareStore,
    pipette_store: PipetteStore,
    subject: MotionStore,
) -> None:
    """It should return cp=XY_CENTER if location labware has center quirk."""
    decoy.when(pipette_store.state.get_current_deck_location()).then_return(
        DeckLocation(pipette_id="pipette-id", labware_id="reservoir-id", well_name="A1")
    )

    decoy.when(pipette_store.state.get_pipette_data_by_id("pipette-id")).then_return(
        PipetteData(
            mount=MountType.RIGHT,
            pipette_name=PipetteName.P300_SINGLE,
        )
    )

    decoy.when(
        labware_store.state.get_labware_has_quirk(
            "reservoir-id",
            "centerMultichannelOnWells",
        )
    ).then_return(True)

    result = subject.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.RIGHT,
        critical_point=CriticalPoint.XY_CENTER,
    )


def test_get_pipette_location_with_current_location_different_pipette(
    decoy: Decoy,
    labware_store: LabwareStore,
    pipette_store: PipetteStore,
    subject: MotionStore,
) -> None:
    """It should return mount and cp=None if location used other pipette."""
    decoy.when(pipette_store.state.get_current_deck_location()).then_return(
        DeckLocation(
            pipette_id="other-pipette-id",
            labware_id="reservoir-id",
            well_name="A1",
        )
    )

    decoy.when(pipette_store.state.get_pipette_data_by_id("pipette-id")).then_return(
        PipetteData(
            mount=MountType.LEFT,
            pipette_name=PipetteName.P300_SINGLE,
        )
    )

    decoy.when(
        labware_store.state.get_labware_has_quirk(
            "reservoir-id",
            "centerMultichannelOnWells",
        )
    ).then_return(False)

    result = subject.state.get_pipette_location("pipette-id")

    assert result == PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=None,
    )


def test_get_pipette_location_override_current_location(
    decoy: Decoy,
    labware_store: LabwareStore,
    pipette_store: PipetteStore,
    subject: MotionStore,
) -> None:
    """It should calculate pipette location from a passed in deck location."""
    current_location = DeckLocation(
        pipette_id="pipette-id",
        labware_id="reservoir-id",
        well_name="A1",
    )

    decoy.when(pipette_store.state.get_pipette_data_by_id("pipette-id")).then_return(
        PipetteData(
            mount=MountType.RIGHT,
            pipette_name=PipetteName.P300_SINGLE,
        )
    )

    decoy.when(
        labware_store.state.get_labware_has_quirk(
            "reservoir-id",
            "centerMultichannelOnWells",
        )
    ).then_return(True)

    result = subject.state.get_pipette_location(
        pipette_id="pipette-id",
        current_location=current_location,
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
@pytest.mark.parametrize(
    "spec",
    [
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
                well_name="A1",
            ),
            all_labware_z=20,
            expected_move_type=MoveType.GENERAL_ARC,
        ),
        WaypointSpec(
            name="In-labware arc if moving to same labware",
            location=DeckLocation(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="B2",
            ),
            labware_z=10,
            expected_move_type=MoveType.IN_LABWARE_ARC,
        ),
        WaypointSpec(
            name="General arc if moving to same labware with different pipette",
            location=DeckLocation(
                pipette_id="other-pipette-id",
                labware_id="labware-id",
                well_name="A1",
            ),
            all_labware_z=20,
            expected_move_type=MoveType.GENERAL_ARC,
        ),
        WaypointSpec(
            name="Direct movement from well to same well",
            location=DeckLocation(
                pipette_id="pipette-id",
                labware_id="labware-id",
                well_name="A1",
            ),
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
    ],
)
def test_get_movement_waypoints(
    decoy: Decoy,
    labware_store: LabwareStore,
    pipette_store: PipetteStore,
    geometry_store: GeometryStore,
    subject: MotionStore,
    spec: WaypointSpec,
) -> None:
    """It should calculate the correct set of waypoints for a move."""
    decoy.when(
        labware_store.state.get_labware_has_quirk(
            spec.labware_id,
            "centerMultichannelOnWells",
        )
    ).then_return(spec.has_center_multichannel_quirk)

    if spec.labware_z is not None:
        min_travel_z = spec.labware_z

        decoy.when(
            geometry_store.state.get_labware_highest_z(spec.labware_id)
        ).then_return(spec.labware_z)

    elif spec.all_labware_z is not None:
        min_travel_z = spec.all_labware_z

        decoy.when(geometry_store.state.get_all_labware_highest_z()).then_return(
            spec.all_labware_z
        )

    else:
        assert False, "One of spec.labware_z or all_labware_z must be defined."

    decoy.when(
        geometry_store.state.get_well_position(
            spec.labware_id,
            spec.well_name,
            spec.well_location,
        )
    ).then_return(spec.dest)

    decoy.when(pipette_store.state.get_current_deck_location()).then_return(
        spec.location
    )

    result = subject.state.get_movement_waypoints(
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

    assert result == expected


def test_get_movement_waypoints_raises(
    decoy: Decoy,
    pipette_store: PipetteStore,
    geometry_store: GeometryStore,
    subject: MotionStore,
) -> None:
    """It should raise FailedToPlanMoveError if get_waypoints raises."""
    decoy.when(pipette_store.state.get_current_deck_location()).then_return(None)
    decoy.when(
        geometry_store.state.get_well_position("labware-id", "A1", None)
    ).then_return(Point(4, 5, 6))

    with pytest.raises(errors.FailedToPlanMoveError, match="out of bounds"):
        subject.state.get_movement_waypoints(
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="A1",
            well_location=None,
            origin=Point(1, 2, 3),
            origin_cp=None,
            # this max_travel_z is too low and will induce failure
            max_travel_z=1,
        )
