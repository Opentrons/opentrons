"""Synchronous ProtocolEngine client module."""
from typing import cast, Optional

from opentrons.types import MountType

from .. import commands
from ..state import StateView
from ..types import (
    DeckSlotLocation,
    LabwareLocation,
    ModuleModel,
    PipetteName,
    WellLocation,
)
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
        location: LabwareLocation,
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

    def load_module(
        self,
        model: ModuleModel,
        location: DeckSlotLocation,
    ) -> commands.LoadModuleResult:
        """Execute a LoadModule command and return the result."""
        request = commands.LoadModuleCreate(
            params=commands.LoadModuleParams(model=model, location=location)
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.LoadModuleResult, result)

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

    def magnetic_module_engage(
        self, module_id: str, engage_height: float
    ) -> commands.magnetic_module.EngageResult:
        """Execute a ``MagneticModuleEngage`` command and return the result."""
        request = commands.magnetic_module.EngageCreate(
            params=commands.magnetic_module.EngageParams(
                moduleId=module_id, engageHeight=engage_height
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.magnetic_module.EngageResult, result)

    def set_rail_lights(self, on: bool) -> commands.SetRailLightsResult:
        """Execute a ``setRailLights`` command and return the result."""
        request = commands.SetRailLightsCreate(
            params=commands.SetRailLightsParams(on=on)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.SetRailLightsResult, result)
