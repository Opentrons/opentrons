"""Tests for robot_server.runs.run_store."""
import pytest
from datetime import datetime

from robot_server.runs.run_store import RunStore, RunResource, RunNotFoundError


def test_add_run() -> None:
    """It should be able to add a new run to the store."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=True,
    )

    subject = RunStore()
    result = subject.upsert(run)

    assert result == run


def test_update_run() -> None:
    """It should be able to update a run in the store."""
    run = RunResource(
        run_id="identical-run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1, hour=1, minute=1, second=1),
        actions=[],
        is_current=True,
    )
    updated_run = RunResource(
        run_id="identical-run-id",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2, hour=2, minute=2, second=2),
        actions=[],
        is_current=True,
    )

    subject = RunStore()
    subject.upsert(run)

    result = subject.upsert(updated_run)

    assert result == updated_run


def test_get_run() -> None:
    """It can get a previously stored run entry."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=False,
    )

    subject = RunStore()
    subject.upsert(run)

    result = subject.get(run_id="run-id")

    assert result == run


def test_get_run_missing() -> None:
    """It raises if the run does not exist."""
    subject = RunStore()

    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.get(run_id="run-id")


def test_get_all_runs() -> None:
    """It can get all created runs."""
    run_1 = RunResource(
        run_id="run-id-1",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=False,
    )
    run_2 = RunResource(
        run_id="run-id-2",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=True,
    )

    subject = RunStore()
    subject.upsert(run_1)
    subject.upsert(run_2)

    result = subject.get_all()

    assert result == [run_1, run_2]


def test_remove_run() -> None:
    """It can remove and return a previously stored run entry."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=True,
    )

    subject = RunStore()
    subject.upsert(run)

    result = subject.remove(run_id="run-id")

    assert result == run
    assert subject.get_all() == []


def test_remove_run_missing_id() -> None:
    """It raises if the run does not exist."""
    subject = RunStore()

    with pytest.raises(RunNotFoundError, match="run-id"):
        subject.remove(run_id="run-id")


def test_add_run_current_run_deactivates() -> None:
    """Adding a current run should mark all others as not current."""
    run_1 = RunResource(
        run_id="run-id-1",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=True,
    )

    run_2 = RunResource(
        run_id="run-id-2",
        protocol_id=None,
        created_at=datetime.now(),
        actions=[],
        is_current=True,
    )

    subject = RunStore()
    subject.upsert(run_1)
    subject.upsert(run_2)

    assert subject.get("run-id-1").is_current is False
    assert subject.get("run-id-2").is_current is True
