"""Tests for the Protocol API v3 labware interface."""
import pytest
from decoy import Decoy

from opentrons.protocols.models import LabwareDefinition
from opentrons.protocol_engine import DeckSlotLocation

from opentrons.protocol_engine.clients import SyncClient as ProtocolEngineClient
from opentrons.protocol_api_experimental import (
    DeckSlotName,
    Labware,
    Point,
    Well,
    errors,
)
from opentrons_shared_data.labware import dev_types


@pytest.fixture
def engine_client(decoy: Decoy) -> ProtocolEngineClient:
    """Get a mock instance of a ProtocolEngineClient."""
    return decoy.mock(cls=ProtocolEngineClient)


@pytest.fixture
def labware_definition(
    minimal_labware_def: dev_types.LabwareDefinition,
) -> LabwareDefinition:
    """Create a labware definition fixture."""
    return LabwareDefinition.parse_obj(minimal_labware_def)


@pytest.fixture
def subject(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
) -> Labware:
    """Get a Labware test subject with its dependencies mocked out."""
    return Labware(engine_client=engine_client, labware_id="labware-id")


def test_labware_id_property(subject: Labware) -> None:
    """It should expose a property for its engine instance identifier."""
    assert subject.labware_id == "labware-id"


def test_labware_equality(engine_client: ProtocolEngineClient) -> None:
    """Two labware with the same ID should be considered equal."""
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
        engine_client.state.labware.get_location(labware_id="labware-id")
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
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return the labware definition's parameters."""
    decoy.when(
        engine_client.state.labware.get_definition(labware_id="labware-id")
    ).then_return(labware_definition)
    assert subject.parameters == labware_definition.parameters


def test_labware_magdeck_engage_height_not_compatible(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return None for magdeck engage height if not in definition."""
    decoy.when(
        engine_client.state.labware.get_definition(labware_id="labware-id")
    ).then_return(labware_definition)

    assert subject.magdeck_engage_height is None


def test_labware_magdeck_engage_height(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return magdeck engage height from definition."""
    labware_definition.parameters.magneticModuleEngageHeight = 101.0
    decoy.when(
        engine_client.state.labware.get_definition(labware_id="labware-id")
    ).then_return(labware_definition)

    assert subject.magdeck_engage_height == 101.0


def test_labware_is_not_tiprack(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return False if not tiprack."""
    decoy.when(
        engine_client.state.labware.get_definition(labware_id="labware-id")
    ).then_return(labware_definition)
    assert subject.is_tiprack is False


def test_labware_tip_length(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return tip length if present in the definition."""
    labware_definition.parameters.tipLength = 42.0
    decoy.when(
        engine_client.state.labware.get_definition(labware_id="labware-id")
    ).then_return(labware_definition)
    assert subject.tip_length == 42.0


def test_labware_no_tip_length(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should raise a LabwareIsNotTiprackError if tip length is not present."""
    decoy.when(
        engine_client.state.labware.get_definition(labware_id="labware-id")
    ).then_return(labware_definition)
    with pytest.raises(errors.LabwareIsNotTipRackError):
        subject.tip_length


def test_labware_has_wells_by_name(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return Dict of Well objects by name."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])
    assert subject.wells_by_name() == {
        "A1": Well(well_name="A1", engine_client=engine_client, labware=subject),
        "A2": Well(well_name="A2", engine_client=engine_client, labware=subject),
    }


def test_wells_are_cached(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    labware_definition: LabwareDefinition,
    subject: Labware,
) -> None:
    """It should return the same Well instances in each call."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])
    call1 = subject.wells_by_name()
    call2 = subject.wells_by_name()
    assert call1 is call2


def test_labware_has_wells_list(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    subject: Labware,
) -> None:
    """It should return List of Well objects."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])
    assert subject.wells() == [
        Well(well_name="A1", engine_client=engine_client, labware=subject),
        Well(well_name="A2", engine_client=engine_client, labware=subject),
    ]


def test_labware_rows(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    subject: Labware,
) -> None:
    """It should return the labware's wells as list of rows."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])

    decoy.when(
        engine_client.state.labware.get_well_rows(labware_id="labware-id")
    ).then_return(
        {"A": ["A1", "A2"]},
    )

    assert subject.rows() == [
        [
            Well(well_name="A1", engine_client=engine_client, labware=subject),
            Well(well_name="A2", engine_client=engine_client, labware=subject),
        ]
    ]


def test_labware_rows_by_name(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    subject: Labware,
) -> None:
    """It should return the labware's wells as dictionary of rows."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])

    decoy.when(
        engine_client.state.labware.get_well_rows(labware_id="labware-id")
    ).then_return(
        {"A": ["A1", "A2"]},
    )
    assert subject.rows_by_name() == {
        "A": [
            Well(well_name="A1", engine_client=engine_client, labware=subject),
            Well(well_name="A2", engine_client=engine_client, labware=subject),
        ]
    }


def test_labware_columns(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    subject: Labware,
) -> None:
    """It should return the labware's wells as list of columns."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])

    decoy.when(
        engine_client.state.labware.get_well_columns(labware_id="labware-id")
    ).then_return({"1": ["A1"], "2": ["A2"]})

    assert subject.columns() == [
        [Well(well_name="A1", engine_client=engine_client, labware=subject)],
        [Well(well_name="A2", engine_client=engine_client, labware=subject)],
    ]


def test_labware_columns_by_name(
    decoy: Decoy,
    engine_client: ProtocolEngineClient,
    subject: Labware,
) -> None:
    """It should return the labware's wells as dictionary of columns."""
    decoy.when(
        engine_client.state.labware.get_wells(labware_id="labware-id")
    ).then_return(["A1", "A2"])

    decoy.when(
        engine_client.state.labware.get_well_columns(labware_id="labware-id")
    ).then_return({"1": ["A1"], "2": ["A2"]})

    assert subject.columns_by_name() == {
        "1": [Well(well_name="A1", engine_client=engine_client, labware=subject)],
        "2": [Well(well_name="A2", engine_client=engine_client, labware=subject)],
    }
