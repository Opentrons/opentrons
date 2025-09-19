"""Unit tests for `run_auto_deleter`."""


from datetime import datetime
import logging
from typing import List, Union

import pytest
from decoy import Decoy

from opentrons.protocol_reader import ProtocolSource

from robot_server.deletion_planner import RunDeletionPlanner
from robot_server.protocols.protocol_models import ProtocolKind
from robot_server.protocols.protocol_store import ProtocolResource, ProtocolStore
from robot_server.runs.run_auto_deleter import RunAutoDeleter
from robot_server.runs.run_store import RunStore, RunResource, BadRunResource


def _make_dummy_run_resource(run_id: str, protocol_id: str) -> RunResource:
    """Return a RunResource with the given ID."""
    return RunResource(
        ok=True,
        run_id=run_id,
        protocol_id=protocol_id,
        created_at=datetime.min,
        actions=[],
    )


def test_make_room_for_new_run(decoy: Decoy, caplog: pytest.LogCaptureFixture) -> None:
    """It should get a deletion plan and enact it on the store."""
    mock_run_store = decoy.mock(cls=RunStore)
    mock_protocol_store = decoy.mock(cls=ProtocolStore)
    mock_protocol_source = decoy.mock(cls=ProtocolSource)

    subject = RunAutoDeleter(
        run_store=mock_run_store,
        protocol_store=mock_protocol_store,
        deletion_planner=RunDeletionPlanner(1),
        protocol_kind=ProtocolKind.STANDARD,
    )

    protocol_resources: List[ProtocolResource] = [
        ProtocolResource(
            protocol_id=f"protocol-id-{idx}",
            created_at=datetime.min,
            source=mock_protocol_source,
            protocol_key=None,
            protocol_kind=ProtocolKind.STANDARD,
        )
        for idx in range(1, 4)
    ]

    run_resources: List[Union[RunResource, BadRunResource]] = [
        _make_dummy_run_resource("run-id-1", "protocol-id-1"),
        _make_dummy_run_resource("run-id-2", "protocol-id-2"),
        _make_dummy_run_resource("run-id-3", "protocol-id-3"),
    ]

    decoy.when(mock_protocol_store.get_all()).then_return(protocol_resources)
    decoy.when(mock_run_store.get_all()).then_return(run_resources)

    # Run the subject, capturing log messages at least as severe as INFO.
    with caplog.at_level(logging.INFO):
        subject.make_room_for_new_run()

    decoy.verify(mock_run_store.remove(run_id="run-id-1"))
    decoy.verify(mock_run_store.remove(run_id="run-id-2"))
    decoy.verify(mock_run_store.remove(run_id="run-id-3"))

    # It should log the runs that it deleted.
    assert "run-id-1" in caplog.text
    assert "run-id-2" in caplog.text
    assert "run-id-3" in caplog.text


def test_quick_transfer_protocol_runs(
    decoy: Decoy,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """It should delete runs of the specified protocol kind."""
    mock_run_store = decoy.mock(cls=RunStore)
    mock_protocol_store = decoy.mock(cls=ProtocolStore)
    mock_protocol_source = decoy.mock(cls=ProtocolSource)

    subject = RunAutoDeleter(
        run_store=mock_run_store,
        protocol_store=mock_protocol_store,
        deletion_planner=RunDeletionPlanner(1),
        protocol_kind=ProtocolKind.QUICK_TRANSFER,
    )

    protocol_resources: List[ProtocolResource] = [
        ProtocolResource(
            protocol_id=f"protocol-id-{idx}",
            created_at=datetime.min,
            source=mock_protocol_source,
            protocol_key=None,
            protocol_kind=ProtocolKind.STANDARD
            if idx not in [2, 5]
            else ProtocolKind.QUICK_TRANSFER,
        )
        for idx in range(1, 6)
    ]

    run_resources: List[Union[RunResource, BadRunResource]] = [
        _make_dummy_run_resource("run-id-1", "protocol-id-1"),
        _make_dummy_run_resource("run-id-2", "protocol-id-2"),
        _make_dummy_run_resource("run-id-3", "protocol-id-3"),
        _make_dummy_run_resource("run-id-4", "protocol-id-4"),
        _make_dummy_run_resource("run-id-5", "protocol-id-5"),
        _make_dummy_run_resource("run-id-6", "protocol-id-6"),
    ]

    decoy.when(mock_protocol_store.get_all()).then_return(protocol_resources)
    decoy.when(mock_run_store.get_all()).then_return(run_resources)

    # Run the subject, capturing log messages at least as severe as INFO.
    with caplog.at_level(logging.INFO):
        subject.make_room_for_new_run()

    decoy.verify(mock_run_store.remove(run_id="run-id-2"))
    decoy.verify(mock_run_store.remove(run_id="run-id-5"))

    # It should log the quick-transfer runs deleted
    assert "run-id-2" in caplog.text
    assert "run-id-5" in caplog.text
    # Make sure we delete quick-transfer protocol runs
    assert "run-id-1" not in caplog.text
    assert "run-id-3" not in caplog.text
    assert "run-id-4" not in caplog.text
    # Make sure we delete runs without a protocol
    assert "run-id-6" in caplog.text
