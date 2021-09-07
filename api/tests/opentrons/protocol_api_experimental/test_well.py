"""Tests for the Protocol API v3 Well interface."""
import pytest
from decoy import Decoy
from opentrons.protocols.models import WellDefinition
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_api_experimental import Labware, Well
from opentrons_shared_data.labware import dev_types


@pytest.fixture
def engine_client(decoy: Decoy) -> ProtocolEngineClient:
    """Get a mock instance of a ProtocolEngineClient."""
    return decoy.mock(cls=ProtocolEngineClient)


@pytest.fixture
def labware(decoy: Decoy) -> Labware:
    """Get a mock instance of a Labware."""
    lw = decoy.mock(cls=Labware)
    lw.labware_id = "labware_id"  # type: ignore
    return lw


@pytest.fixture
def min_well_definition(
    minimal_labware_def: dev_types.LabwareDefinition,
) -> WellDefinition:
    """Create a well definition fixture."""
    well_def = minimal_labware_def["wells"]["A1"]
    return WellDefinition.parse_obj(well_def)


@pytest.fixture
def subject(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware: Labware,
    min_well_definition: WellDefinition,
) -> Well:
    """Get a Well test subject with its dependencies mocked out."""
    decoy.when(
        engine_client.state.labware.get_well_definition(
            labware_id="labware_id", well_name="well_name"
        )
    ).then_return(min_well_definition)
    return Well(engine_client=engine_client, labware=labware, well_name="well_name")


def test_max_volume(subject: Well) -> None:
    """Test Well has max_volume property."""
    assert subject.max_volume == 100


def test_diameter(subject: Well) -> None:
    """Test Well has diameter property."""
    assert subject.diameter == 30.0


def test_depth(subject: Well) -> None:
    """Test Well has depth property."""
    assert subject.depth == 40.0


def test_equality(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware: Labware,
    min_well_definition: WellDefinition,
    subject: Well,
) -> None:
    """Two same-named Wells in the same labware should be considered equal."""
    decoy.when(
        engine_client.state.labware.get_well_definition(
            labware_id="labware_id", well_name="well_name"
        )
    ).then_return(min_well_definition)
    well1 = Well(engine_client=engine_client, labware=labware, well_name="well_name")
    well2 = Well(engine_client=engine_client, labware=labware, well_name="well_name")
    assert well1 == well2
