"""Synchronous wrapper for executing ProtocolEngine commands.

Note: this module may go through a lot of changes as we research
if and how multiprocessing fits into our Python protocol execution.
"""
from opentrons.protocol_engine import commands, DeckSlotLocation


class SyncProtocolEngine():
    """Synchronous ProtocolEngine command executor."""

    def load_labware(
        self,
        location: DeckSlotLocation,
        load_name: str,
        namespace: str,
        version: int,
    ) -> commands.LoadLabwareResult:
        pass
