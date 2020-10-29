"""Pipetting command handler."""
import pytest
from mock import AsyncMock, MagicMock, call  # type: ignore[attr-defined]

from opentrons.types import MountType, Mount, Point
from opentrons.hardware_control.types import CriticalPoint

from opentrons.protocol_engine.state import PipetteData
from opentrons.protocol_engine.command_models import MoveToWellRequest
from opentrons.protocol_engine.execution.pipetting import PipettingHandler


@pytest.fixture
def mock_get_waypoints() -> MagicMock:
    return MagicMock


@pytest.fixture
def handler(
    mock_hardware: AsyncMock,
    mock_get_waypoints: MagicMock
) -> PipettingHandler:
    return PipettingHandler(
        hardware=mock_hardware,
        get_waypoints=mock_get_waypoints
    )


async def test_handle_move_to_passes_waypoint_to_hc(
    mock_state: MagicMock,
    mock_hardware: AsyncMock,
    mock_get_waypoints: MagicMock,
    handler: PipettingHandler
) -> None:
    """It should call hardware.move_to with the waypoint."""
    pipette_data = PipetteData(
        mount=MountType.LEFT,
        pipette_name="p300_single"
    )

    waypoints = [
        (Point(1, 2, 3), CriticalPoint.XY_CENTER),
        (Point(4, 5, 6), None)
    ]

    mock_state.get_pipette_data_by_id.return_value = pipette_data
    mock_get_waypoints.return_value = waypoints

    req = MoveToWellRequest(
        pipetteId="pipette-id",
        labwareId="labware-id",
        wellId="A1"
    )

    await handler.handle_move_to_well(req)

    assert mock_get_waypoints.assert_called_once()
    assert mock_hardware.move_to.call_count == 2
    mock_hardware.move_to.assert_any_call(
        mount=Mount.LEFT,
        abs_position=Point(1, 2, 3),
        critical_point=CriticalPoint.XY_CENTER
    )
    # mock_hardware.move_to.assert_has_calls([
    #     call(
    #         mount=Mount.LEFT,
    #         abs_position=Point(1, 2, 3),
    #         critical_point=CriticalPoint.XY_CENTER
    #     ),
    #     call(
    #         mount=Mount.LEFT,
    #         abs_position=Point(4, 5, 6),
    #         critical_point=None
    #     ),
    # ])
