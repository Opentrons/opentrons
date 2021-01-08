"""Pipetting command handler."""
import pytest
from decoy import Decoy

from opentrons.types import MountType, Mount, Point
from opentrons.hardware_control.api import API as HardwareAPI
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine import StateView, DeckLocation, WellLocation, WellOrigin
from opentrons.protocol_engine.state import PipetteLocationData
from opentrons.protocol_engine.execution.movement import MovementHandler


# TODO(mc, 2020-01-07): move to protocol_engine conftest
@pytest.fixture
def mock_state_view(decoy: Decoy) -> StateView:
    """Get a mock in the shape of a StateView."""
    return decoy.create_decoy(spec=StateView)


@pytest.fixture
def handler(
    mock_state_view: StateView,
    mock_hw_controller: HardwareAPI
) -> MovementHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return MovementHandler(
        state=mock_state_view,
        hardware=mock_hw_controller
    )


async def test_move_to_well(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hw_controller: HardwareAPI,
    handler: MovementHandler,
) -> None:
    """Move requests should call hardware controller with movement data."""
    well_location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

    decoy.when(
        mock_state_view.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_location=None,
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.LEFT,
            critical_point=CriticalPoint.FRONT_NOZZLE,
        )
    )

    decoy.when(
        await mock_hw_controller.gantry_position(
            mount=Mount.LEFT,
            critical_point=CriticalPoint.FRONT_NOZZLE,
        )
    ).then_return(Point(1, 1, 1))

    decoy.when(
        mock_hw_controller.get_instrument_max_height(mount=Mount.LEFT)
    ).then_return(42.0)

    decoy.when(
        mock_state_view.motion.get_movement_waypoints(
            origin=Point(1, 1, 1),
            origin_cp=CriticalPoint.FRONT_NOZZLE,
            max_travel_z=42.0,
            pipette_id="pipette-id",
            labware_id="labware-id",
            well_name="B2",
            well_location=well_location,
            current_location=None,
        )
    ).then_return(
        [
            Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER),
            Waypoint(Point(4, 5, 6))
        ]
    )

    await handler.move_to_well(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2",
        well_location=well_location,
    )

    decoy.verify(
        await mock_hw_controller.move_to(
            mount=Mount.LEFT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER
        ),
        await mock_hw_controller.move_to(
            mount=Mount.LEFT,
            abs_position=Point(4, 5, 6),
            critical_point=None
        ),
    )


async def test_move_to_well_from_starting_location(
    decoy: Decoy,
    mock_state_view: StateView,
    mock_hw_controller: HardwareAPI,
    handler: MovementHandler,
) -> None:
    """It should be able to move to a well from a start location."""
    well_location = WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1))

    current_location = DeckLocation(
        pipette_id="pipette-id",
        labware_id="labware-id",
        well_name="B2"
    )

    decoy.when(
        mock_state_view.motion.get_pipette_location(
            pipette_id="pipette-id",
            current_location=current_location,
        )
    ).then_return(
        PipetteLocationData(
            mount=MountType.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    )

    decoy.when(
        await mock_hw_controller.gantry_position(
            mount=Mount.RIGHT,
            critical_point=CriticalPoint.XY_CENTER,
        )
    ).then_return(Point(1, 2, 5))

    decoy.when(
        mock_hw_controller.get_instrument_max_height(mount=Mount.RIGHT)
    ).then_return(42.0)

    decoy.when(
        mock_state_view.motion.get_movement_waypoints(
            current_location=current_location,
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
        current_location=current_location,
    )

    decoy.verify(
        await mock_hw_controller.move_to(
            mount=Mount.RIGHT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER
        ),
    )
