"""Test instrument context."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import WellOrigin, WellOffset, WellLocation
from opentrons.protocol_api_experimental import PipetteContext, Labware, Well


@pytest.fixture
def engine_client(decoy: Decoy) -> EngineClient:
    """Mock sync client."""
    return decoy.mock(cls=EngineClient)


@pytest.fixture
def pipette_id() -> str:
    """Get a pipette id."""
    return "some_pipette_id"


@pytest.fixture
def labware_id() -> str:
    """Get a labware id."""
    return "some_labware_id"


@pytest.fixture
def labware(engine_client: EngineClient, labware_id: str) -> Labware:
    """Labware fixture."""
    return Labware(engine_client=engine_client, labware_id=labware_id)


@pytest.fixture
def well(engine_client: EngineClient, labware: Labware) -> Well:
    """Well fixture."""
    return Well(engine_client=engine_client, labware=labware, well_name="A1")


@pytest.fixture
def subject(engine_client: EngineClient, pipette_id: str) -> PipetteContext:
    """Test subject."""
    return PipetteContext(engine_client=engine_client, pipette_id=pipette_id)


def test_pick_up_tip(
    decoy: Decoy,
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send a pick up tip command."""
    subject.pick_up_tip(location=well)

    decoy.verify(
        engine_client.pick_up_tip(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well.well_name,
        )
    )


def test_drop_tip(
    decoy: Decoy,
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send a drop tip command."""
    subject.drop_tip(location=well)

    decoy.verify(
        engine_client.drop_tip(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well.well_name,
        )
    )


def test_aspirate(
    decoy: Decoy,
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send an aspirate command to the SyncClient."""
    subject.aspirate(volume=12345.6789, location=well, rate=1.0)

    decoy.verify(
        engine_client.aspirate(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well.well_name,
            well_location=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=WellOffset(x=0, y=0, z=1),
            ),
            volume=12345.6789,
        )
    )


def test_aspirate_not_implemented_errors(
    subject: PipetteContext,
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
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send a dispense command."""
    subject.dispense(volume=10, location=well)

    decoy.verify(
        engine_client.dispense(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well.well_name,
            well_location=WellLocation(
                origin=WellOrigin.BOTTOM,
                offset=WellOffset(x=0, y=0, z=1),
            ),
            volume=10,
        )
    )
