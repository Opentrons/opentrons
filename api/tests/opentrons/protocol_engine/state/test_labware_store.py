"""Labware state store tests."""
import pytest

from datetime import datetime

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.resources import DeckFixedLabware
from opentrons.protocol_engine.types import (
    LabwareOffset,
    LabwareOffsetCreate,
    LabwareOffsetVector,
    LabwareOffsetLocation,
    DeckSlotLocation,
    LoadedLabware,
)
from opentrons.protocol_engine.actions import (
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
    UpdateCommandAction,
)
from opentrons.protocol_engine.state.labware import LabwareStore, LabwareState

from .command_fixtures import create_load_labware_command


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
                location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
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
                location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
                offsetId=None,
            )
        },
        labware_offsets_by_id={},
        definitions_by_uri={expected_trash_uri: fixed_trash_def},
    )


def test_handles_add_labware_offset(
    subject: LabwareStore,
) -> None:
    """It should add the labware offset to the state and add the ID."""
    request = LabwareOffsetCreate(
        definitionUri="offset-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )

    resolved_offset = LabwareOffset(
        id="offset-id",
        createdAt=datetime(year=2021, month=1, day=2),
        definitionUri="offset-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )

    subject.handle_action(
        AddLabwareOffsetAction(
            labware_offset_id="offset-id",
            created_at=datetime(year=2021, month=1, day=2),
            request=request,
        )
    )

    assert subject.state.labware_offsets_by_id == {"offset-id": resolved_offset}


def test_handles_load_labware(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should add the labware data to the state."""
    offset_request = LabwareOffsetCreate(
        definitionUri="offset-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )

    command = create_load_labware_command(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        labware_id="test-labware-id",
        definition=well_plate_def,
        offset_id="offset-id",
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
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId="offset-id",
    )

    subject.handle_action(
        AddLabwareOffsetAction(
            request=offset_request,
            labware_offset_id="offset-id",
            created_at=datetime(year=2021, month=1, day=2),
        )
    )
    subject.handle_action(UpdateCommandAction(command=command))

    assert subject.state.labware_by_id["test-labware-id"] == expected_labware_data

    assert subject.state.definitions_by_uri[expected_definition_uri] == well_plate_def


def test_handles_add_labware_definition(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should add the labware definition to the state."""
    expected_uri = uri_from_details(
        load_name=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )

    subject.handle_action(AddLabwareDefinitionAction(definition=well_plate_def))

    assert subject.state.definitions_by_uri[expected_uri] == well_plate_def


def test_only_one_trash_labware(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should ensure there is only ever one trash labware loaded."""
    command = create_load_labware_command(
        location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
        labware_id="test-labware-id",
        definition=well_plate_def,
        offset_id=None,
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
        location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
        offsetId=None,
    )

    subject.handle_action(UpdateCommandAction(command=command))

    trash_labware = [
        lw
        for lw in subject.state.labware_by_id.values()
        if lw.location == DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH)
    ]

    assert trash_labware == [expected_labware_data]
