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
        )
    )

    store.handle_command(cmd, command_id="unique-id")

    assert store.commands.get_command_by_id("unique-id") == cmd
