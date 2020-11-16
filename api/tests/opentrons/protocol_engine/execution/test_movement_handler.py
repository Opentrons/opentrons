"""Pipetting command handler."""
import pytest
from mock import AsyncMock, MagicMock, call  # type: ignore[attr-defined]
from typing import List

from opentrons.types import MountType, Mount, Point
from opentrons.hardware_control.types import CriticalPoint
from opentrons.motion_planning import Waypoint

from opentrons.protocol_engine import command_models as cmd
from opentrons.protocol_engine.state import PipetteLocationData
from opentrons.protocol_engine.execution.movement import MovementHandler


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
def state_with_data(
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
    state_with_data: MagicMock,
    hc_with_data: AsyncMock
) -> MovementHandler:
    """Create a PipettingHandler with its dependencies mocked out."""
    return MovementHandler(
        state=state_with_data,
        hardware=hc_with_data
    )


MOVE_REQUESTS: List[cmd.BasePipettingRequest] = [
    cmd.MoveToWellRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="B2"
    ),
    cmd.PickUpTipRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="B2"
    ),
]


@pytest.mark.parametrize("move_request", MOVE_REQUESTS)
async def test_move_requests_pass_waypoints_to_hc(
    move_request: cmd.BasePipettingRequest,
    hc_with_data: AsyncMock,
    handler: MovementHandler
) -> None:
    """Move requests should call hardware controller with movement data."""
    await handler.handle_move_to_well(move_request)

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


@pytest.mark.parametrize("move_request", MOVE_REQUESTS)
async def test_move_requests_get_data_from_state(
    move_request: cmd.BasePipettingRequest,
    state_with_data: MagicMock,
    handler: MovementHandler
) -> None:
    """Move requests should get move parameters from state."""
    await handler.handle_move_to_well(move_request)

    state_with_data.motion.get_pipette_location.assert_called_with(
        move_request.pipetteId,
    )

    state_with_data.motion.get_movement_waypoints.assert_called_with(
        origin=Point(1, 1, 1),
        origin_cp=CriticalPoint.FRONT_NOZZLE,
        max_travel_z=42.0,
        pipette_id=move_request.pipetteId,
        labware_id=move_request.labwareId,
        well_name=move_request.wellName,
    )


async def test_handle_move_to_well_result(handler: MovementHandler) -> None:
    """It should return a MoveToWellResult for a MoveToWellRequest."""
    request = cmd.MoveToWellRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellName="B2",
    )
    result = await handler.handle_move_to_well(request)

    assert result == cmd.MoveToWellResult()
