"""Tests for the LabwareStore+LabwareState+LabwareView trifecta.

The trifecta is tested here as a single unit, treating LabwareState as a private
implementation detail.
"""

import pytest

from opentrons_shared_data.deck.types import DeckDefinitionV5
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition3,
    Parameters3,
    RectangularWellDefinition3,
)

from opentrons.protocol_engine import actions, commands, errors
from opentrons.protocol_engine.state import update_types
from opentrons.protocol_engine.state.labware import (
    LabwareStore,
    LabwareView,
)
from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware
from opentrons.types import DeckSlotName


def _dummy_command() -> commands.Command:
    """Return a placeholder command."""
    return commands.Comment.model_construct()  # type: ignore[call-arg]


def test_get_labware(ot3_standard_deck_def: DeckDefinitionV5) -> None:
    """It should get a loaded labware."""
    subject = LabwareStore(deck_definition=ot3_standard_deck_def, deck_fixed_labware=[])

    labware_definition = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
        namespace="foo",
        parameters=Parameters3.model_construct(loadName="load_name"),  # type: ignore[call-arg]
        version=123,
    )

    load_labware_update = update_types.LoadedLabwareUpdate(
        labware_id="labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        offset_id=None,
        display_name="Display Name",
        definition=labware_definition,
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(loaded_labware=load_labware_update),
            command=_dummy_command(),
        )
    )

    assert LabwareView(subject.state).get(
        "labware-id"
    ) == LoadedLabware.model_construct(
        id="labware-id",
        location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        loadName="load_name",
        definitionUri="foo/load_name/123",
        offsetId=None,
        displayName="Display Name",
    )


def test_raise_if_not_tip_rack(ot3_standard_deck_def: DeckDefinitionV5) -> None:
    """It should raise if the labware is not a tip rack."""
    subject = LabwareStore(deck_definition=ot3_standard_deck_def, deck_fixed_labware=[])
    subject_view = LabwareView(subject.state)

    tiprack_definition = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
        namespace="foo",
        parameters=Parameters3.model_construct(loadName="load_name", isTiprack=True),  # type: ignore[call-arg]
        version=123,
    )
    load_tiprack_update = update_types.LoadedLabwareUpdate(
        labware_id="tiprack-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A2),
        offset_id=None,
        display_name="Display Name",
        definition=tiprack_definition,
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(loaded_labware=load_tiprack_update),
            command=_dummy_command(),
        )
    )
    subject_view.raise_if_not_tip_rack("tiprack-id")

    labware_definition = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
        namespace="foo",
        parameters=Parameters3.model_construct(loadName="load_name", isTiprack=False),  # type: ignore[call-arg]
        version=123,
    )
    load_labware_update = update_types.LoadedLabwareUpdate(
        labware_id="labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        offset_id=None,
        display_name="Display Name",
        definition=labware_definition,
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(loaded_labware=load_labware_update),
            command=_dummy_command(),
        )
    )
    with pytest.raises(errors.LabwareIsNotTipRackError):
        subject_view.raise_if_not_tip_rack("labware-id")


def test_raise_if_wells_are_invalid(ot3_standard_deck_def: DeckDefinitionV5) -> None:
    """It should raise if the wells given do not exist for that labware."""
    subject = LabwareStore(deck_definition=ot3_standard_deck_def, deck_fixed_labware=[])
    subject_view = LabwareView(subject.state)

    labware_definition = LabwareDefinition3.model_construct(  # type: ignore[call-arg]
        namespace="foo",
        parameters=Parameters3.model_construct(loadName="load_name"),  # type: ignore[call-arg]
        version=123,
        wells={
            "well-1": RectangularWellDefinition3.model_construct(),  # type: ignore[call-arg]
            "well-2": RectangularWellDefinition3.model_construct(),  # type: ignore[call-arg]
        },
    )
    load_labware_update = update_types.LoadedLabwareUpdate(
        labware_id="labware-id",
        new_location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A1),
        offset_id=None,
        display_name="Display Name",
        definition=labware_definition,
    )
    subject.handle_action(
        actions.SucceedCommandAction(
            state_update=update_types.StateUpdate(loaded_labware=load_labware_update),
            command=_dummy_command(),
        )
    )

    subject_view.raise_if_wells_are_invalid("labware-id", [])
    subject_view.raise_if_wells_are_invalid("labware-id", ["well-1"])
    subject_view.raise_if_wells_are_invalid("labware-id", ["well-2"])
    subject_view.raise_if_wells_are_invalid("labware-id", ["well-1", "well-2"])

    with pytest.raises(errors.WellDoesNotExistError):
        subject_view.raise_if_wells_are_invalid("labware-id", ["well-1, well-3"])
    with pytest.raises(errors.WellDoesNotExistError):
        subject_view.raise_if_wells_are_invalid(
            "labware-id", ["well-1, well-2", "well-4"]
        )
    with pytest.raises(errors.WellDoesNotExistError):
        subject_view.raise_if_wells_are_invalid("labware-id", ["well-5"])
