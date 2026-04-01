"""Unit tests for robot_server.deck_configuration.defaults."""

import pytest
from typing_extensions import Final

from opentrons_shared_data import deck

from robot_server.deck_configuration import defaults as subject
from robot_server.deck_configuration import validation, validation_mapping

DECK_DEFINITION_VERSION: Final = 5


@pytest.mark.parametrize(
    "deck_definition_name", deck.list_names(DECK_DEFINITION_VERSION)
)
def test_defaults(deck_definition_name: str) -> None:
    """Make sure there's a valid default for every possible deck definition."""
    deck_definition = deck.load(deck_definition_name, DECK_DEFINITION_VERSION)
    result = subject.for_deck_definition(deck_definition_name)
    assert (
        validation.get_configuration_errors(
            deck_definition, validation_mapping.map_in(result)
        )
        == set()
    )
