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
from opentrons.protocol_engine.types import WellOrigin, WellLocation


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
    request = commands.LoadLabwareRequest(
        data=commands.LoadLabwareData(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_5),
            loadName="some_labware",
            namespace="opentrons",
            version=1,
            labwareId=None,
        )
    )

    result = commands.LoadLabwareResult(
        labwareId="abc123",
        definition=tip_rack_def,
        calibration=(1, 2, 3),
    )

    decoy.when(transport.execute_command(request=request)).then_return(result)

    return result


def test_load_labware(
    stubbed_load_labware_result: commands.LoadLabwareResult,
    subject: SyncClient,
) -> None:
    """It should execute a load labware command."""
    result = subject.load_labware(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_5),
        load_name="some_labware",
        namespace="opentrons",
        version=1,
    )

    assert result == stubbed_load_labware_result


def test_load_pipette(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a load pipette command and return its result."""
    request = commands.LoadPipetteRequest(
        data=commands.LoadPipetteData(
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
    request = commands.PickUpTipRequest(
        data=commands.PickUpTipData(pipetteId="123", labwareId="456", wellName="A2")
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
    request = commands.DropTipRequest(
        data=commands.DropTipData(pipetteId="123", labwareId="456", wellName="A2")
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
    request = commands.AspirateRequest(
        data=commands.AspirateData(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1)),
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
        well_location=WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1)),
        volume=123.45,
    )

    assert result == result_from_transport


def test_dispense(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a dispense command."""
    request = commands.DispenseRequest(
        data=commands.DispenseData(
            pipetteId="123",
            labwareId="456",
            wellName="A2",
            wellLocation=WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1)),
            volume=10,
        )
    )

    response = commands.DispenseResult(volume=1)

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.dispense(
        pipette_id="123",
        labware_id="456",
        well_name="A2",
        well_location=WellLocation(origin=WellOrigin.BOTTOM, offset=(0, 0, 1)),
        volume=10,
    )

    assert result == response


def test_pause(
    decoy: Decoy,
    transport: AbstractSyncTransport,
    subject: SyncClient,
) -> None:
    """It should execute a pause command."""
    request = commands.PauseRequest(data=commands.PauseData(message="hello world"))
    response = commands.PauseResult()

    decoy.when(transport.execute_command(request=request)).then_return(response)

    result = subject.pause(message="hello world")

    assert result == response
