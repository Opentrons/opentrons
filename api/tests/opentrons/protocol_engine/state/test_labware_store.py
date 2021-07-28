"""Labware state store tests."""
import pytest

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons_shared_data.deck.dev_types import DeckDefinitionV2
from opentrons.protocols.models import LabwareDefinition
from opentrons.types import DeckSlotName

from opentrons.protocol_engine.resources import DeckFixedLabware
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.state.actions import UpdateCommandAction
from opentrons.protocol_engine.state.labware import (
    LabwareStore,
    LabwareState,
    LabwareData,
)

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

    # TODO(mc, 2021-06-02): usage of ._state over .state is temporary
    # until store.state returns the state instead of a state view
    assert subject._state == LabwareState(
        deck_definition=standard_deck_def,
        labware_by_id={
            "fixedTrash": LabwareData(
                location=DeckSlotLocation(slot=DeckSlotName.FIXED_TRASH),
                uri=expected_trash_uri,
                calibration=(0, 0, 0),
            )
        },
        labware_definitions_by_uri={expected_trash_uri: fixed_trash_def},
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
        calibration=(1, 2, 3),
    )

    expected_definition_uri = uri_from_details(
        load_name=well_plate_def.parameters.loadName,
        namespace=well_plate_def.namespace,
        version=well_plate_def.version,
    )

    expected_labware_data = LabwareData(
        uri=expected_definition_uri,
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
        calibration=(1, 2, 3),
    )

    subject.handle_action(UpdateCommandAction(command=command))

    # TODO(mc, 2021-06-02): usage of ._state over .state is temporary
    # until store.state returns the state instead of a state view
    assert subject._state.labware_by_id["test-labware-id"] == expected_labware_data
    assert (
        subject._state.labware_definitions_by_uri[expected_definition_uri]
        == well_plate_def
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

    # TODO(mc, 2021-06-02): usage of ._state over .state is temporary
    # until store.state returns the state instead of a state view
    assert subject._state.labware_definitions_by_uri[expected_uri] == well_plate_def
