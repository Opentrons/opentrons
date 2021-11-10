"""Synchronous ProtocolEngine client module."""
from typing import cast, Optional

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

    def load_labware(
        self,
        location: DeckSlotLocation,
        load_name: str,
        namespace: str,
        version: int,
    ) -> commands.LoadLabwareResult:
        """Execute a LoadLabware command and return the result."""
        request = commands.LoadLabwareCreate(
            params=commands.LoadLabwareParams(
                location=location,
                loadName=load_name,
                namespace=namespace,
                version=version,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.LoadLabwareResult, result)

    def load_pipette(
        self,
        pipette_name: PipetteName,
        mount: MountType,
    ) -> commands.LoadPipetteResult:
        """Execute a LoadPipette command and return the result."""
        request = commands.LoadPipetteCreate(
            params=commands.LoadPipetteParams(
                pipetteName=pipette_name,
                mount=mount,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.LoadPipetteResult, result)

    def pick_up_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> commands.PickUpTipResult:
        """Execute a PickUpTip command and return the result."""
        request = commands.PickUpTipCreate(
            params=commands.PickUpTipParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.PickUpTipResult, result)

    def drop_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
    ) -> commands.DropTipResult:
        """Execute a DropTip command and return the result."""
        request = commands.DropTipCreate(
            params=commands.DropTipParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DropTipResult, result)

    def aspirate(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
    ) -> commands.AspirateResult:
        """Execute an ``Aspirate`` command and return the result."""
        request = commands.AspirateCreate(
            params=commands.AspirateParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                volume=volume,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.AspirateResult, result)

    def dispense(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
    ) -> commands.DispenseResult:
        """Execute a ``Dispense`` command and return the result."""
        request = commands.DispenseCreate(
            params=commands.DispenseParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                volume=volume,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DispenseResult, result)

    def pause(self, message: Optional[str]) -> commands.PauseResult:
        """Execute a ``Pause`` command and return the result."""
        request = commands.PauseCreate(params=commands.PauseParams(message=message))
        result = self._transport.execute_command(request=request)
        return cast(commands.PauseResult, result)
