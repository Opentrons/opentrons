"""Pipetting command handler."""
import pytest
from decoy import Decoy

from opentrons.types import MountType, Mount, Point
from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine import WellLocation, WellOrigin, WellOffset
from opentrons.protocol_engine.state import (
    StateStore,
    PipetteLocationData,
    CurrentWell,
    HardwarePipette,
)
from opentrons.protocol_engine.execution.movement import (
    MovementHandler,
    SavedPositionData,
)

from .mock_defs import MockPipettes


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock in the shape of a HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def mock_hw_pipettes(hardware_api: HardwareAPI) -> MockPipettes:
    """Get mock pipette configs and attach them to the mock HW controller."""
    mock_hw_pipettes = MockPipettes()
    hardware_api.attached_instruments = mock_hw_pipettes.by_mount  # type: ignore[misc]
    return mock_hw_pipettes


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock in the shape of a StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def handler(state_store: StateStore, hardware_api: HardwareAPI) -> MovementHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return MovementHandler(state_store=state_store, hardware_api=hardware_api)


async def test_move_to_well(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    handler: MovementHandler,
) -> None:
    """Move requests should call hardware controller with movement data."""
    well_location = WellLocation(
        origin=WellOrigin.BOTTOM,
        offset=WellOffset(x=0, y=0, z=1),
    )

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
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.FRONT_NOZZLE,
        )
    ).then_return(Point(1, 1, 1))

    decoy.when(hardware_api.get_instrument_max_height(mount=Mount.LEFT)).then_return(
        42.0
    )

    decoy.when(
        state_store.motion.get_movement_waypoints(
            origin=Point(1, 1, 1),
            origin_cp=CriticalPoint.FRONT_NOZZLE,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
            current_well=None,
        )
    ).then_return(
        [Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER), Waypoint(Point(4, 5, 6))]
    )

    await handler.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER,
        ),
        await hardware_api.move_to(
            mount=Mount.LEFT,
            abs_position=Point(4, 5, 6),
            critical_point=None,
        ),
    )


async def test_move_to_well_from_starting_location(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    handler: MovementHandler,
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
        await hardware_api.gantry_position(
            mount=Mount.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    ).then_return(Point(1, 2, 5))

    decoy.when(hardware_api.get_instrument_max_height(mount=Mount.RIGHT)).then_return(
        42.0
    )

    decoy.when(
        state_store.motion.get_movement_waypoints(
            current_well=current_well,
            origin=Point(1, 2, 5),
            origin_cp=CriticalPoint.XY_CENTER,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
        )
    ).then_return([Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER)])

    await handler.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
        current_well=current_well,
    )

    decoy.verify(
        await hardware_api.move_to(
            mount=Mount.RIGHT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER,
        ),
    )


async def test_save_position(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    handler: MovementHandler,
) -> None:
    """Test that `save_position` fetches gantry position from hardwareAPI."""
    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    ).then_return(Point(1, 1, 1))

    result = await handler.save_position(pipette_id="pipette-id", position_id="123")
    assert result == SavedPositionData(positionId="123", position=Point(1, 1, 1))


@pytest.mark.parametrize(
    argnames=["unverified_cp", "tip_length", "verified_cp"],
    argvalues=[
        [None, 0, CriticalPoint.NOZZLE],
        [None, 999, CriticalPoint.TIP],
        [CriticalPoint.XY_CENTER, 999, CriticalPoint.XY_CENTER],
    ],
)
async def test_save_position_different_cp(
    decoy: Decoy,
    state_store: StateStore,
    hardware_api: HardwareAPI,
    handler: MovementHandler,
    mock_hw_pipettes: MockPipettes,
    unverified_cp,
    tip_length,
    verified_cp,
) -> None:
    """Test that `save_position` selects correct critical point."""
    decoy.when(
        state_store.motion.get_pipette_location(
            pipette_id="pipette-id",
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=unverified_cp,
        )
    )

    mock_hw_pipettes.left_config.update({"tip_length": tip_length})
    decoy.when(
        state_store.pipettes.get_hardware_pipette(
            pipette_id="pipette-id",
            attached_pipettes=mock_hw_pipettes.by_mount,
        )
    ).then_return(
        HardwarePipette(mount=Mount.LEFT, config=mock_hw_pipettes.left_config)
    )
    await handler.save_position(pipette_id="pipette-id", position_id="123")
    decoy.verify(
        await hardware_api.gantry_position(
            mount=Mount.LEFT,
            critical_point=verified_cp,
        )
    )
