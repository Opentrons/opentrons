"""Functions for evaluating deck configurations for validity."""

import typing

from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
    PossibleSlotContents as PSC,
)


class EvaluationFunction(typing.Protocol):
    """A method that evaluates a deck configuration for validity."""

    def __call__(self, deck: DeckConfiguration) -> bool:
        """Evaluates the deck configuration and returns a boolean."""
        ...


INVALID_DECK_CONFIGURATION_CHECKS: typing.List[EvaluationFunction] = []


def mark_invalid(func: EvaluationFunction) -> EvaluationFunction:
    """Mark a function as an invalid deck configuration check."""
    INVALID_DECK_CONFIGURATION_CHECKS.append(func)
    return func


@mark_invalid
def has_invalid_fixture_in_slot_2(deck: DeckConfiguration) -> bool:
    """Return True if the deck has an invalid fixture in slot 2."""
    valid_fixtures = [PSC.LABWARE_SLOT, PSC.MAGNETIC_BLOCK_MODULE]
    for slot in deck.slots:
        if slot.col == "2" and slot.contents not in valid_fixtures:
            return True
    return False


@mark_invalid
def has_module_above_or_below_heater_shaker(deck: DeckConfiguration) -> bool:
    """Return True if the deck has a module above or below the heater shaker."""
    for slot in deck.slots:
        if slot.contents == PSC.HEATER_SHAKER_MODULE:
            above = deck.slot_above(slot)
            below = deck.slot_below(slot)
            if above is not None and above.contents.is_a_module():
                return True
            if below is not None and below.contents.is_a_module():
                return True
    return False
