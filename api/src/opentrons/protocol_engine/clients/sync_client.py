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
                # TODO(jbl 2022-06-17) replace default with parameter from pipette_context
                # https://github.com/Opentrons/opentrons/issues/10810
                flowRate=2.0,
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
                # TODO(jbl 2022-06-17) replace default with parameter from pipette_context
                # https://github.com/Opentrons/opentrons/issues/10810
                flowRate=2.0,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DispenseResult, result)

    def blow_out(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
    ) -> commands.BlowOutResult:
        """Execute a ``BlowOut`` command and return the result."""
        request = commands.BlowOutCreate(
            params=commands.BlowOutParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                # TODO(jbl 2022-06-17) replace default with parameter from pipette_context
                # https://github.com/Opentrons/opentrons/issues/10810
                flowRate=2.0,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.BlowOutResult, result)

    def touch_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
    ) -> commands.TouchTipResult:
        """Execute a ``Touch Tip`` command and return the result."""
        request = commands.TouchTipCreate(
            params=commands.TouchTipParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.TouchTipResult, result)

    def wait_for_resume(self, message: Optional[str]) -> commands.WaitForResumeResult:
        """Execute a `WaitForResume` command and return the result."""
        request = commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(message=message)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.WaitForResumeResult, result)

    def set_rail_lights(self, on: bool) -> commands.SetRailLightsResult:
        """Execute a ``setRailLights`` command and return the result."""
        request = commands.SetRailLightsCreate(
            params=commands.SetRailLightsParams(on=on)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.SetRailLightsResult, result)

    def magnetic_module_engage(
        self, module_id: str, engage_height: float
    ) -> commands.magnetic_module.EngageResult:
        """Execute a ``MagneticModuleEngage`` command and return the result."""
        request = commands.magnetic_module.EngageCreate(
            params=commands.magnetic_module.EngageParams(
                moduleId=module_id, height=engage_height
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.magnetic_module.EngageResult, result)

    def thermocycler_deactivate_block(
        self, module_id: str
    ) -> commands.thermocycler.DeactivateBlockResult:
        """Execute a `thermocycler/deactivateBlock` command and return the result."""
        request = commands.thermocycler.DeactivateBlockCreate(
            params=commands.thermocycler.DeactivateBlockParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.DeactivateBlockResult, result)

    def thermocycler_deactivate_lid(
        self, module_id: str
    ) -> commands.thermocycler.DeactivateLidResult:
        """Execute a `thermocycler/deactivateLid` command and return the result."""
        request = commands.thermocycler.DeactivateLidCreate(
            params=commands.thermocycler.DeactivateLidParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.DeactivateLidResult, result)

    def thermocycler_open_lid(
        self, module_id: str
    ) -> commands.thermocycler.OpenLidResult:
        """Execute a `thermocycler/openLid` command and return the result."""
        request = commands.thermocycler.OpenLidCreate(
            params=commands.thermocycler.OpenLidParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.OpenLidResult, result)

    def thermocycler_close_lid(
        self, module_id: str
    ) -> commands.thermocycler.CloseLidResult:
        """Execute a `thermocycler/closeLid` command and return the result."""
        request = commands.thermocycler.CloseLidCreate(
            params=commands.thermocycler.CloseLidParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.CloseLidResult, result)
