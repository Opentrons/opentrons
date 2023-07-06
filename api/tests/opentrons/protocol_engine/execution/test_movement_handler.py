"""MovementHandler command subject."""
import pytest
from decoy import Decoy
from typing import NamedTuple

from opentrons.types import MountType, Point, DeckSlotName
from opentrons.hardware_control import API as HardwareAPI
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine.types import (
    DeckPoint,
    MovementAxis,
    WellLocation,
    WellOrigin,
    WellOffset,
    DeckSlotLocation,
    CurrentWell,
    MotorAxis,
)
from opentrons.protocol_engine.state import (
    StateStore,
    PipetteLocationData,
)
from opentrons.protocol_engine.execution.movement import MovementHandler
from opentrons.protocol_engine.execution.thermocycler_movement_flagger import (
    ThermocyclerMovementFlagger,
)
from opentrons.protocol_engine.execution.heater_shaker_movement_flagger import (
    HeaterShakerMovementFlagger,
)
from opentrons.protocol_engine.execution.gantry_mover import GantryMover


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def thermocycler_movement_flagger(decoy: Decoy) -> ThermocyclerMovementFlagger:
    """Get a mock in the shape of a ThermocyclerMovementFlagger."""
    return decoy.mock(cls=ThermocyclerMovementFlagger)


@pytest.fixture
def heater_shaker_movement_flagger(decoy: Decoy) -> HeaterShakerMovementFlagger:
    """Get a mock in the shape of a HeaterShakerMovementFlagger."""
    return decoy.mock(cls=HeaterShakerMovementFlagger)


@pytest.fixture
def mock_gantry_mover(decoy: Decoy) -> GantryMover:
    """Get a mock in the shape of a GantryMover."""
    return decoy.mock(cls=GantryMover)


@pytest.fixture
def subject(
    state_store: StateStore,
    hardware_api: HardwareAPI,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    heater_shaker_movement_flagger: HeaterShakerMovementFlagger,
    mock_gantry_mover: GantryMover,
) -> MovementHandler:
    """Create a MovementHandler with its dependencies mocked out."""
    return MovementHandler(
        state_store=state_store,
        hardware_api=hardware_api,
        thermocycler_movement_flagger=thermocycler_movement_flagger,
        heater_shaker_movement_flagger=heater_shaker_movement_flagger,
        gantry_mover=mock_gantry_mover,
    )


async def test_move_to_well(
    decoy: Decoy,
    state_store: StateStore,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    heater_shaker_movement_flagger: HeaterShakerMovementFlagger,
    mock_gantry_mover: GantryMover,
    subject: MovementHandler,
) -> None:
    """Move requests should call hardware controller with movement data."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
    )
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    decoy.when(
        state_store.modules.get_heater_shaker_movement_restrictors()
    ).then_return([])

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        DeckSlotName.SLOT_1
    )

    decoy.when(state_store.tips.get_pipette_channels("pipette-id")).then_return(1)
    decoy.when(state_store.labware.is_tiprack("labware-id")).then_return(False)

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_well=None,
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.FRONT_NOZZLE,
        )
    )

    decoy.when(
        await mock_gantry_mover.get_position(
            pipette_id="pipette-id",
        )
    ).then_return(Point(1, 1, 1))

    decoy.when(mock_gantry_mover.get_max_travel_z(pipette_id="pipette-id")).then_return(
        42.0
    )

    decoy.when(
        state_store.pipettes.get_movement_speed(
            pipette_id="pipette-id", requested_speed=45.6
        )
    ).then_return(39339.5)

    decoy.when(
        state_store.motion.get_movement_waypoints_to_well(
            origin=Point(1, 1, 1),
            origin_cp=CriticalPoint.FRONT_NOZZLE,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
            current_well=None,
            force_direct=True,
            minimum_z_height=12.3,
        )
    ).then_return(
        [Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER), Waypoint(Point(4, 5, 6))]
    )

    decoy.when(
        await mock_gantry_mover.move_to(
            pipette_id="pipette-id",
            waypoints=[
                Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER),
                Waypoint(Point(4, 5, 6)),
            ],
            speed=39339.5,
        ),
    ).then_return(Point(4, 5, 6))

    result = await subject.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
        force_direct=True,
        minimum_z_height=12.3,
        speed=45.6,
    )

    assert result == Point(x=4, y=5, z=6)

    decoy.verify(
        await thermocycler_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        ),
        heater_shaker_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=[],
            destination_slot=1,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        ),
    )


async def test_move_to_well_from_starting_location(
    decoy: Decoy,
    state_store: StateStore,
    thermocycler_movement_flagger: ThermocyclerMovementFlagger,
    heater_shaker_movement_flagger: HeaterShakerMovementFlagger,
    mock_gantry_mover: GantryMover,
    subject: MovementHandler,
) -> None:
    """It should be able to move to a well from a start location."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
    )

    current_well = CurrentWell(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
    )
    decoy.when(state_store.labware.get_location(labware_id="labware-id")).then_return(
        DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
    )
    decoy.when(
        state_store.modules.get_heater_shaker_movement_restrictors()
    ).then_return([])

    decoy.when(state_store.geometry.get_ancestor_slot_name("labware-id")).then_return(
        DeckSlotName.SLOT_1
    )

    decoy.when(state_store.tips.get_pipette_channels("pipette-id")).then_return(1)
    decoy.when(state_store.labware.is_tiprack("labware-id")).then_return(False)

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_well=current_well,
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await mock_gantry_mover.get_position(
            pipette_id="pipette-id",
        )
    ).then_return(Point(1, 2, 5))

    decoy.when(mock_gantry_mover.get_max_travel_z(pipette_id="pipette-id")).then_return(
        42.0
    )

    decoy.when(
        state_store.motion.get_movement_waypoints_to_well(
            current_well=current_well,
            origin=Point(1, 2, 5),
            origin_cp=CriticalPoint.XY_CENTER,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
            force_direct=False,
            minimum_z_height=None,
        )
    ).then_return([Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER)])

    decoy.when(
        state_store.pipettes.get_movement_speed(
            pipette_id="pipette-id", requested_speed=None
        )
    ).then_return(39339.5)

    decoy.when(
        await mock_gantry_mover.move_to(
            pipette_id="pipette-id",
            waypoints=[Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER)],
            speed=39339.5,
        ),
    ).then_return(Point(4, 5, 6))

    result = await subject.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
        current_well=current_well,
    )

    assert result == Point(4, 5, 6)

    decoy.verify(
        await thermocycler_movement_flagger.raise_if_labware_in_non_open_thermocycler(
            labware_parent=DeckSlotLocation(slotName=DeckSlotName.SLOT_1)
        ),
        heater_shaker_movement_flagger.raise_if_movement_restricted(
            hs_movement_restrictors=[],
            destination_slot=1,
            is_multi_channel=False,
            destination_is_tip_rack=False,
        ),
    )


class MoveRelativeSpec(NamedTuple):
    """Test data for move_relative."""

    axis: MovementAxis
    expected_delta: Point
    distance: float = 42.0


@pytest.mark.parametrize(
    MoveRelativeSpec._fields,
    [
        MoveRelativeSpec(
            axis=MovementAxis.X,
            expected_delta=Point(x=42.0, y=0, z=0),
        ),
        MoveRelativeSpec(
            axis=MovementAxis.Y,
            expected_delta=Point(x=0, y=42.0, z=0),
        ),
        MoveRelativeSpec(
            axis=MovementAxis.Z,
            expected_delta=Point(x=0, y=0, z=42.0),
        ),
    ],
)
async def test_move_relative(
    decoy: Decoy,
    state_store: StateStore,
    mock_gantry_mover: GantryMover,
    subject: MovementHandler,
    axis: MovementAxis,
    expected_delta: Point,
    distance: float,
) -> None:
    """Test that move_relative triggers a relative move with the HardwareAPI."""
    decoy.when(
        await mock_gantry_mover.move_relative(
            pipette_id="pipette-id",
            delta=expected_delta,
            speed=39339.5,
        )
    ).then_return(Point(x=1, y=2, z=3))

    decoy.when(
        state_store.pipettes.get_movement_speed(pipette_id="pipette-id")
    ).then_return(39339.5)

    result = await subject.move_relative(
        pipette_id="pipette-id",
        axis=axis,
        distance=distance,
    )

    assert result == Point(x=1, y=2, z=3)


async def test_move_to_coordinates(
    decoy: Decoy,
    state_store: StateStore,
    mock_gantry_mover: GantryMover,
    subject: MovementHandler,
) -> None:
    """Test that move_to_coordinates correctly calls api.move_to."""
    current_position = Point(4.44, 5.55, 6.66)
    destination_deck = DeckPoint(x=1.11, y=2.22, z=3.33)
    destination_point = Point(1.11, 2.22, 3.33)

    planned_waypoint_1 = Waypoint(position=Point(3, 1, 4), critical_point=None)
    planned_waypoint_2 = Waypoint(
        position=Point(1, 5, 9), critical_point=CriticalPoint.XY_CENTER
    )

    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await mock_gantry_mover.get_position(pipette_id="pipette-id")
    ).then_return(current_position)

    decoy.when(mock_gantry_mover.get_max_travel_z(pipette_id="pipette-id")).then_return(
        5678
    )

    decoy.when(
        state_store.motion.get_movement_waypoints_to_coords(
            origin=current_position,
            dest=destination_point,
            max_travel_z=5678,
            direct=True,
            additional_min_travel_z=1234,
        )
    ).then_return([planned_waypoint_1, planned_waypoint_2])

    decoy.when(
        state_store.pipettes.get_movement_speed(
            pipette_id="pipette-id", requested_speed=567
        )
    ).then_return(39339.5)

    decoy.when(
        await mock_gantry_mover.move_to(
            pipette_id="pipette-id",
            waypoints=[planned_waypoint_1, planned_waypoint_2],
            speed=39339.5,
        )
    ).then_return(Point(x=1, y=5, z=9))

    result = await subject.move_to_coordinates(
        pipette_id="pipette-id",
        deck_coordinates=destination_deck,
        direct=True,
        additional_min_travel_z=1234,
        speed=567,
    )

    assert result == Point(x=1, y=5, z=9)


async def test_retract_axis(
    decoy: Decoy,
    state_store: StateStore,
    mock_gantry_mover: GantryMover,
    subject: MovementHandler,
) -> None:
    """It should delegate to gantry mover to retract the specified axis."""
    await subject.retract_axis(axis=MotorAxis.RIGHT_Z)

    decoy.verify(await mock_gantry_mover.retract_axis(MotorAxis.RIGHT_Z), times=1)
