"""Pipetting command handler."""
import pytest
from mock import AsyncMock, MagicMock, call  # type: ignore[attr-defined]
from typing import List

from opentrons.types import MountType, Mount, Point
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine import StateStore
from opentrons.protocol_engine.state import PipetteLocationData
from opentrons.protocol_engine.command_models import MoveToWellRequest
from opentrons.protocol_engine.execution.pipetting import PipettingHandler


@pytest.fixture
def move_to_well_request() -> MoveToWellRequest:
    """Get an example MoveToWellRequest."""
    return MoveToWellRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="B2"
    )


@pytest.fixture
def pipette_location_data() -> PipetteLocationData:
    """Get an example PipetteLocationData."""
    return PipetteLocationData(
        mount=MountType.LEFT,
        critical_point=CriticalPoint.FRONT_NOZZLE,
    )


@pytest.fixture
def waypoints() -> List[Waypoint]:
    """Get a list of example Waypoints."""
    return [
        Waypoint(Point(1, 2, 3), CriticalPoint.XY_CENTER),
        Waypoint(Point(4, 5, 6))
    ]


@pytest.fixture
def store_with_data(
    mock_state_view: MagicMock,
    pipette_location_data: PipetteLocationData,
    waypoints: List[Waypoint],
) -> MagicMock:
    """Prime a mock StateView with example data."""
    mock_state_view.motion.get_pipette_location.return_value = \
        pipette_location_data
    mock_state_view.motion.get_movement_waypoints.return_value = waypoints

    return mock_state_view


@pytest.fixture
def hc_with_data(
    mock_hardware: AsyncMock,
) -> MagicMock:
    """Prime a mock HardwareController with example data."""
    mock_hardware.gantry_position.return_value = Point(1, 1, 1)
    mock_hardware.get_instrument_max_height.return_value = 42.0
    return mock_hardware


@pytest.fixture
def handler(
    store_with_data: StateStore,
    hc_with_data: AsyncMock
) -> PipettingHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return PipettingHandler(
        state=store_with_data,
        hardware=hc_with_data
    )


async def test_handle_move_to_passes_waypoint_to_hc(
    move_to_well_request: MoveToWellRequest,
    hc_with_data: AsyncMock,
    handler: PipettingHandler
) -> None:
    """It should call hardware control with the movement data."""
    await handler.handle_move_to_well(move_to_well_request)

    hc_with_data.gantry_position.assert_called_with(
        mount=Mount.LEFT,
        critical_point=CriticalPoint.FRONT_NOZZLE,
    )

    hc_with_data.get_instrument_max_height.assert_called_with(
        mount=Mount.LEFT,
    )

    assert hc_with_data.move_to.call_count == 2
    hc_with_data.move_to.assert_has_calls([
        call(
            mount=Mount.LEFT,
            abs_position=Point(1, 2, 3),
            critical_point=CriticalPoint.XY_CENTER
        ),
        call(
            mount=Mount.LEFT,
            abs_position=Point(4, 5, 6),
            critical_point=None
        ),
    ])


async def test_handle_move_to_gets_movement_data_from_state(
    move_to_well_request: MoveToWellRequest,
    store_with_data: MagicMock,
    handler: PipettingHandler
) -> None:
    """It should call state.get_movement_waypoints with request data."""
    await handler.handle_move_to_well(move_to_well_request)

    store_with_data.motion.get_pipette_location.assert_called_with(
        pipette_id=move_to_well_request.pipetteId,
    )

    store_with_data.motion.get_movement_waypoints.assert_called_with(
        origin=Point(1, 1, 1),
        origin_cp=CriticalPoint.FRONT_NOZZLE,
        max_travel_z=42.0,
        pipette_id=move_to_well_request.pipetteId,
        labware_id=move_to_well_request.labwareId,
        well_name=move_to_well_request.wellName,
    )
