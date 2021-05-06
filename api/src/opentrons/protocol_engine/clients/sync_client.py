"""Synchronous ProtocolEngine client module."""
from uuid import uuid4
from typing import cast

from opentrons.types import MountType

from .. import commands
from ..state import StateView
from ..types import DeckSlotLocation, PipetteName, WellLocation
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
        """Execute a LoadLabwareRequest and return the result."""
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

    def load_pipette(
        self,
        pipette_name: PipetteName,
        mount: MountType,
    ) -> commands.LoadPipetteResult:
        """Execute a LoadPipetteRequest and return the result."""
        request = commands.LoadPipetteRequest(
            pipetteName=pipette_name,
            mount=mount,
        )
        result = self._transport.execute_command(
            request=request,
            command_id=self._create_command_id(),
        )

        return cast(commands.LoadPipetteResult, result)

    def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> commands.PickUpTipResult:
        """Execute a PickUpTipRequest and return the result."""
        request = commands.PickUpTipRequest(
            pipetteId=pipette_id, labwareId=labware_id, wellName=well_name
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
        well_name: str,
    ) -> commands.DropTipResult:
        """Execute a DropTipRequest and return the result."""
        request = commands.DropTipRequest(
            pipetteId=pipette_id, labwareId=labware_id, wellName=well_name
        )
        result = self._transport.execute_command(
            request=request, command_id=self._create_command_id()
        )
        return cast(commands.DropTipResult, result)

    def aspirate(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
    ) -> commands.AspirateResult:
        """Execute an ``AspirateRequest``, returning the result."""
        request = commands.AspirateRequest(
            pipetteId=pipette_id,
            labwareId=labware_id,
            wellName=well_name,
            wellLocation=well_location,
            volume=volume,
        )
        result = self._transport.execute_command(
            request=request,
            command_id=self._create_command_id()
        )

        return cast(commands.AspirateResult, result)

    def dispense(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
    ) -> commands.DispenseResult:
        """Execute a ``DispenseRequest``, returning the result."""
        request = commands.DispenseRequest(
            pipetteId=pipette_id,
            labwareId=labware_id,
            wellName=well_name,
            wellLocation=well_location,
            volume=volume,
        )
        result = self._transport.execute_command(
            request=request, command_id=self._create_command_id()
        )
        return cast(commands.DispenseResult, result)
