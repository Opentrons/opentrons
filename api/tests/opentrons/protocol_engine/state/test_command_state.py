"""
Tests for the command lifecycle state in the protocol_engine state store.

More extensive tests for individual sub-states should be created in
appropriately named test files for those sub-states.
"""
import pytest
from datetime import datetime, timezone, timedelta
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine import command_models as commands


@pytest.fixture
def store():
    return StateStore()


@pytest.fixture
def now():
    return datetime.now(tz=timezone.utc)


@pytest.fixture
def move_to_req():
    return commands.MoveToWellRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A1"
    )


@pytest.fixture
def move_to_res():
    return commands.MoveToWellResponse()


def test_state_store_handles_command_request(store, now, move_to_req):
    """It should add a pending command to the store when it is requested."""
    uid = "command-id"
    store.handle_command_request(uid, now, move_to_req)
    cmd = store.get_command_by_id(uid)

    assert type(cmd) == commands.PendingCommand
    assert cmd.createdAt == now
    assert cmd.request == move_to_req


def test_state_store_handles_start_command(store, now, move_to_req):
    """It should be able to change pending command to running."""
    uid = "command-id"
    start = now + timedelta(seconds=1)

    store.handle_command_request(uid, now, move_to_req)
    store.handle_command_start(uid, start)
    cmd = store.get_command_by_id(uid)

    assert type(cmd) == commands.RunningCommand
    assert cmd.createdAt == now
    assert cmd.request == move_to_req
    assert cmd.startedAt == start


def test_state_store_handles_invalid_start_command(store, now, move_to_req):
    """It should no-op if the command is not pending."""
    uid = "command-id"
    start = now + timedelta(seconds=1)
    wrong_start = start + timedelta(seconds=42)

    store.handle_command_request(uid, now, move_to_req)
    store.handle_command_start(uid, start)
    store.handle_command_start(uid, wrong_start)
    cmd = store.get_command_by_id(uid)

    assert type(cmd) == commands.RunningCommand
    assert cmd.createdAt == now
    assert cmd.request == move_to_req
    assert cmd.startedAt == start


def test_state_store_handles_missing_start_command(store, now):
    """It should no-op if the command ID does not reference a command`."""
    uid = "command-id"
    start = now + timedelta(seconds=1)

    store.handle_command_start(uid, start)
    cmd = store.get_command_by_id(uid)

    assert cmd is None


def test_state_store_handles_command_result(
    store,
    now,
    move_to_req,
    move_to_res
):
    uid = "command-id"
    start = now + timedelta(seconds=1)
    finish = start + timedelta(seconds=1)

    store.handle_command_request(uid, now, move_to_req)
    store.handle_command_start(uid, start)
    store.handle_command_result(uid, finish, move_to_res)
    cmd = store.get_command_by_id(uid)

    assert type(cmd) == commands.CompletedCommand
    assert cmd.createdAt == now
    assert cmd.startedAt == start
    assert cmd.completedAt == finish
    assert cmd.request == move_to_req
    assert cmd.result == move_to_res


def test_state_store_handles_invalid_command_result(
    store,
    now,
    move_to_req,
    move_to_res
):
    uid = "command-id"
    finish = now + timedelta(seconds=1)

    store.handle_command_request(uid, now, move_to_req)
    store.handle_command_result(uid, finish, move_to_res)
    cmd = store.get_command_by_id(uid)

    assert type(cmd) == commands.PendingCommand


def test_state_store_handles_missing_command_result(
    store,
    now,
    move_to_res
):
    uid = "command-id"
    finish = now + timedelta(seconds=1)

    store.handle_command_result(uid, finish, move_to_res)
    cmd = store.get_command_by_id(uid)

    assert cmd is None
