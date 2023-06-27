"""Unit tests for `runs.light_control_task`."""

import pytest
from typing import Optional
from decoy import Decoy

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import StatusBarState
from opentrons.protocol_engine.types import EngineStatus
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.light_control_task import LightController


@pytest.fixture
def engine_store(decoy: Decoy) -> EngineStore:
    """Mock out the EngineStore."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture
def subject(
    hardware_api: HardwareControlAPI, engine_store: EngineStore
) -> LightController:
    """Test subject - LightController."""
    return LightController(api=hardware_api, engine_store=engine_store)


@pytest.mark.parametrize(
    ["active", "status"],
    [
        [False, EngineStatus.IDLE],
        [True, EngineStatus.IDLE],
        [True, EngineStatus.RUNNING],
        [False, EngineStatus.FAILED],
    ],
)
async def test_get_current_status(
    decoy: Decoy,
    engine_store: EngineStore,
    subject: LightController,
    active: bool,
    status: EngineStatus,
) -> None:
    """Test LightController.get_current_status."""
    decoy.when(engine_store.current_run_id).then_return("fake_id" if active else None)
    decoy.when(engine_store.engine.state_view.commands.get_status()).then_return(status)

    expected = status if active else None

    assert subject.get_current_status() == expected


@pytest.mark.parametrize(
    ["prev_state", "new_state", "expected"],
    [
        [None, None, StatusBarState.IDLE],
        [EngineStatus.IDLE, None, StatusBarState.IDLE],
        [EngineStatus.IDLE, EngineStatus.IDLE, None],
        [None, EngineStatus.IDLE, StatusBarState.IDLE],
        [None, EngineStatus.PAUSED, StatusBarState.PAUSED],
        [
            EngineStatus.RUNNING,
            EngineStatus.BLOCKED_BY_OPEN_DOOR,
            StatusBarState.PAUSED,
        ],
        [EngineStatus.RUNNING, EngineStatus.FAILED, StatusBarState.HARDWARE_ERROR],
        [EngineStatus.RUNNING, EngineStatus.SUCCEEDED, StatusBarState.RUN_COMPLETED],
        [EngineStatus.RUNNING, EngineStatus.STOP_REQUESTED, StatusBarState.UPDATING],
        [EngineStatus.STOP_REQUESTED, EngineStatus.STOPPED, StatusBarState.IDLE],
        [EngineStatus.RUNNING, EngineStatus.FINISHING, StatusBarState.UPDATING],
    ],
)
async def test_light_controller_update(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    subject: LightController,
    prev_state: Optional[EngineStatus],
    new_state: Optional[EngineStatus],
    expected: StatusBarState,
) -> None:
    """Test LightController.update.

    Verifies that the status bar is NOT updated if the state is the same, and
    checks that state mapping is correct.
    """
    await subject.update(prev_status=prev_state, new_status=new_state)

    call_count = 0 if prev_state == new_state else 1

    decoy.verify(
        await hardware_api.set_status_bar_state(state=expected), times=call_count
    )
