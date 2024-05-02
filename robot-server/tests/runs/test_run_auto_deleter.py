"""Unit tests for `run_auto_deleter`."""


from datetime import datetime
import logging
from typing import List, Union

import pytest
from decoy import Decoy

from robot_server.deletion_planner import RunDeletionPlanner
from robot_server.runs.run_auto_deleter import RunAutoDeleter
from robot_server.runs.run_store import RunStore, RunResource, BadRunResource


def _make_dummy_run_resource(run_id: str) -> RunResource:
    """Return a RunResource with the given ID."""
    return RunResource(
        ok=True,
        run_id=run_id,
        protocol_id=None,
        created_at=datetime.min,
        actions=[],
    )


def test_make_room_for_new_run(decoy: Decoy, caplog: pytest.LogCaptureFixture) -> None:
    """It should get a deletion plan and enact it on the store."""
    mock_run_store = decoy.mock(cls=RunStore)
    mock_deletion_planner = decoy.mock(cls=RunDeletionPlanner)

    subject = RunAutoDeleter(
        run_store=mock_run_store,
        deletion_planner=mock_deletion_planner,
    )

    run_resources: List[Union[RunResource, BadRunResource]] = [
        _make_dummy_run_resource("run-id-1"),
        _make_dummy_run_resource("run-id-2"),
        _make_dummy_run_resource("run-id-3"),
    ]

    deletion_plan = set(["run-id-4", "run-id-5"])

    decoy.when(mock_run_store.get_all()).then_return(run_resources)
    decoy.when(
        mock_deletion_planner.plan_for_new_run(
            existing_runs=["run-id-1", "run-id-2", "run-id-3"]
        )
    ).then_return(deletion_plan)

    # Run the subject, capturing log messages at least as severe as INFO.
    with caplog.at_level(logging.INFO):
        subject.make_room_for_new_run()

    decoy.verify(mock_run_store.remove(run_id="run-id-4"))
    decoy.verify(mock_run_store.remove(run_id="run-id-5"))

    # It should log the runs that it deleted.
    assert "run-id-4" in caplog.text
    assert "run-id-5" in caplog.text
