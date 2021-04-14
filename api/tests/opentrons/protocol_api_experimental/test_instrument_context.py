"""Test instrument context."""
import pytest
from decoy import Decoy

from opentrons.protocol_api_experimental.instrument_context import InstrumentContext
from opentrons.protocol_api_experimental.labware import Well, Labware
from opentrons.protocol_engine.clients import SyncClient
from opentrons.protocol_engine.types import WellOrigin, WellLocation


@pytest.fixture
def decoy() -> Decoy:
    """Decoy fixture."""
    return Decoy()


@pytest.fixture
def sync_client(decoy: Decoy) -> SyncClient:
    """Mock sync client."""
    return decoy.create_decoy(spec=SyncClient)


@pytest.fixture
def pipette_id() -> str:
    """Pipette id."""
    return "some_id"


@pytest.fixture
def subject(sync_client: SyncClient, pipette_id: str) -> InstrumentContext:
    """Test subject."""
    return InstrumentContext(client=sync_client, resource_id=pipette_id)


@pytest.fixture
def labware() -> Labware:
    """Labware fixture."""
    return Labware(resource_id="12345")


@pytest.fixture
def well(labware: Labware) -> Well:
    """Well fixture."""
    return Well(well_name="A1", labware=labware)


def test_pick_up_tip(
        decoy: Decoy,
        sync_client: SyncClient,
        pipette_id: str,
        subject: InstrumentContext,
        well: Well
) -> None:
    """It should send a pick up tip command."""
    subject.pick_up_tip(location=well)

    decoy.verify(sync_client.pick_up_tip(
        pipette_id=pipette_id,
        labware_id=well.parent.resource_id,
        well_name=well.well_name
    ))


def test_drop_tip(
        decoy: Decoy,
        sync_client: SyncClient,
        pipette_id: str,
        subject: InstrumentContext,
        well: Well
) -> None:
    """It should send a pick up tip command."""
    subject.drop_tip(location=well)

    decoy.verify(sync_client.drop_tip(
        pipette_id=pipette_id,
        labware_id=well.parent.resource_id,
        well_name=well.well_name
    ))


def test_dispense(
        decoy: Decoy,
        sync_client: SyncClient,
        pipette_id: str,
        subject: InstrumentContext,
        well: Well
) -> None:
    """It should send a dispense command."""
    subject.dispense(volume=10, location=well)

    decoy.verify(sync_client.dispense(
        pipette_id=pipette_id,
        labware_id=well.parent.resource_id,
        well_name=well.well_name,
        well_location=WellLocation(origin=WellOrigin.BOTTOM,
                                   offset=(0, 0, 1)),
        volume=10
    ))
