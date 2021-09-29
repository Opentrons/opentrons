"""Labware state store tests."""
import pytest

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.resources import DeckFixedLabware
from opentrons.protocol_engine.types import (
    CalibrationOffset,
    DeckSlotLocation,
    LoadedLabware,
)
from opentrons.protocol_engine.actions import UpdateCommandAction
from opentrons.protocol_engine.state.labware import LabwareStore, LabwareState

from .command_fixtures import create_load_labware_command, create_add_definition_command


@pytest.fixture
def subject(
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
) -> LabwareStore:
    """Get a LabwareStore test subject."""
    return LabwareStore(
        deck_definition=standard_deck_def,
        deck_fixed_labware=[
            DeckFixedLabware(
                labware_id="fixedTrash",
                location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
                definition=fixed_trash_def,
            )
        ],
    )


def test_initial_state(
    standard_deck_def: DeckDefinitionV2,
    fixed_trash_def: LabwareDefinition,
    subject: LabwareStore,
) -> None:
    """It should create the labware store with preloaded fixed labware."""
    expected_trash_uri = uri_from_details(
        namespace=fixed_trash_def.namespace,
        version=fixed_trash_def.version,
        load_name=fixed_trash_def.parameters.loadName,
    )

    assert subject.state == LabwareState(
        deck_definition=standard_deck_def,
        labware_by_id={
            "fixedTrash": LoadedLabware(
                id="fixedTrash",
                loadName=fixed_trash_def.parameters.loadName,
                definitionUri=expected_trash_uri,
                location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
            )
        },
        calibrations_by_id={"fixedTrash": CalibrationOffset(x=0, y=0, z=0)},
        definitions_by_uri={expected_trash_uri: fixed_trash_def},
    )


def test_handles_load_labware(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should add the labware data to the state."""
    command = create_load_labware_command(
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        labware_id="test-labware-id",
        definition=well_plate_def,
        calibration=CalibrationOffset(x=1, y=2, z=3),
    )

    expected_definition_uri = uri_from_details(
        load_name=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )

    expected_labware_data = LoadedLabware(
        id="test-labware-id",
        loadName=well_plate_def.parameters.loadName,
        definitionUri=expected_definition_uri,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
    )

    subject.handle_action(UpdateCommandAction(command=command))

    assert subject.state.labware_by_id["test-labware-id"] == expected_labware_data

    assert subject.state.definitions_by_uri[expected_definition_uri] == well_plate_def

    assert subject.state.calibrations_by_id["test-labware-id"] == CalibrationOffset(
        x=1, y=2, z=3
    )


def test_handles_add_labware_defintion(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should add the labware definition to the state store."""
    command = create_add_definition_command(definition=well_plate_def)
    expected_uri = uri_from_details(
        load_name=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )

    subject.handle_action(UpdateCommandAction(command=command))

    assert subject.state.definitions_by_uri[expected_uri] == well_plate_def
