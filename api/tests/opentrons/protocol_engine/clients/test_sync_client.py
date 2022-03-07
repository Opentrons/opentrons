"""Tests for the Protocol Context's synchronous engine adapter.

Since Python protocol execution happens off the main thread, these tests call
the subject's methods in a synchronous context in a child thread to ensure:

- In the Protocol execution thread, calls are synchronous and block until
    command execution is complete.
- In the main thread, the Protocol Engine does its work in the main event
    loop, without blocking.
"""
import pytest
from decoy import Decoy

from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_engine import DeckSlotLocation, PipetteName, commands
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


@pytest.fixture
def stubbed_load_labware_result(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    tip_rack_def: LabwareDefinition,
) -> commands.LoadLabwareResult:
    """Set up the protocol engine with default stubbed response for load labware."""
    request = commands.LoadLabwareCreate(
        params=commands.LoadLabwareParams(
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
            loadName="some_labware",
            namespace="opentrons",
            version=1,
            labwareId=None,
        )
    )

    result = commands.LoadLabwareResult(
        labwareId="abc123",
        definition=tip_rack_def,
        offsetId=None,
    )

    decoy.when(transport.execute_command(request=request)).then_return(result)

    return result


def test_load_labware(
    stubbed_load_labware_result: commands.LoadLabwareResult,
    subject: SyncClient,
) -> None:
    """It should execute a load labware command."""
    result = subject.load_labware(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_5),
        load_name="some_labware",
        namespace="opentrons",
        version=1,
    )

    assert result == stubbed_load_labware_result


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
            pipetteName=PipetteName.P300_SINGLE,
            mount=MountType.RIGHT,
        )
    )

    expected_result = commands.LoadPipetteResult(pipetteId="abc123")

    decoy.when(transport.execute_command(request=request)).then_return(expected_result)

    result = subject.load_pipette(
        pipette_name=PipetteName.P300_SINGLE,
        mount=MountType.RIGHT,
    )

    assert result == expected_result


def test_pick_up_tip(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a pick up tip command."""
    request = commands.PickUpTipCreate(
        params=commands.PickUpTipParams(pipetteId="123", labwareId="456", wellName="A2")
    )
    response = commands.PickUpTipResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.pick_up_tip(pipette_id="123", labware_id="456", well_name="A2")

    assert result == response


def test_drop_tip(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a drop up tip command."""
    request = commands.DropTipCreate(
        params=commands.DropTipParams(pipetteId="123", labwareId="456", wellName="A2")
    )
    response = commands.DropTipResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.drop_tip(pipette_id="123", labware_id="456", well_name="A2")

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


def test_pause(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a pause command."""
    request = commands.PauseCreate(params=commands.PauseParams(message="hello world"))
    response = commands.PauseResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.pause(message="hello world")

    assert result == response


def test_magnetic_module_engage(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a Magnetic Module engage command."""
    request = commands.magnetic_module.EngageCreate(
        params=commands.magnetic_module.EngageParams(
            moduleId="module-id", engageHeight=12.34
        )
    )
    response = commands.magnetic_module.EngageResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.magnetic_module_engage(module_id="module-id", engage_height=12.34)

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
