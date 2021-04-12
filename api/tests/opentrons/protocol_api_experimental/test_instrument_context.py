"""Test instrument context."""
import pytest
from decoy import Decoy

from opentrons.protocol_api_experimental.instrument_context import InstrumentContext
from opentrons.protocol_api_experimental.labware import Well, Labware
from opentrons.protocol_engine.clients import SyncClient


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
    return InstrumentContext(client=sync_client, pipette_id=pipette_id)


@pytest.fixture
def labware() -> Labware:
    """Labware fixture."""
    return Labware(labware_id="12345")


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
        pipetteId=pipette_id,
        labwareId=well.parent.id,
        wellName=well.well_name
    ))
