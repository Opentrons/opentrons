"""Test instrument context."""
import pytest
from decoy import Decoy

from opentrons.protocol_api_experimental.instrument_context import InstrumentContext
from opentrons.protocol_api_experimental.labware import Well, Labware
from opentrons.protocol_engine.clients import SyncClient
from opentrons.protocol_engine.types import WellLocation, WellOrigin


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


def test_aspirate(
    decoy: Decoy,
    sync_client: SyncClient,
    pipette_id: str,
    subject: InstrumentContext,
    well: Well
) -> None:
    """It should send an aspirate command to the SyncClient."""
    subject.aspirate(volume=12345.6789, location=well, rate=1.0)

    decoy.verify(sync_client.aspirate(
        pipette_id=pipette_id,
        labware_id=well.parent.resource_id,
        well_name=well.well_name,
        well_location=WellLocation(
            origin=WellOrigin.BOTTOM,
            offset=(0, 0, 1)
        ),
        volume=12345.6789
    ))


def test_aspirate_not_implemented_errors(
    subject: InstrumentContext,
    well: Well,
) -> None:
    """It should raise NotImplementedError when appropriate."""
    with pytest.raises(NotImplementedError):
        # location other than a Well not supported.
        subject.aspirate(12345.6789, well.bottom(1), 1)
    with pytest.raises(NotImplementedError):
        # Non-default rate not supported.
        subject.aspirate(12345.6789, well, 0.9)
    with pytest.raises(NotImplementedError):
        # 0 volume not supported.
        subject.aspirate(0, well, 1)
    with pytest.raises(NotImplementedError):
        # None volume not supported.
        subject.aspirate(None, well, 1)


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
