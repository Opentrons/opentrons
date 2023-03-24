"""Tests for RunController."""
from typing import List

import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine import (
    EngineStatus,
    StateSummary,
    commands as pe_commands,
    errors as pe_errors,
)
from opentrons.protocol_runner import ProtocolRunResult

from robot_server.service.task_runner import TaskRunner
from robot_server.maintenance_run.maintenance_action_models import (
    MaintenanceRunAction,
    MaintenanceRunActionType,
)
from robot_server.maintenance_run.engine_store import EngineStore
from robot_server.maintenance_run.maintenance_run_controller import (
    MaintenanceRunController,
    RunActionNotAllowedError,
)


@pytest.fixture
def mock_engine_store(decoy: Decoy, run_id: str) -> EngineStore:
    """Get a mock EngineStore."""
    mock = decoy.mock(cls=EngineStore)
    decoy.when(mock.current_run_id).then_return(run_id)
    return mock


@pytest.fixture
def mock_task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def run_id() -> str:
    """A run identifier value."""
    return "hello world"


@pytest.fixture
def engine_state_summary() -> StateSummary:
    """Get a StateSummary value object."""
    return StateSummary(
        status=EngineStatus.IDLE,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
        liquids=[],
    )


@pytest.fixture
def protocol_commands() -> List[pe_commands.Command]:
    """Get a StateSummary value object."""
    return [
        pe_commands.WaitForResume.construct(  # type: ignore[call-arg]
            params=pe_commands.WaitForResumeParams(message="hello world")
        )
    ]


@pytest.fixture
def subject(
    run_id: str,
    mock_engine_store: EngineStore,
    mock_task_runner: TaskRunner,
) -> MaintenanceRunController:
    """Get a MaintenanceRunController test subject."""
    return MaintenanceRunController(
        run_id=run_id,
        engine_store=mock_engine_store,
        task_runner=mock_task_runner,
    )


async def test_create_stop_action(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_task_runner: TaskRunner,
    run_id: str,
    subject: MaintenanceRunController,
) -> None:
    """It should resume a run."""
    result = subject.create_action(
        action_id="some-action-id",
        action_type=MaintenanceRunActionType.STOP,
        created_at=datetime(year=2021, month=1, day=1),
    )

    assert result == MaintenanceRunAction(
        id="some-action-id",
        actionType=MaintenanceRunActionType.STOP,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    decoy.verify(mock_task_runner.run(mock_engine_store.runner.stop), times=1)
