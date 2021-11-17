"""Tests for the run resource model builder."""
from datetime import datetime

from robot_server.runs.run_store import RunResource
from robot_server.runs.run_view import RunView
from robot_server.runs.run_models import RunUpdate

from robot_server.runs.action_models import (
    RunAction,
    RunActionCreate,
    RunActionType,
)


def test_create_action(current_time: datetime) -> None:
    """It should create a control action and add it to the run."""
    run_created_at = datetime.now()

    run = RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=run_created_at,
        actions=[],
        is_current=True,
    )

    command_data = RunActionCreate(
        actionType=RunActionType.PLAY,
    )

    subject = RunView()
    action_result, run_result = subject.with_action(
        run=run,
        action_id="control-command-id",
        action_data=command_data,
        created_at=current_time,
    )

    assert action_result == RunAction(
        id="control-command-id",
        createdAt=current_time,
        actionType=RunActionType.PLAY,
    )

    assert run_result == RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=run_created_at,
        actions=[action_result],
        is_current=True,
    )


def test_with_update() -> None:
    """It should update a run resource to not current."""
    run = RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )
    update = RunUpdate(current=False)

    subject = RunView()
    result = subject.with_update(run=run, update=update)

    assert result == RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=False,
    )
