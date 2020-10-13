"""
Basic tests for the protocol_engine state store.

More extensive tests for individual sub-states should be created in
appropriately named test files for those sub-states.
"""
import pytest
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine import command_models as commands


@pytest.fixture
def store():
    return StateStore()


def test_state_store_handles_command_request(store):
    uid = "command-id"
    req = commands.MoveToWellRequest(
        pipetteId="abc",
        labwareId="123",
        wellId="A1"
    )

    store.handle_command_request(uid, req)
    assert store.commands.get_command_request_by_id(uid) == req
