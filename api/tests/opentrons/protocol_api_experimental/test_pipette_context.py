"""Test instrument context."""
import pytest
from decoy import Decoy

from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocol_engine.types import WellOrigin, WellOffset, WellLocation
from opentrons.protocol_api_experimental import PipetteContext, Labware, Well
from opentrons.protocol_api.core.protocol_api.well import WellImplementation


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


@pytest.mark.xfail(strict=True, raises=NotImplementedError)
def test_dispense(
    decoy: Decoy,
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send a dispense command."""
    subject.dispense(volume=10, location=well, rate=3.0)

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
            flow_rate=3.0,
        )
    )


def test_blow_out(
    decoy: Decoy,
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send a blowout command to the SyncClient."""
    subject.blow_out(location=well)

    decoy.verify(
        engine_client.blow_out(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well.well_name,
            well_location=WellLocation(),
        )
    )


def test_touch_tip(
    decoy: Decoy,
    engine_client: EngineClient,
    pipette_id: str,
    labware_id: str,
    well: Well,
    subject: PipetteContext,
) -> None:
    """It should send a touch tip command."""
    subject.touch_tip(location=well, v_offset=-0.5)

    decoy.verify(
        engine_client.touch_tip(
            pipette_id=pipette_id,
            labware_id=labware_id,
            well_name=well.well_name,
            well_location=WellLocation(
                origin=WellOrigin.TOP,
                offset=WellOffset(x=0, y=0, z=-0.5),
            ),
        )
    )
