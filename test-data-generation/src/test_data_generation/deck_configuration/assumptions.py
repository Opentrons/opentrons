"""Assumptions about deck configurations."""

import typing
from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
)


class EvaluationFunction(typing.Protocol):
    """A method that validates a deck configuration."""

    def __call__(self, deck: DeckConfiguration) -> bool:
        """Evaluates the deck configuration and returns True if it is valid."""
        ...


VALID_DECK_CONFIGURATION_EVALUATION_FUNCTIONS: typing.List[EvaluationFunction] = []
