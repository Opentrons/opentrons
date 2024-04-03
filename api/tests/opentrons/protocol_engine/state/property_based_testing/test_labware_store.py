"""
Property-based tests for the Labware state store.
Not sure if property-based testing should be in separated from normal testing.
But for now, I'll keep it here.
"""
import dataclasses
import pytest

from unittest.mock import Mock
from typing import Dict, List, Tuple
from hypothesis import given, assume, settings, strategies as st

from opentrons.protocol_engine.actions.actions import (
    AddLabwareDefinitionAction,
    SucceedCommandAction,
)
from opentrons.protocol_engine.commands.load_labware import (
    LoadLabware,
    LoadLabwareResult,
)
from opentrons.protocol_engine.state.labware import LabwareStore, LabwareView
from opentrons_shared_data.deck.dev_types import DeckDefinitionV4
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters,
    SAFE_STRING_REGEX,
)


def to_mocked_labware_definition(
    namespace: str, load_name: str, version: int
) -> LabwareDefinition:
    mocked_definition = Mock(spec=LabwareDefinition)
    mocked_definition.parameters = Mock(spec=Parameters)
    mocked_definition.namespace = namespace
    mocked_definition.version = version
    mocked_definition.parameters.loadName = load_name

    return mocked_definition


def to_add_labware_definition_actions(
    definitions: List[LabwareDefinition],
) -> List[AddLabwareDefinitionAction]:
    return [
        AddLabwareDefinitionAction(definition=definition) for definition in definitions
    ]


@st.composite
def generate_load_labware_commands(
    draw: st.DrawFn, definitions: List[LabwareDefinition]
) -> List[SucceedCommandAction]:
    ids = draw(
        st.lists(st.text(), min_size=len(definitions), max_size=len(definitions))
    )
    succeed_command_actions = []
    for id, definition in zip(ids, definitions):
        command = Mock(spec=LoadLabware)
        load_labware_result = Mock(spec=LoadLabwareResult)
        succeed_command_action = Mock(spec=SucceedCommandAction)

        load_labware_result.labwareId = id
        load_labware_result.definition = definition
        load_labware_result.offsetId = None
        command.result = load_labware_result

        succeed_command_action.command = command

        succeed_command_actions.append(succeed_command_action)
    
    return succeed_command_actions


@st.composite
def generate_mocked_labware_definitions(draw) -> List[LabwareDefinition]:
    """Generate a list of Labware Definitions."""
    number_of_labware = draw(st.integers(min_value=1, max_value=10))

    # Generate each labware definition as a tuple of (namespace, load_name, version)
    return draw(
        st.lists(
            st.builds(
                to_mocked_labware_definition,
                namespace=st.from_regex(SAFE_STRING_REGEX, fullmatch=True),
                load_name=st.from_regex(SAFE_STRING_REGEX, fullmatch=True),
                version=st.integers(min_value=1, max_value=10),
            ),
            min_size=number_of_labware,
            max_size=number_of_labware,
            unique_by=lambda x: (
                x.namespace,
                x.parameters.loadName,
            ),  # Ensure namespace and load_name pairs are unique
        )
    )


@given(data=st.data())
@settings(max_examples=100)
def test_handles_add_labware(
    data: st.DataObject,
) -> None:
    """It should add the labware to the state."""
    labware_store = LabwareStore(
        deck_definition=DeckDefinitionV4(), deck_fixed_labware=[]
    )

    labware_definitions = data.draw(generate_mocked_labware_definitions())
    add_labware_definition_actions = to_add_labware_definition_actions(
        labware_definitions
    )
    load_labware_commands = data.draw(generate_load_labware_commands(labware_definitions))

    for action in add_labware_definition_actions:
        labware_store.handle_action(action)

    for action in load_labware_commands:
        labware_store.handle_action(action)

    labware_view = LabwareView(labware_store.state)

    assert len(labware_view.get_loaded_labware_definitions()) == len(labware_definitions)

