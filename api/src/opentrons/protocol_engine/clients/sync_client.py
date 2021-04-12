"""Synchronous ProtocolEngine client module."""
from uuid import uuid4
from typing import cast

from .. import commands
from ..state import StateView
from ..types import DeckSlotLocation
from .transports import AbstractSyncTransport


class SyncClient:
    """Synchronous Protocol Engine client."""

    def __init__(self, transport: AbstractSyncTransport) -> None:
        """Initialize the client with a transport."""
        self._transport = transport

    @property
    def state(self) -> StateView:
        """Get a view of the engine's state."""
        return self._transport.state

    @staticmethod
    def _create_command_id() -> str:
        return str(uuid4())

    def load_labware(
        self,
        location: DeckSlotLocation,
        load_name: str,
        namespace: str,
        version: int,
    ) -> commands.LoadLabwareResult:
        """Execute a LoadLabwareRequest, returning the result."""
        request = commands.LoadLabwareRequest(
            location=location,
            loadName=load_name,
            namespace=namespace,
            version=version,
        )
        result = self._transport.execute_command(
            request=request,
            command_id=self._create_command_id(),
        )

        return cast(commands.LoadLabwareResult, result)

    def pick_up_tip(
            self,
            pipette_id: str,
            labware_id: str,
            well_name: str
    ) -> commands.PickUpTipResult:
        """Execute a PickUpTipRequest."""
        request = commands.PickUpTipRequest(
            pipetteId=pipette_id,
            labwareId=labware_id,
            wellName=well_name
        )
        result = self._transport.execute_command(
            request=request,
            command_id=self._create_command_id(),
        )

        return cast(commands.PickUpTipResult, result)

    def drop_tip(
            self,
            pipette_id: str,
            labware_id: str,
            well_name: str
    ) -> commands.DropTipResult:
        """Execute a DropTipRequest."""
        request = commands.DropTipRequest(
            pipetteId=pipette_id,
            labwareId=labware_id,
            wellName=well_name
        )
        result = self._transport.execute_command(
            request=request,
            command_id=self._create_command_id()
        )
        return cast(commands.DropTipResult, result)
