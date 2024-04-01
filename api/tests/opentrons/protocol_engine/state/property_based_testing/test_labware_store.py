"""
Property-based tests for the Labware state store.
Not sure if property-based testing should be in separated from normal testing.
But for now, I'll keep it here.
"""
import pytest

from unittest.mock import Mock
from typing import Dict, List, Tuple
from hypothesis import given, assume, settings, strategies as st

from opentrons.protocol_engine.actions.actions import AddLabwareDefinitionAction
from opentrons.protocol_engine.state.labware import LabwareStore, LabwareView
from opentrons_shared_data.deck.dev_types import DeckDefinitionV4
from opentrons_shared_data.labware.labware_definition import (
    LabwareDefinition,
    Parameters,
    SAFE_STRING_REGEX,
)


@st.composite
def generate_labware_definition_data(draw: st.DrawFn) -> List[Tuple[str, str, int]]:
    """Generate a list of Labware Definitions."""
    number_of_labware = draw(st.integers(min_value=1, max_value=10))
    namespaces = draw(
        st.sets(
            st.from_regex(SAFE_STRING_REGEX, fullmatch=True),
            min_size=number_of_labware,
            max_size=number_of_labware,
        )
    )
    load_names = draw(
        st.sets(
            st.from_regex(SAFE_STRING_REGEX, fullmatch=True),
            min_size=number_of_labware,
            max_size=number_of_labware,
        )
    )
    assume(namespaces.isdisjoint(load_names))

    versions = draw(
        st.lists(
            st.integers(min_value=1, max_value=10),
            min_size=number_of_labware,
            max_size=number_of_labware,
        )
    )

    namespaces = list(namespaces)
    load_names = list(load_names)

    return [
        (namespaces.pop(0), load_names.pop(0), versions.pop(0))
        for _ in range(number_of_labware)
    ]


def mock_labware_defs(
    labware_defs: List[Tuple[str, str, int]]
) -> List[AddLabwareDefinitionAction]:
    """Generate a list of AddLabwareDefinitionAction with mock labware definitions."""
    mocked_labware_defs = []
    for namespace, load_name, version in labware_defs:
        # Create a mock LabwareDefinition object
        mocked_definition = Mock(spec=LabwareDefinition)
        mocked_definition.parameters = Mock(spec=Parameters)
        mocked_definition.namespace = namespace
        mocked_definition.version = version
        mocked_definition.parameters.loadName = load_name

        mocked_labware_defs.append(
            AddLabwareDefinitionAction(definition=mocked_definition)
        )

    return mocked_labware_defs


@given(labware_definition_data=generate_labware_definition_data())
@settings(max_examples=1000)
def test_handles_add_labware(
    labware_definition_data,
) -> None:
    """It should add the labware to the state."""
    labware_store = LabwareStore(
        deck_definition=DeckDefinitionV4(), deck_fixed_labware=[]
    )
    add_labware_def_actions = mock_labware_defs(labware_definition_data)
    for action in add_labware_def_actions:
        labware_store.handle_action(action)
