"""Control a `ProtocolEngine` without async/await."""

from typing import cast, List, Optional, Dict

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.commands.protocol_commands import comment as make_legacy_comment_command
from opentrons.types import MountType
from opentrons.hardware_control.modules.types import ThermocyclerStep

from .. import commands
from ..state import StateView
from ..types import (
    DeckPoint,
    DeckSlotLocation,
    LabwareLocation,
    LabwareMovementStrategy,
    ModuleModel,
    WellLocation,
    DropTipWellLocation,
    LabwareOffsetVector,
    MotorAxis,
    Liquid,
    NozzleLayoutConfigurationType,
    AddressableOffsetVector,
)
from .transports import ChildThreadTransport


class SyncClient:
    """Control a `ProtocolEngine` without async/await.

    Normally, `ProtocolEngine` provides an async/await interface, like this:

    ```
    aspirate_result = await protocol_engine.add_and_execute_command(aspirate_command)
    dispense_result = await protocol_engine.add_and_execute_command(dispense_command)
    ```

    But we sometimes want to control it with plain old non-async blocking method calls.
    To accomplish that, this class adapts `ProtocolEngine`'s interface into this:

    ```
    aspirate_result = sync_client.aspirate(...)
    dispense_result = sync_client.dispense(...)
    ```

    This is intended to help implement the Python Protocol API, which is all non-async.
    """

    def __init__(self, transport: ChildThreadTransport) -> None:
        """Initialize the `SyncClient`.

        Params:
            transport: The interface for the new `SyncClient` to use to
                communicate with the `ProtocolEngine`.
        """
        self._transport = transport

    @property
    def state(self) -> StateView:
        """Get a view of the engine's state."""
        return self._transport.state

    def add_labware_definition(self, definition: LabwareDefinition) -> LabwareUri:
        """Add a labware definition to the engine."""
        return self._transport.call_method(
            "add_labware_definition",
            definition=definition,
        )

    def add_liquid(
        self, name: str, color: Optional[str], description: Optional[str]
    ) -> Liquid:
        """Add a liquid to the engine."""
        return self._transport.call_method("add_liquid", name=name, color=color, description=description)  # type: ignore[no-any-return]

    def reset_tips(self, labware_id: str) -> None:
        """Reset a labware's tip tracking state.."""
        self._transport.call_method(
            "reset_tips",
            labware_id=labware_id,
        )

    def set_pipette_movement_speed(
        self, pipette_id: str, speed: Optional[float]
    ) -> None:
        """Set the speed of a pipette's X/Y/Z movements. Does not affect plunger speed.

        None will use the hardware API's default.
        """
        self._transport.call_method(
            "set_pipette_movement_speed",
            pipette_id=pipette_id,
            speed=speed,
        )

    def load_labware(
        self,
        location: LabwareLocation,
        load_name: str,
        namespace: str,
        version: int,
        display_name: Optional[str] = None,
    ) -> commands.LoadLabwareResult:
        """Execute a LoadLabware command and return the result."""
        request = commands.LoadLabwareCreate(
            params=commands.LoadLabwareParams(
                location=location,
                loadName=load_name,
                namespace=namespace,
                version=version,
                displayName=display_name,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.LoadLabwareResult, result)

    # TODO (spp, 2022-12-14): https://opentrons.atlassian.net/browse/RLAB-237
    def move_labware(
        self,
        labware_id: str,
        new_location: LabwareLocation,
        strategy: LabwareMovementStrategy,
        pick_up_offset: Optional[LabwareOffsetVector],
        drop_offset: Optional[LabwareOffsetVector],
    ) -> commands.MoveLabwareResult:
        """Execute a MoveLabware command and return the result."""
        request = commands.MoveLabwareCreate(
            params=commands.MoveLabwareParams(
                labwareId=labware_id,
                newLocation=new_location,
                strategy=strategy,
                pickUpOffset=pick_up_offset,
                dropOffset=drop_offset,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.MoveLabwareResult, result)

    def load_pipette(
        self,
        pipette_name: PipetteNameType,
        mount: MountType,
    ) -> commands.LoadPipetteResult:
        """Execute a LoadPipette command and return the result."""
        request = commands.LoadPipetteCreate(
            params=commands.LoadPipetteParams(mount=mount, pipetteName=pipette_name)
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.LoadPipetteResult, result)

    def move_to_well(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        minimum_z_height: Optional[float],
        force_direct: bool,
        speed: Optional[float],
    ) -> commands.MoveToWellResult:
        """Execute a MoveToWell command and return the result."""
        request = commands.MoveToWellCreate(
            params=commands.MoveToWellParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                forceDirect=force_direct,
                minimumZHeight=minimum_z_height,
                speed=speed,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.MoveToWellResult, result)

    def move_to_addressable_area(
        self,
        pipette_id: str,
        addressable_area_name: str,
        offset: AddressableOffsetVector,
        minimum_z_height: Optional[float],
        force_direct: bool,
        speed: Optional[float],
    ) -> commands.MoveToAddressableAreaResult:
        """Execute a MoveToAddressableArea command and return the result."""
        request = commands.MoveToAddressableAreaCreate(
            params=commands.MoveToAddressableAreaParams(
                pipetteId=pipette_id,
                addressableAreaName=addressable_area_name,
                offset=offset,
                forceDirect=force_direct,
                minimumZHeight=minimum_z_height,
                speed=speed,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.MoveToAddressableAreaResult, result)

    def move_to_coordinates(
        self,
        pipette_id: str,
        coordinates: DeckPoint,
        minimum_z_height: Optional[float],
        force_direct: bool,
        speed: Optional[float],
    ) -> commands.MoveToCoordinatesResult:
        """Execute a MoveToCoordinates command and return the result."""
        request = commands.MoveToCoordinatesCreate(
            params=commands.MoveToCoordinatesParams(
                pipetteId=pipette_id,
                coordinates=coordinates,
                minimumZHeight=minimum_z_height,
                forceDirect=force_direct,
                speed=speed,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.MoveToCoordinatesResult, result)

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
        well_location: WellLocation,
    ) -> commands.PickUpTipResult:
        """Execute a PickUpTip command and return the result."""
        request = commands.PickUpTipCreate(
            params=commands.PickUpTipParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.PickUpTipResult, result)

    def drop_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: DropTipWellLocation,
        home_after: Optional[bool],
        alternateDropLocation: Optional[bool],
    ) -> commands.DropTipResult:
        """Execute a DropTip command and return the result."""
        request = commands.DropTipCreate(
            params=commands.DropTipParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                homeAfter=home_after,
                alternateDropLocation=alternateDropLocation,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DropTipResult, result)

    def drop_tip_in_place(
        self,
        pipette_id: str,
        home_after: Optional[bool],
    ) -> commands.DropTipInPlaceResult:
        """Execute a DropTipInPlace command and return the result."""
        request = commands.DropTipInPlaceCreate(
            params=commands.DropTipInPlaceParams(
                pipetteId=pipette_id,
                homeAfter=home_after,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DropTipInPlaceResult, result)

    def configure_for_volume(
        self, pipette_id: str, volume: float
    ) -> commands.ConfigureForVolumeResult:
        """Execute a ConfigureForVolume command."""
        request = commands.ConfigureForVolumeCreate(
            params=commands.ConfigureForVolumeParams(
                pipetteId=pipette_id, volume=volume
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.ConfigureForVolumeResult, result)

    def prepare_to_aspirate(self, pipette_id: str) -> commands.PrepareToAspirateResult:
        """Execute a PrepareToAspirate command."""
        request = commands.PrepareToAspirateCreate(
            params=commands.PrepareToAspirateParams(pipetteId=pipette_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.PrepareToAspirateResult, result)

    def configure_nozzle_layout(
        self,
        pipette_id: str,
        configuration_params: NozzleLayoutConfigurationType,
    ) -> commands.ConfigureNozzleLayoutResult:
        """Execute a ConfigureForVolume command."""
        request = commands.ConfigureNozzleLayoutCreate(
            params=commands.ConfigureNozzleLayoutParams(
                pipetteId=pipette_id, configurationParams=configuration_params
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.ConfigureNozzleLayoutResult, result)

    def aspirate(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
        flow_rate: float,
    ) -> commands.AspirateResult:
        """Execute an ``Aspirate`` command and return the result."""
        request = commands.AspirateCreate(
            params=commands.AspirateParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                volume=volume,
                flowRate=flow_rate,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.AspirateResult, result)

    def aspirate_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
    ) -> commands.AspirateInPlaceResult:
        """Execute an ``AspirateInPlace`` command and return the result."""
        request = commands.AspirateInPlaceCreate(
            params=commands.AspirateInPlaceParams(
                pipetteId=pipette_id,
                volume=volume,
                flowRate=flow_rate,
            )
        )
        result = self._transport.execute_command(request=request)

        return cast(commands.AspirateInPlaceResult, result)

    def dispense(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        volume: float,
        flow_rate: float,
        push_out: Optional[float],
    ) -> commands.DispenseResult:
        """Execute a ``Dispense`` command and return the result."""
        request = commands.DispenseCreate(
            params=commands.DispenseParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                volume=volume,
                flowRate=flow_rate,
                pushOut=push_out,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DispenseResult, result)

    def dispense_in_place(
        self,
        pipette_id: str,
        volume: float,
        flow_rate: float,
        push_out: Optional[float],
    ) -> commands.DispenseInPlaceResult:
        """Execute a ``DispenseInPlace`` command and return the result."""
        request = commands.DispenseInPlaceCreate(
            params=commands.DispenseInPlaceParams(
                pipetteId=pipette_id,
                volume=volume,
                flowRate=flow_rate,
                pushOut=push_out,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.DispenseInPlaceResult, result)

    def blow_out(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        flow_rate: float,
    ) -> commands.BlowOutResult:
        """Execute a ``BlowOut`` command and return the result."""
        request = commands.BlowOutCreate(
            params=commands.BlowOutParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                flowRate=flow_rate,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.BlowOutResult, result)

    def blow_out_in_place(
        self,
        pipette_id: str,
        flow_rate: float,
    ) -> commands.BlowOutInPlaceResult:
        """Execute a ``BlowOutInPlace`` command and return the result."""
        request = commands.BlowOutInPlaceCreate(
            params=commands.BlowOutInPlaceParams(
                pipetteId=pipette_id,
                flowRate=flow_rate,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.BlowOutInPlaceResult, result)

    def touch_tip(
        self,
        pipette_id: str,
        labware_id: str,
        well_name: str,
        well_location: WellLocation,
        radius: float,
        speed: float,
    ) -> commands.TouchTipResult:
        """Execute a ``Touch Tip`` command and return the result."""
        request = commands.TouchTipCreate(
            params=commands.TouchTipParams(
                pipetteId=pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                radius=radius,
                speed=speed,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.TouchTipResult, result)

    def wait_for_duration(
        self, seconds: float, message: Optional[str]
    ) -> commands.WaitForDurationResult:
        """Execute a ``waitForDuration`` command and return the result."""
        request = commands.WaitForDurationCreate(
            params=commands.WaitForDurationParams(seconds=seconds, message=message)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.WaitForDurationResult, result)

    def wait_for_resume(self, message: Optional[str]) -> commands.WaitForResumeResult:
        """Execute a `WaitForResume` command and return the result."""
        request = commands.WaitForResumeCreate(
            params=commands.WaitForResumeParams(message=message)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.WaitForResumeResult, result)

    def comment(self, message: str) -> commands.CustomResult:
        """Execute a comment command and return the result."""
        # TODO(mm, 2022-11-09): Protocol Engine doesn't yet have a proper comment
        # command. So, we use a legacy-style command wrapped inside a Protocol Engine
        # CustomCommand. The Opentrons App knows how to render this in its run log
        # because this is what we used to do for PAPIv2 commands in general.
        #
        # When Protocol Engine has a proper comment command, we should use it here.
        legacy_comment_command = make_legacy_comment_command(msg=message)

        class LegacyCommentCustomParams(commands.CustomParams):
            legacyCommandType: str
            legacyCommandText: str

        request = commands.CustomCreate(
            params=LegacyCommentCustomParams(
                # This matches how LegacyCommandWrapper handles comments coming from
                # protocols running under the older non-ProtocolEngine core.
                legacyCommandType=legacy_comment_command["name"],
                legacyCommandText=legacy_comment_command["payload"]["text"],
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.CustomResult, result)

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

    def magnetic_module_disengage(
        self, module_id: str
    ) -> commands.magnetic_module.DisengageResult:
        """Execute a ``MagneticModuleDisengage`` command and return the result."""
        request = commands.magnetic_module.DisengageCreate(
            params=commands.magnetic_module.DisengageParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.magnetic_module.DisengageResult, result)

    def thermocycler_set_target_lid_temperature(
        self, module_id: str, celsius: float
    ) -> commands.thermocycler.SetTargetLidTemperatureResult:
        """Execute a `thermocycler/setTargetLidTemperature` command and return the result."""
        request = commands.thermocycler.SetTargetLidTemperatureCreate(
            params=commands.thermocycler.SetTargetLidTemperatureParams(
                moduleId=module_id, celsius=celsius
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.SetTargetLidTemperatureResult, result)

    def thermocycler_set_target_block_temperature(
        self,
        module_id: str,
        celsius: float,
        block_max_volume: Optional[float],
        hold_time_seconds: Optional[float],
    ) -> commands.thermocycler.SetTargetBlockTemperatureResult:
        """Execute a `thermocycler/setTargetLidTemperature` command and return the result."""
        request = commands.thermocycler.SetTargetBlockTemperatureCreate(
            params=commands.thermocycler.SetTargetBlockTemperatureParams(
                moduleId=module_id,
                celsius=celsius,
                blockMaxVolumeUl=block_max_volume,
                holdTimeSeconds=hold_time_seconds,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.SetTargetBlockTemperatureResult, result)

    def thermocycler_wait_for_lid_temperature(
        self, module_id: str
    ) -> commands.thermocycler.WaitForLidTemperatureResult:
        """Execute a `thermocycler/waitForLidTemperature` command and return the result."""
        request = commands.thermocycler.WaitForLidTemperatureCreate(
            params=commands.thermocycler.WaitForLidTemperatureParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.WaitForLidTemperatureResult, result)

    def thermocycler_wait_for_block_temperature(
        self, module_id: str
    ) -> commands.thermocycler.WaitForBlockTemperatureResult:
        """Execute a `thermocycler/waitForBlockTemperature` command and return the result."""
        request = commands.thermocycler.WaitForBlockTemperatureCreate(
            params=commands.thermocycler.WaitForBlockTemperatureParams(
                moduleId=module_id
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.WaitForBlockTemperatureResult, result)

    def thermocycler_run_profile(
        self,
        module_id: str,
        steps: List[ThermocyclerStep],
        block_max_volume: Optional[float],
    ) -> commands.thermocycler.RunProfileResult:
        """Execute a `thermocycler/runProfile` command and return the result."""
        request = commands.thermocycler.RunProfileCreate(
            params=commands.thermocycler.RunProfileParams(
                moduleId=module_id,
                profile=[
                    commands.thermocycler.RunProfileStepParams(
                        celsius=step["temperature"],
                        holdSeconds=step["hold_time_seconds"],
                    )
                    for step in steps
                ],
                blockMaxVolumeUl=block_max_volume,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.thermocycler.RunProfileResult, result)

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

    def heater_shaker_set_target_temperature(
        self, module_id: str, celsius: float
    ) -> commands.heater_shaker.SetTargetTemperatureResult:
        """Execute a `heaterShaker/setTargetTemperature` command and return the result."""
        request = commands.heater_shaker.SetTargetTemperatureCreate(
            params=commands.heater_shaker.SetTargetTemperatureParams(
                moduleId=module_id, celsius=celsius
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.SetTargetTemperatureResult, result)

    def heater_shaker_wait_for_temperature(
        self,
        module_id: str,
    ) -> commands.heater_shaker.WaitForTemperatureResult:
        """Execute a `heaterShaker/waitForTemperature` command and return the result."""
        request = commands.heater_shaker.WaitForTemperatureCreate(
            params=commands.heater_shaker.WaitForTemperatureParams(
                moduleId=module_id,
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.WaitForTemperatureResult, result)

    def heater_shaker_set_and_wait_for_shake_speed(
        self, module_id: str, rpm: float
    ) -> commands.heater_shaker.SetAndWaitForShakeSpeedResult:
        """Execute a `heaterShaker/setAndWaitForShakeSpeed` command and return the result."""
        request = commands.heater_shaker.SetAndWaitForShakeSpeedCreate(
            params=commands.heater_shaker.SetAndWaitForShakeSpeedParams(
                moduleId=module_id, rpm=rpm
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.SetAndWaitForShakeSpeedResult, result)

    def heater_shaker_open_labware_latch(
        self, module_id: str
    ) -> commands.heater_shaker.OpenLabwareLatchResult:
        """Execute a `heaterShaker/openLabwareLatch` command and return the result."""
        request = commands.heater_shaker.OpenLabwareLatchCreate(
            params=commands.heater_shaker.OpenLabwareLatchParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.OpenLabwareLatchResult, result)

    def heater_shaker_close_labware_latch(
        self, module_id: str
    ) -> commands.heater_shaker.CloseLabwareLatchResult:
        """Execute a `heaterShaker/closeLabwareLatch` command and return the result."""
        request = commands.heater_shaker.CloseLabwareLatchCreate(
            params=commands.heater_shaker.CloseLabwareLatchParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.CloseLabwareLatchResult, result)

    def heater_shaker_deactivate_shaker(
        self, module_id: str
    ) -> commands.heater_shaker.DeactivateShakerResult:
        """Execute a `heaterShaker/deactivateShaker` command and return the result."""
        request = commands.heater_shaker.DeactivateShakerCreate(
            params=commands.heater_shaker.DeactivateShakerParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.DeactivateShakerResult, result)

    def heater_shaker_deactivate_heater(
        self, module_id: str
    ) -> commands.heater_shaker.DeactivateHeaterResult:
        """Execute a `heaterShaker/deactivateHeater` command and return the result."""
        request = commands.heater_shaker.DeactivateHeaterCreate(
            params=commands.heater_shaker.DeactivateHeaterParams(moduleId=module_id)
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.heater_shaker.DeactivateHeaterResult, result)

    def temperature_module_set_target_temperature(
        self, module_id: str, celsius: float
    ) -> commands.temperature_module.SetTargetTemperatureResult:
        """Execute a `temperatureModule/setTargetTemperature` command and return the result."""
        request = commands.temperature_module.SetTargetTemperatureCreate(
            params=commands.temperature_module.SetTargetTemperatureParams(
                moduleId=module_id, celsius=celsius
            ),
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.temperature_module.SetTargetTemperatureResult, result)

    def temperature_module_wait_for_target_temperature(
        self, module_id: str, celsius: Optional[float]
    ) -> commands.temperature_module.WaitForTemperatureResult:
        """Execute a `temperatureModule/waitForTemperature` command and return the result."""
        request = commands.temperature_module.WaitForTemperatureCreate(
            params=commands.temperature_module.WaitForTemperatureParams(
                moduleId=module_id, celsius=celsius
            ),
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.temperature_module.WaitForTemperatureResult, result)

    def temperature_module_deactivate(
        self, module_id: str
    ) -> commands.temperature_module.DeactivateTemperatureResult:
        """Execute a `temperatureModule/deactivate` command and return the result."""
        request = commands.temperature_module.DeactivateTemperatureCreate(
            params=commands.temperature_module.DeactivateTemperatureParams(
                moduleId=module_id
            ),
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.temperature_module.DeactivateTemperatureResult, result)

    def home(self, axes: Optional[List[MotorAxis]]) -> commands.HomeResult:
        """Execute a `home` command and return the result."""
        request = commands.HomeCreate(params=commands.HomeParams(axes=axes))
        result = self._transport.execute_command(request=request)
        return cast(commands.HomeResult, result)

    def load_liquid(
        self, labware_id: str, liquid_id: str, volume_by_well: Dict[str, float]
    ) -> commands.LoadLiquidResult:
        """Execute a load_liquid command and return the result."""
        request = commands.LoadLiquidCreate(
            params=commands.LoadLiquidParams(
                labwareId=labware_id, liquidId=liquid_id, volumeByWell=volume_by_well
            )
        )
        result = self._transport.execute_command(request=request)
        return cast(commands.LoadLiquidResult, result)
