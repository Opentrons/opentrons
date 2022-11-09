"""Tests for the Protocol Context's synchronous engine adapter.

Since Python protocol execution happens off the main thread, these tests call
the subject's methods in a synchronous context in a child thread to ensure:

- In the Protocol execution thread, calls are synchronous and block until
    command execution is complete.
- In the main thread, the Protocol Engine does its work in the main event
    loop, without blocking.
"""
from typing import Optional

import pytest
from decoy import Decoy

from opentrons_shared_data.pipette.dev_types import PipetteNameType
from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_engine import DeckSlotLocation, DeckPoint, commands
from opentrons.protocol_engine.clients import SyncClient, AbstractSyncTransport
from opentrons.protocol_engine.types import (
    ModuleDefinition,
    ModuleModel,
    WellOrigin,
    WellOffset,
    WellLocation,
)


@pytest.fixture
def transport(decoy: Decoy) -> AbstractSyncTransport:
    """Get a stubbed out AbstractSyncTransport."""
    return decoy.mock(cls=AbstractSyncTransport)


@pytest.fixture
def subject(transport: AbstractSyncTransport) -> SyncClient:
    """Get a SyncProtocolEngine test subject."""
    return SyncClient(transport=transport)


def test_add_labware_definition(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should add a labware definition."""
    labware_definition = LabwareDefinition.construct(namespace="hello")  # type: ignore[call-arg]
    expected_labware_uri = LabwareUri("hello/world/123")

    decoy.when(
        transport.call_method(
            "add_labware_definition",
            definition=labware_definition,
        )
    ).then_return(expected_labware_uri)

    result = subject.add_labware_definition(labware_definition)

    assert result == expected_labware_uri


def test_load_labware(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    tip_rack_def: LabwareDefinition,
    subject: SyncClient,
) -> None:
    """It should execute a load labware command."""
    expected_request = commands.LoadLabwareCreate(
        params=commands.LoadLabwareParams(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            loadName="some_labware",
            namespace="opentrons",
            version=1,
            labwareId=None,
            displayName="some_display_name",
        )
    )

    expected_result = commands.LoadLabwareResult(
        labwareId="abc123",
        definition=tip_rack_def,
        offsetId=None,
    )

    decoy.when(transport.execute_command(request=expected_request)).then_return(
        expected_result
    )

    result = subject.load_labware(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        load_name="some_labware",
        namespace="opentrons",
        version=1,
        display_name="some_display_name",
    )

    assert result == expected_result


def test_load_module(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
    thermocycler_v1_def: ModuleDefinition,
) -> None:
    """It should send a load module command to the engine."""
    expected_request = commands.LoadModuleCreate(
        params=commands.LoadModuleParams(
            model=ModuleModel.THERMOCYCLER_MODULE_V1,
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_7),
        )
    )
    expected_result = commands.LoadModuleResult(
        moduleId="abc123",
        model=ModuleModel.THERMOCYCLER_MODULE_V1,
        definition=thermocycler_v1_def,
        serialNumber="xyz789",
    )

    decoy.when(transport.execute_command(request=expected_request)).then_return(
        expected_result
    )

    result = subject.load_module(
        model=ModuleModel.THERMOCYCLER_MODULE_V1,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_7),
    )

    assert result == expected_result


def test_load_pipette(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a load pipette command and return its result."""
    request = commands.LoadPipetteCreate(
        params=commands.LoadPipetteParams(
            pipetteName=PipetteNameType.P300_SINGLE,
            mount=MountType.RIGHT,
        )
    )

    expected_result = commands.LoadPipetteResult(pipetteId="abc123")

    decoy.when(transport.execute_command(request=request)).then_return(expected_result)

    result = subject.load_pipette(
        pipette_name=PipetteNameType.P300_SINGLE,
        mount=MountType.RIGHT,
    )

    assert result == expected_result


def test_move_to_well(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a move to well command."""
    request = commands.MoveToWellCreate(
        params=commands.MoveToWellParams(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM, offset=WellOffset(x=1, y=2, z=3)
            ),
        )
    )
    response = commands.MoveToWellResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.move_to_well(
        pipette_id="123",
        labware_id="456",
        well_name="A2",
        well_location=WellLocation(
            origin=WellOrigin.BOTTOM, offset=WellOffset(x=1, y=2, z=3)
        ),
    )

    assert result == response


def test_move_to_coordinates(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a move to coordinates command."""
    request = commands.MoveToCoordinatesCreate(
        params=commands.MoveToCoordinatesParams(
            pipetteId="123",
            coordinates=DeckPoint(x=1, y=2, z=3),
            forceDirect=True,
            minimumZHeight=42.0,
        )
    )
    response = commands.MoveToCoordinatesResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.move_to_coordinates(
        pipette_id="123",
        coordinates=DeckPoint(x=1, y=2, z=3),
        force_direct=True,
        minimum_z_height=42.0,
    )

    assert result == response


def test_pick_up_tip(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a pick up tip command."""
    request = commands.PickUpTipCreate(
        params=commands.PickUpTipParams(
            pipetteId="123", labwareId="456", wellName="A2", wellLocation=WellLocation()
        )
    )
    response = commands.PickUpTipResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.pick_up_tip(
        pipette_id="123", labware_id="456", well_name="A2", well_location=WellLocation()
    )

    assert result == response


def test_drop_tip(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a drop up tip command."""
    request = commands.DropTipCreate(
        params=commands.DropTipParams(
            pipetteId="123", labwareId="456", wellName="A2", wellLocation=WellLocation()
        )
    )
    response = commands.DropTipResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.drop_tip(
        pipette_id="123", labware_id="456", well_name="A2", well_location=WellLocation()
    )

    assert result == response


def test_aspirate(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should send an AspirateCommand through the transport."""
    request = commands.AspirateCreate(
        params=commands.AspirateParams(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=WellOffset(x=0, y=0, z=1),
            ),
            volume=123.45,
            flowRate=6.7,
        )
    )

    result_from_transport = commands.AspirateResult(volume=67.89)

    decoy.when(transport.execute_command(request=request)).then_return(
        result_from_transport
    )

    result = subject.aspirate(
        pipette_id="123",
        labware_id="456",
        well_name="A2",
        well_location=WellLocation(
            origin=WellOrigin.BOTTOM,
            offset=WellOffset(x=0, y=0, z=1),
        ),
        volume=123.45,
        flow_rate=6.7,
    )

    assert result == result_from_transport


def test_dispense(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a dispense command."""
    request = commands.DispenseCreate(
        params=commands.DispenseParams(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=WellOffset(x=0, y=0, z=1),
            ),
            volume=10,
            flowRate=2.0,
        )
    )

    response = commands.DispenseResult(volume=1)

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.dispense(
        pipette_id="123",
        labware_id="456",
        well_name="A2",
        well_location=WellLocation(
            origin=WellOrigin.BOTTOM, offset=WellOffset(x=0, y=0, z=1)
        ),
        volume=10,
    )

    assert result == response


def test_touch_tip(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a touch tip command."""
    request = commands.TouchTipCreate(
        params=commands.TouchTipParams(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(),
        )
    )

    response = commands.TouchTipResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.touch_tip(
        pipette_id="123",
        labware_id="456",
        well_name="A2",
        well_location=WellLocation(),
    )

    assert result == response


@pytest.mark.parametrize("seconds", [-1.23, 0.0, 1.23])
@pytest.mark.parametrize("message", [None, "Hello, world!", ""])
def test_wait_for_duration(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
    seconds: float,
    message: Optional[str],
) -> None:
    """It should execute a wait for resume command."""
    request = commands.WaitForDurationCreate(
        params=commands.WaitForDurationParams(seconds=seconds, message=message)
    )
    response = commands.WaitForDurationResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.wait_for_duration(seconds=seconds, message=message)

    assert result == response


def test_wait_for_resume(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a wait for resume command."""
    request = commands.WaitForResumeCreate(
        params=commands.WaitForResumeParams(message="hello world")
    )
    response = commands.WaitForResumeResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.wait_for_resume(message="hello world")

    assert result == response


def test_set_rail_lights(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a setRailLights command."""
    request = commands.SetRailLightsCreate(params=commands.SetRailLightsParams(on=True))
    response = commands.SetRailLightsResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.set_rail_lights(on=True)

    assert result == response


def test_magnetic_module_engage(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Magnetic Module engage command."""
    request = commands.magnetic_module.EngageCreate(
        params=commands.magnetic_module.EngageParams(moduleId="module-id", height=12.34)
    )
    response = commands.magnetic_module.EngageResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.magnetic_module_engage(module_id="module-id", engage_height=12.34)

    assert result == response


def test_magnetic_module_disengage(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Magnetic Module disengage command."""
    request = commands.magnetic_module.DisengageCreate(
        params=commands.magnetic_module.DisengageParams(moduleId="module-id")
    )
    response = commands.magnetic_module.DisengageResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.magnetic_module_disengage(module_id="module-id")

    assert result == response


def test_thermocycler_set_target_lid_temperature(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's set target lid temperature command."""
    request = commands.thermocycler.SetTargetLidTemperatureCreate(
        params=commands.thermocycler.SetTargetLidTemperatureParams(
            moduleId="module-id", celsius=45.6
        )
    )
    response = commands.thermocycler.SetTargetLidTemperatureResult(
        targetLidTemperature=45.6
    )
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_set_target_lid_temperature(
        module_id="module-id", celsius=45.6
    )

    assert result == response


def test_thermocycler_set_target_block_temperature(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's set target block temperature command."""
    request = commands.thermocycler.SetTargetBlockTemperatureCreate(
        params=commands.thermocycler.SetTargetBlockTemperatureParams(
            moduleId="module-id", celsius=45.6, blockMaxVolumeUl=12.3
        )
    )
    response = commands.thermocycler.SetTargetBlockTemperatureResult(
        targetBlockTemperature=45.6
    )
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_set_target_block_temperature(
        module_id="module-id", celsius=45.6, block_max_volume=12.3
    )

    assert result == response


def test_thermocycler_wait_for_lid_temperature(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's wait for lid temperature command."""
    request = commands.thermocycler.WaitForLidTemperatureCreate(
        params=commands.thermocycler.WaitForLidTemperatureParams(moduleId="module-id")
    )
    response = commands.thermocycler.WaitForLidTemperatureResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_wait_for_lid_temperature(module_id="module-id")

    assert result == response


def test_thermocycler_wait_for_block_temperature(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's wait for block temperature command."""
    request = commands.thermocycler.WaitForBlockTemperatureCreate(
        params=commands.thermocycler.WaitForBlockTemperatureParams(moduleId="module-id")
    )
    response = commands.thermocycler.WaitForBlockTemperatureResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_wait_for_block_temperature(module_id="module-id")

    assert result == response


def test_thermocycler_run_profile(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's run profile command."""
    request = commands.thermocycler.RunProfileCreate(
        params=commands.thermocycler.RunProfileParams(
            moduleId="module-id",
            profile=[
                commands.thermocycler.RunProfileStepParams(
                    celsius=42.0, holdSeconds=12.3
                )
            ],
            blockMaxVolumeUl=45.6,
        )
    )
    response = commands.thermocycler.RunProfileResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_run_profile(
        module_id="module-id",
        steps=[{"temperature": 42.0, "hold_time_seconds": 12.3}],
        block_max_volume=45.6,
    )

    assert result == response


def test_thermocycler_deactivate_block(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's deactivate block command."""
    request = commands.thermocycler.DeactivateBlockCreate(
        params=commands.thermocycler.DeactivateBlockParams(moduleId="module-id")
    )
    response = commands.thermocycler.DeactivateBlockResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_deactivate_block(module_id="module-id")

    assert result == response


def test_thermocycler_deactivate_lid(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's deactivate lid command."""
    request = commands.thermocycler.DeactivateLidCreate(
        params=commands.thermocycler.DeactivateLidParams(moduleId="module-id")
    )
    response = commands.thermocycler.DeactivateLidResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_deactivate_lid(module_id="module-id")

    assert result == response


def test_thermocycler_open_lid(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's open lid command."""
    request = commands.thermocycler.OpenLidCreate(
        params=commands.thermocycler.OpenLidParams(moduleId="module-id")
    )
    response = commands.thermocycler.OpenLidResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_open_lid(module_id="module-id")

    assert result == response


def test_thermocycler_close_lid(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Thermocycler's close lid command."""
    request = commands.thermocycler.CloseLidCreate(
        params=commands.thermocycler.CloseLidParams(moduleId="module-id")
    )
    response = commands.thermocycler.CloseLidResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.thermocycler_close_lid(module_id="module-id")

    assert result == response


def test_blow_out(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a blow_out command."""
    request = commands.BlowOutCreate(
        params=commands.BlowOutParams(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(),
            flowRate=2.0,
        )
    )

    response = commands.BlowOutResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.blow_out(
        pipette_id="123",
        labware_id="456",
        well_name="A2",
        well_location=WellLocation(),
    )

    assert result == response


def test_heater_shaker_set_target_temperature(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's set target temperature command."""
    request = commands.heater_shaker.SetTargetTemperatureCreate(
        params=commands.heater_shaker.SetTargetTemperatureParams(
            moduleId="module-id", celsius=42.0
        )
    )
    response = commands.heater_shaker.SetTargetTemperatureResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_set_target_temperature(
        module_id="module-id", celsius=42.0
    )

    assert result == response


def test_heater_shaker_wait_for_temperature(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's wait for temperature command."""
    request = commands.heater_shaker.WaitForTemperatureCreate(
        params=commands.heater_shaker.WaitForTemperatureParams(moduleId="module-id")
    )
    response = commands.heater_shaker.WaitForTemperatureResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_wait_for_temperature(module_id="module-id")

    assert result == response


def test_heater_shaker_set_and_wait_for_shake_speed(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's set and wait for shake speed command."""
    request = commands.heater_shaker.SetAndWaitForShakeSpeedCreate(
        params=commands.heater_shaker.SetAndWaitForShakeSpeedParams(
            moduleId="module-id", rpm=1337
        )
    )
    response = commands.heater_shaker.SetAndWaitForShakeSpeedResult(
        pipetteRetracted=False
    )
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_set_and_wait_for_shake_speed(
        module_id="module-id", rpm=1337
    )

    assert result == response


def test_heater_shaker_open_labware_latch(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's open labware latch command."""
    request = commands.heater_shaker.OpenLabwareLatchCreate(
        params=commands.heater_shaker.OpenLabwareLatchParams(moduleId="module-id")
    )
    response = commands.heater_shaker.OpenLabwareLatchResult(pipetteRetracted=False)
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_open_labware_latch(module_id="module-id")

    assert result == response


def test_heater_shaker_close_labware_latch(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's close labware latch command."""
    request = commands.heater_shaker.CloseLabwareLatchCreate(
        params=commands.heater_shaker.CloseLabwareLatchParams(moduleId="module-id")
    )
    response = commands.heater_shaker.CloseLabwareLatchResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_close_labware_latch(module_id="module-id")

    assert result == response


def test_heater_shaker_deactivate_shaker(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's deactivate shaker command."""
    request = commands.heater_shaker.DeactivateShakerCreate(
        params=commands.heater_shaker.DeactivateShakerParams(moduleId="module-id")
    )
    response = commands.heater_shaker.DeactivateShakerResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_deactivate_shaker(module_id="module-id")

    assert result == response


def test_heater_shaker_deactivate_heater(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Heater-Shaker's deactivate heater command."""
    request = commands.heater_shaker.DeactivateHeaterCreate(
        params=commands.heater_shaker.DeactivateHeaterParams(moduleId="module-id")
    )
    response = commands.heater_shaker.DeactivateHeaterResult()
    decoy.when(transport.execute_command(request=request)).then_return(response)
    result = subject.heater_shaker_deactivate_heater(module_id="module-id")

    assert result == response


def test_temperature_module_set_target_temperature(
    decoy: Decoy, transport: AbstractSyncTransport, subject: SyncClient
) -> None:
    """Should execute a PE set_target_temperature command."""
    request = commands.temperature_module.SetTargetTemperatureCreate(
        params=commands.temperature_module.SetTargetTemperatureParams(
            moduleId="module-id", celsius=38.7
        ),
    )
    response = commands.temperature_module.SetTargetTemperatureResult(
        targetTemperature=38.7
    )

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.temperature_module_set_target_temperature(
        module_id="module-id", celsius=38.7
    )

    assert result == response


def test_temperature_module_deactivate(
    decoy: Decoy, transport: AbstractSyncTransport, subject: SyncClient
) -> None:
    """Should execute a PE deactivate temperature command."""
    request = commands.temperature_module.DeactivateTemperatureCreate(
        params=commands.temperature_module.DeactivateTemperatureParams(
            moduleId="module-id"
        ),
    )
    response = commands.temperature_module.DeactivateTemperatureResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.temperature_module_deactivate(module_id="module-id")

    assert result == response


def test_temperature_module_wait_for_target_temperature(
    decoy: Decoy, transport: AbstractSyncTransport, subject: SyncClient
) -> None:
    """Should execute a PE wait_for_target_temperature command."""
    request = commands.temperature_module.WaitForTemperatureCreate(
        params=commands.temperature_module.WaitForTemperatureParams(
            moduleId="module-id", celsius=38.7
        ),
    )
    response = commands.temperature_module.WaitForTemperatureResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.temperature_module_wait_for_target_temperature(
        module_id="module-id", celsius=38.7
    )

    assert result == response
