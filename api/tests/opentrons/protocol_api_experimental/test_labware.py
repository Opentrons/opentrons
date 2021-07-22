"""Tests for the Protocol API v3 labware interface."""
import pytest
from decoy import Decoy
from pytest_lazyfixture import lazy_fixture     # type: ignore

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import DeckSlotLocation
from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_api_experimental import (DeckSlotName,
                                                 Labware,
                                                 Point,
                                                 Well,
                                                 errors)
from opentrons_shared_data.labware import dev_types


@pytest.fixture
def decoy() -> Decoy:
    """Get a Decoy test double container."""
    return Decoy()


@pytest.fixture
def engine_client(decoy: Decoy) -> ProtocolEngineClient:
    """Get a mock instance of a ProtocolEngineClient."""
    return decoy.create_decoy(spec=ProtocolEngineClient)


@pytest.fixture
def min_labware_definition(
        minimal_labware_def: dev_types.LabwareDefinition
) -> LabwareDefinition:
    """Create a labware definition fixture."""
    return LabwareDefinition.parse_obj(minimal_labware_def)


@pytest.fixture
def min_labware_definition2(
        minimal_labware_def: dev_types.LabwareDefinition
) -> LabwareDefinition:
    """Create another labware definition fixture."""
    minimal_labware_def['parameters'].update({'magneticModuleEngageHeight': 101.0,
                                              'tipLength': 42.0})
    return LabwareDefinition.parse_obj(minimal_labware_def)


@pytest.fixture
def labware_definition(
        min_labware_definition: LabwareDefinition
) -> LabwareDefinition:
    """Labware definition fixture to use in subject, and to use for parametrization."""
    return min_labware_definition


@pytest.fixture
def subject(decoy: Decoy,
            engine_client: ProtocolEngineClient,
            labware_definition: LabwareDefinition,
            ) -> Labware:
    """Get a Labware test subject with its dependencies mocked out."""
    decoy.when(
        engine_client.state.labware.get_labware_definition(labware_id="labware-id")
    ).then_return(labware_definition)
    return Labware(engine_client=engine_client, labware_id="labware-id")


def test_has_labware_definition(subject: Labware) -> None:
    """Test that labware object caches labware_definition."""
    assert subject._definition is not None


def test_labware_id_property(subject: Labware) -> None:
    """It should expose a property for its engine instance identifier."""
    assert subject.labware_id == "labware-id"


def test_labware_equality(decoy: Decoy,
                          engine_client: ProtocolEngineClient,
                          labware_definition: LabwareDefinition) -> None:
    """Two labware with the same ID should be considered equal."""
    decoy.when(
        engine_client.state.labware.get_labware_definition(labware_id="123")
    ).then_return(labware_definition)
    labware_1 = Labware(engine_client=engine_client, labware_id="123")
    labware_2 = Labware(engine_client=engine_client, labware_id="123")
    assert labware_1 == labware_2


def test_labware_uri(
    decoy: Decoy, engine_client: ProtocolEngineClient, subject: Labware
) -> None:
    """It should get its definition's URI from the engine."""
    decoy.when(
        engine_client.state.labware.get_definition_uri(labware_id="labware-id")
    ).then_return("42")
    assert subject.uri == "42"


def test_labware_deck_slot_parent(
    decoy: Decoy, engine_client: ProtocolEngineClient, subject: Labware
) -> None:
    """It should return a deck slot name if labware is loaded on the deck."""
    decoy.when(
        engine_client.state.labware.get_labware_location(labware_id="labware-id")
    ).then_return(DeckSlotLocation(slot=DeckSlotName.SLOT_5))

    assert subject.parent == "5"


def test_labware_load_name(
    decoy: Decoy, engine_client: ProtocolEngineClient, subject: Labware
) -> None:
    """It should return the definition's load name."""
    decoy.when(
        engine_client.state.labware.get_load_name(labware_id="labware-id")
    ).then_return("load-name")

    assert subject.load_name == "load-name"


def test_labware_calibrated_offset(
    decoy: Decoy, engine_client: ProtocolEngineClient, subject: Labware
) -> None:
    """It should return the labware's origin point."""
    decoy.when(
        engine_client.state.geometry.get_labware_position(labware_id="labware-id")
    ).then_return(Point(1, 2, 3))

    assert subject.calibrated_offset == Point(1, 2, 3)


def test_labware_highest_z(
    decoy: Decoy, engine_client: ProtocolEngineClient, subject: Labware
) -> None:
    """It should return the labware's highest Z point."""
    decoy.when(
        engine_client.state.geometry.get_labware_highest_z(labware_id="labware-id")
    ).then_return(42.0)

    assert subject.highest_z == 42.0


def test_labware_quirks(
    decoy: Decoy, engine_client: ProtocolEngineClient, subject: Labware
) -> None:
    """It should return the labware definition's quirks."""
    decoy.when(
        engine_client.state.labware.get_quirks(labware_id="labware-id")
    ).then_return(["foo", "bar", "baz"])

    assert subject.quirks == ["foo", "bar", "baz"]


def test_labware_parameters(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    min_labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return the labware definition's parameters."""
    assert subject.parameters == min_labware_definition.parameters


def test_labware_magdeck_engage_height_not_compatible(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    min_labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return None for magdeck engage height if not in definition."""
    assert subject.magdeck_engage_height is None


@pytest.mark.parametrize("labware_definition",
                         [lazy_fixture("min_labware_definition2")])
def test_labware_magdeck_engage_height(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return magdeck engage height from definition."""
    assert subject.magdeck_engage_height == 101.0


def test_labware_is_not_tiprack(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    min_labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return False if not tiprack."""
    assert subject.is_tiprack is False


@pytest.mark.parametrize("labware_definition",
                         [lazy_fixture("min_labware_definition2")])
def test_labware_tip_length(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    min_labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return tip length if present in the definition."""
    assert subject.tip_length == 42.0


def test_labware_no_tip_length(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    min_labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should raise a LabwareIsNotTiprackError if tip length is not present."""
    with pytest.raises(errors.LabwareIsNotTipRackError):
        subject.tip_length


def test_labware_has_wells_by_name(
        decoy: Decoy,
        engine_client: ProtocolEngineClient,
        min_labware_definition: LabwareDefinition,
        subject: Labware,
) -> None:
    """It should return Dict of Well objects by name."""
    assert subject.wells_by_name() == {'A1': Well(well_name='A1',
                                                  engine_client=engine_client,
                                                  labware=subject),
                                       'A2': Well(well_name='A2',
                                                  engine_client=engine_client,
                                                  labware=subject)}


def test_labware_has_wells_list(
        decoy: Decoy,
        engine_client: ProtocolEngineClient,
        min_labware_definition: LabwareDefinition,
        subject: Labware,
) -> None:
    """It should return List of Well objects."""
    assert subject.wells() == [Well(well_name='A1',
                                    engine_client=engine_client,
                                    labware=subject),
                               Well(well_name='A2',
                                    engine_client=engine_client,
                                    labware=subject)
                               ]


def test_labware_rows(
        decoy: Decoy,
        engine_client: ProtocolEngineClient,
        subject: Labware,
) -> None:
    """It should return the labware's wells as list of rows."""
    assert subject.rows() == [[Well(well_name='A1',
                                    engine_client=engine_client,
                                    labware=subject),
                               Well(well_name='A2',
                                    engine_client=engine_client,
                                    labware=subject)]]


def test_labware_rows_by_name(
        decoy: Decoy,
        engine_client: ProtocolEngineClient,
        subject: Labware,
) -> None:
    """It should return the labware's wells as dictionary of rows."""
    assert subject.rows_by_name() == {"A": [Well(well_name='A1',
                                                 engine_client=engine_client,
                                                 labware=subject),
                                            Well(well_name='A2',
                                                 engine_client=engine_client,
                                                 labware=subject)]}


def test_labware_columns(
        decoy: Decoy,
        engine_client: ProtocolEngineClient,
        subject: Labware,
) -> None:
    """It should return the labware's wells as list of columns."""
    assert subject.columns() == [[Well(well_name='A1',
                                       engine_client=engine_client,
                                       labware=subject)],
                                 [Well(well_name='A2',
                                       engine_client=engine_client,
                                       labware=subject)]]


def test_labware_columns_by_name(
        decoy: Decoy,
        engine_client: ProtocolEngineClient,
        subject: Labware,
) -> None:
    """It should return the labware's wells as dictionary of columns."""
    assert subject.columns_by_name() == {"1": [Well(well_name='A1',
                                                    engine_client=engine_client,
                                                    labware=subject)],
                                         "2": [Well(well_name='A2',
                                                    engine_client=engine_client,
                                                    labware=subject)]}
