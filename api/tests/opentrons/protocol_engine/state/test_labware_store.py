"""Labware state store tests."""
import pytest

from datetime import datetime

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV3
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
    OFF_DECK_LOCATION,
    LabwareMovementStrategy,
)
from opentrons.protocol_engine.actions import (
    AddLabwareOffsetAction,
    AddLabwareDefinitionAction,
    UpdateCommandAction,
)
from opentrons.protocol_engine.state.labware import LabwareStore, LabwareState

from .command_fixtures import (
    create_load_labware_command,
    create_load_adapter_command,
    create_move_labware_command,
)


@pytest.fixture
def subject(
    ot2_standard_deck_def: DeckDefinitionV3,
    ot2_fixed_trash_def: LabwareDefinition,
) -> LabwareStore:
    """Get a LabwareStore test subject."""
    return LabwareStore(
        deck_definition=ot2_standard_deck_def,
        deck_fixed_labware=[
            DeckFixedLabware(
                labware_id="fixedTrash",
                location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
                definition=ot2_fixed_trash_def,
            )
        ],
    )


def test_initial_state(
    ot2_standard_deck_def: DeckDefinitionV3,
    ot2_fixed_trash_def: LabwareDefinition,
    subject: LabwareStore,
) -> None:
    """It should create the labware store with preloaded fixed labware."""
    expected_trash_uri = uri_from_details(
        namespace=ot2_fixed_trash_def.namespace,
        version=ot2_fixed_trash_def.version,
        load_name=ot2_fixed_trash_def.parameters.loadName,
    )

    assert subject.state == LabwareState(
        deck_definition=ot2_standard_deck_def,
        labware_by_id={
            "fixedTrash": LoadedLabware(
                id="fixedTrash",
                loadName=ot2_fixed_trash_def.parameters.loadName,
                definitionUri=expected_trash_uri,
                location=DeckSlotLocation(slotName=DeckSlotName.FIXED_TRASH),
                offsetId=None,
            )
        },
        labware_offsets_by_id={},
        definitions_by_uri={expected_trash_uri: ot2_fixed_trash_def},
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
        display_name="display-name",
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
        displayName="display-name",
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


def test_handles_load_adapter(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should add the adapter data to the state."""
    offset_request = LabwareOffsetCreate(
        definitionUri="offset-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )

    command = create_load_adapter_command(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        adapter_id="test-adapter-id",
        definition=well_plate_def,
        offset_id="offset-id",
    )

    expected_definition_uri = uri_from_details(
        load_name=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )

    expected_adapter_data = LoadedLabware(
        id="test-adapter-id",
        loadName=well_plate_def.parameters.loadName,
        definitionUri=expected_definition_uri,
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        offsetId="offset-id",
        displayName=None,
    )

    subject.handle_action(
        AddLabwareOffsetAction(
            request=offset_request,
            labware_offset_id="offset-id",
            created_at=datetime(year=2021, month=1, day=2),
        )
    )
    subject.handle_action(UpdateCommandAction(command=command))

    assert subject.state.labware_by_id["test-adapter-id"] == expected_adapter_data

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


def test_handles_move_labware(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should update labware state with new location & offset."""
    load_labware_command = create_load_labware_command(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        labware_id="my-labware-id",
        definition=well_plate_def,
        offset_id="old-offset-id",
        display_name="display-name",
    )
    offset_request = LabwareOffsetCreate(
        definitionUri="offset-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    subject.handle_action(
        AddLabwareOffsetAction(
            request=offset_request,
            labware_offset_id="old-offset-id",
            created_at=datetime(year=2021, month=1, day=2),
        )
    )
    subject.handle_action(UpdateCommandAction(command=load_labware_command))

    move_command = create_move_labware_command(
        labware_id="my-labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_4),
        offset_id="my-new-offset",
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
    )
    subject.handle_action(UpdateCommandAction(command=move_command))

    assert subject.state.labware_by_id["my-labware-id"].location == DeckSlotLocation(
        slotName=DeckSlotName.SLOT_4
    )
    assert subject.state.labware_by_id["my-labware-id"].offsetId == "my-new-offset"


def test_handles_move_labware_off_deck(
    subject: LabwareStore,
    well_plate_def: LabwareDefinition,
) -> None:
    """It should update labware state with new location & offset."""
    load_labware_command = create_load_labware_command(
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
        labware_id="my-labware-id",
        definition=well_plate_def,
        offset_id="old-offset-id",
        display_name="display-name",
    )
    offset_request = LabwareOffsetCreate(
        definitionUri="offset-definition-uri",
        location=LabwareOffsetLocation(slotName=DeckSlotName.SLOT_1),
        vector=LabwareOffsetVector(x=1, y=2, z=3),
    )
    subject.handle_action(
        AddLabwareOffsetAction(
            request=offset_request,
            labware_offset_id="old-offset-id",
            created_at=datetime(year=2021, month=1, day=2),
        )
    )
    subject.handle_action(UpdateCommandAction(command=load_labware_command))

    move_labware_off_deck_cmd = create_move_labware_command(
        labware_id="my-labware-id",
        new_location=OFF_DECK_LOCATION,
        strategy=LabwareMovementStrategy.MANUAL_MOVE_WITH_PAUSE,
    )
    subject.handle_action(UpdateCommandAction(command=move_labware_off_deck_cmd))
    assert subject.state.labware_by_id["my-labware-id"].location == OFF_DECK_LOCATION
    assert subject.state.labware_by_id["my-labware-id"].offsetId is None
