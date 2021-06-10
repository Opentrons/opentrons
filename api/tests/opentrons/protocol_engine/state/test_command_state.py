"""Tests for the command lifecycle state."""
from datetime import datetime

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import StateStore
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.commands import (
    PendingCommand,
    LoadLabwareRequest,
    LoadLabwareResult
)


def test_state_store_handles_command(store: StateStore, now: datetime) -> None:
    """It should add a command to the store."""
    cmd = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=LoadLabwareRequest(
            loadName="load-name",
            namespace="opentrons-test",
            version=1,
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
            labwareId=None
        )
    )

    store.handle_command(cmd, command_id="unique-id")

    assert store.commands.get_command_by_id("unique-id") == cmd


def test_command_state_ordering(store: StateStore, now: datetime) -> None:
    # Fx before merge: Fixturize? Or maybe turn into a private util function?
    cmd1 = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=LoadLabwareRequest(
            loadName="load-name",
            namespace="opentrons-test",
            version=1,
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            labwareId=None
        )
    )
    cmd2 = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=LoadLabwareRequest(
            loadName="load-name",
            namespace="opentrons-test",
            version=1,
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
            labwareId=None
        )
    )
    cmd3 = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=LoadLabwareRequest(
            loadName="load-name",
            namespace="opentrons-test",
            version=1,
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_3),
            labwareId=None
        )
    )
    
    # Testing the test: check that all 3 cmds compare non-equal to each other, so we
    # know the rest of the asserts in this test are meaningful.
    assert cmd1 != cmd2
    assert cmd1 != cmd3
    assert cmd2 != cmd3
    
    store.handle_command(cmd1, "id-1")
    store.handle_command(cmd2, "id-2")
    assert store.commands.get_all_commands() == [("id-1", cmd1), ("id-2", cmd2)]
    
    store.handle_command(cmd3, "id-1")
    assert store.commands.get_all_commands() == [("id-1", cmd3), ("id-2", cmd2)]
