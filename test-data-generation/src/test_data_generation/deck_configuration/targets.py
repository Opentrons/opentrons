"""Functions to target for deck configuration data generation."""

from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
    PossibleSlotContents as PSC,
)

from test_data_generation.deck_configuration.deck_evaluation import (
    INVALID_DECK_CONFIGURATION_CHECKS,
)


def num_non_empty_slots(deck: DeckConfiguration) -> int:
    """Return the number of non-empty slots."""
    return len([True for slot in deck.slots if slot.contents is not PSC.LABWARE_SLOT])


def num_invalid_conditions_met(deck: DeckConfiguration) -> int:
    """Return the number of invalid conditions met."""
    return len([True for check in INVALID_DECK_CONFIGURATION_CHECKS if check(deck)])
