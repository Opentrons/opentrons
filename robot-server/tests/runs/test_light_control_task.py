"""Unit tests for `runs.light_control_task`."""

from __future__ import annotations

from typing import List, Optional

import pytest
from decoy import Decoy, matchers

from opentrons.hardware_control import HardwareControlAPI
from opentrons.hardware_control.types import (
    EstopState,
    EstopStateNotification,
    StatusBarState,
    SubSystem,
    SubsystemConnectionNotification,
    SubSystemState,
    UpdateState,
)
from opentrons.protocol_engine.types import EngineStatus
from server_utils.fastapi_utils.app_state import AppState

from robot_server.hardware import HardwareStateStore
from robot_server.runs.light_control_task import LightController, Status
from robot_server.runs.run_orchestrator_store import RunOrchestratorStore


@pytest.fixture
def run_orchestrator_store(decoy: Decoy) -> RunOrchestratorStore:
    """Mock out the EngineStore."""
    return decoy.mock(cls=RunOrchestratorStore)


@pytest.fixture
async def subject(
    hardware_api: HardwareControlAPI,
    hardware_state_store: HardwareStateStore,
    run_orchestrator_store: RunOrchestratorStore,
    decoy: Decoy,
    mock_app_state: AppState,
) -> LightController:
    """Test subject - LightController."""
    return LightController(
        api=hardware_api,
        run_orchestrator_store=run_orchestrator_store,
        hardware_state_store=hardware_state_store,
    )


@pytest.fixture
def mock_app_state(decoy: Decoy) -> AppState:
    """Get a mock AppState."""
    return decoy.mock(cls=AppState)


@pytest.mark.parametrize(
    [
        "active",
        "status",
        "estop",
    ],
    [
        [False, EngineStatus.IDLE, EstopState.DISENGAGED],
        [True, EngineStatus.IDLE, EstopState.PHYSICALLY_ENGAGED],
        [True, EngineStatus.RUNNING, EstopState.LOGICALLY_ENGAGED],
        [False, EngineStatus.FAILED, EstopState.NOT_PRESENT],
    ],
)
async def test_get_current_status_ot2(
    decoy: Decoy,
    run_orchestrator_store: RunOrchestratorStore,
    subject: LightController,
    active: bool,
    status: EngineStatus,
    estop: EstopState,
    hardware_api: HardwareControlAPI,
    hardware_state_store: HardwareStateStore,
) -> None:
    """Test LightController.get_current_status."""
    decoy.when(run_orchestrator_store.current_run_id).then_return(
        "fake_id" if active else None
    )
    decoy.when(await run_orchestrator_store.get_status()).then_return(status)
    await hardware_state_store.update_hardware_status_callback(
        event=EstopStateNotification(new_state=estop)
    )

    expected = Status(
        active_updates=[],
        estop_status=estop,
        engine_status=status if active else None,
    )

    assert await subject.get_current_status() == expected


@pytest.mark.parametrize(
    "active_updates",
    [
        [SubSystem.gantry_x, SubSystem.gantry_y, SubSystem.rear_panel],
        [],
        [SubSystem.gantry_x],
    ],
)
async def test_get_current_status(
    decoy: Decoy,
    subject: LightController,
    hardware_api: HardwareControlAPI,
    active_updates: List[SubSystem],
) -> None:
    """Primarily tests converting present subsystems to a list of updates."""
    all_nodes = [
        SubSystem.gantry_x,
        SubSystem.gantry_y,
        SubSystem.rear_panel,
        SubSystem.head,
    ]

    decoy.when(hardware_api.attached_subsystems).then_raise(
        RuntimeError("not allowed to call this")
    )
    await subject._hardware_state_store.update_hardware_status_callback(
        event=SubsystemConnectionNotification(
            tracked_subsystems={
                node: SubSystemState(
                    ok=True,
                    current_fw_version=1,
                    next_fw_version=1,
                    fw_update_needed=False,
                    current_fw_sha="abcdefg",
                    pcba_revision="fake_pcb",
                    update_state=(
                        UpdateState.updating if node in active_updates else None
                    ),
                )
                for node in all_nodes
            },
        )
    )

    current_status = await subject.get_current_status()
    result = current_status.active_updates
    assert len(result) == len(active_updates)
    for subsystem in result:
        assert subsystem in active_updates


@pytest.mark.parametrize(
    ["prev_state", "new_state", "initialized", "expected"],
    [
        [None, None, True, StatusBarState.IDLE],
        [EngineStatus.IDLE, None, True, StatusBarState.IDLE],
        [EngineStatus.IDLE, EngineStatus.IDLE, True, None],
        [None, EngineStatus.IDLE, True, StatusBarState.IDLE],
        [None, EngineStatus.PAUSED, True, StatusBarState.PAUSED],
        [
            EngineStatus.RUNNING,
            EngineStatus.BLOCKED_BY_OPEN_DOOR,
            True,
            StatusBarState.PAUSED,
        ],
        [
            EngineStatus.RUNNING,
            EngineStatus.FAILED,
            True,
            StatusBarState.HARDWARE_ERROR,
        ],
        [
            EngineStatus.RUNNING,
            EngineStatus.SUCCEEDED,
            True,
            StatusBarState.RUN_COMPLETED,
        ],
        [
            EngineStatus.RUNNING,
            EngineStatus.STOP_REQUESTED,
            True,
            StatusBarState.UPDATING,
        ],
        [EngineStatus.STOP_REQUESTED, EngineStatus.STOPPED, True, StatusBarState.IDLE],
        [None, EngineStatus.IDLE, False, StatusBarState.OFF],
        [EngineStatus.RUNNING, EngineStatus.FINISHING, True, StatusBarState.UPDATING],
    ],
)
async def test_light_controller_update(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    subject: LightController,
    prev_state: Optional[EngineStatus],
    new_state: Optional[EngineStatus],
    expected: StatusBarState,
    initialized: bool,
) -> None:
    """Test LightController.update.

    Verifies that the status bar is NOT updated if the state is the same, and
    checks that state mapping is correct.
    """
    if initialized:
        subject.mark_initialization_done()
    await subject.update(
        prev_status=Status(
            active_updates=[],
            estop_status=EstopState.DISENGAGED,
            engine_status=prev_state,
        ),
        new_status=Status(
            active_updates=[],
            estop_status=EstopState.DISENGAGED,
            engine_status=new_state,
        ),
    )

    call_count = 0 if prev_state == new_state else 1

    decoy.verify(
        await hardware_api.set_status_bar_state(state=expected), times=call_count
    )


async def test_provide_run_orchestrator_store(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    hardware_state_store: HardwareStateStore,
    run_orchestrator_store: RunOrchestratorStore,
    mock_app_state: AppState,
) -> None:
    """Test providing an engine store after initialization."""
    subject = LightController(
        api=hardware_api,
        run_orchestrator_store=None,
        hardware_state_store=hardware_state_store,
    )
    await hardware_state_store.update_hardware_status_callback(
        event=EstopStateNotification(new_state=EstopState.DISENGAGED)
    )
    assert await subject.get_current_status() == Status(
        active_updates=[],
        estop_status=EstopState.DISENGAGED,
        engine_status=None,
    )

    decoy.when(run_orchestrator_store.current_run_id).then_return("fake_id")
    decoy.when(await run_orchestrator_store.get_status()).then_return(
        EngineStatus.RUNNING
    )

    subject.update_run_orchestrator_store(run_orchestrator_store=run_orchestrator_store)
    assert await subject.get_current_status() == Status(
        active_updates=[],
        estop_status=EstopState.DISENGAGED,
        engine_status=EngineStatus.RUNNING,
    )


async def test_estop_precedence(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    subject: LightController,
) -> None:
    """Test that the estop is prioritized."""
    # Software error
    await subject.update(
        prev_status=Status([], EstopState.PHYSICALLY_ENGAGED, None),
        new_status=Status([], EstopState.PHYSICALLY_ENGAGED, EngineStatus.RUNNING),
    )
    # Running
    await subject.update(
        prev_status=Status([], EstopState.PHYSICALLY_ENGAGED, EngineStatus.RUNNING),
        new_status=Status([], EstopState.LOGICALLY_ENGAGED, EngineStatus.RUNNING),
    )
    # Software error
    await subject.update(
        prev_status=Status([], EstopState.LOGICALLY_ENGAGED, EngineStatus.RUNNING),
        new_status=Status([], EstopState.PHYSICALLY_ENGAGED, EngineStatus.IDLE),
    )
    # Software error even though there's an update
    await subject.update(
        prev_status=Status([], EstopState.LOGICALLY_ENGAGED, EngineStatus.RUNNING),
        new_status=Status(
            [SubSystem.gantry_x], EstopState.PHYSICALLY_ENGAGED, EngineStatus.IDLE
        ),
    )
    # Updating takes precedence over the engine status once estop is released
    await subject.update(
        prev_status=Status(
            [SubSystem.gantry_x], EstopState.PHYSICALLY_ENGAGED, EngineStatus.IDLE
        ),
        new_status=Status(
            [SubSystem.gantry_x], EstopState.LOGICALLY_ENGAGED, EngineStatus.IDLE
        ),
    )

    decoy.verify(
        await hardware_api.set_status_bar_state(state=StatusBarState.SOFTWARE_ERROR),
        await hardware_api.set_status_bar_state(state=StatusBarState.RUNNING),
        await hardware_api.set_status_bar_state(state=StatusBarState.SOFTWARE_ERROR),
        await hardware_api.set_status_bar_state(state=StatusBarState.SOFTWARE_ERROR),
        await hardware_api.set_status_bar_state(state=StatusBarState.UPDATING),
    )


@pytest.mark.parametrize(
    ["previous_updates", "current_updates", "initialized", "expected"],
    [
        [[], [SubSystem.rear_panel], True, None],
        [[], [SubSystem.gantry_x], True, StatusBarState.UPDATING],
        [[], [SubSystem.gantry_x], False, StatusBarState.UPDATING],
        [
            [SubSystem.rear_panel, SubSystem.gantry_x],
            [SubSystem.gantry_x],
            True,
            StatusBarState.UPDATING,
        ],
        [[SubSystem.gantry_y, SubSystem.gantry_x], [SubSystem.gantry_x], True, None],
        [[SubSystem.gantry_y, SubSystem.gantry_x], [], True, StatusBarState.IDLE],
        [[SubSystem.gantry_y, SubSystem.gantry_x], [], False, StatusBarState.OFF],
    ],
)
async def test_light_control_updates(
    decoy: Decoy,
    hardware_api: HardwareControlAPI,
    subject: LightController,
    previous_updates: List[SubSystem],
    current_updates: List[SubSystem],
    initialized: bool,
    expected: Optional[StatusBarState],
) -> None:
    """Test logic for ongoing subsystem updates."""
    if initialized:
        subject.mark_initialization_done()

    if expected is None:
        decoy.when(
            await hardware_api.set_status_bar_state(state=matchers.Anything())  # type: ignore[func-returns-value]
        ).then_raise(RuntimeError("Test failed: unexpected call"))

    await subject.update(
        prev_status=Status(previous_updates, EstopState.DISENGAGED, None),
        new_status=Status(current_updates, EstopState.DISENGAGED, None),
    )

    if expected is not None:
        decoy.verify(await hardware_api.set_status_bar_state(state=expected), times=1)
