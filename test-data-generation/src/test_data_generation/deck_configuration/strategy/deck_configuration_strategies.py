"""Test data generation for deck configuration tests."""

import typing

from hypothesis import assume
from hypothesis import strategies as st

from test_data_generation.datashapes import (
    DeckConfiguration,
)
from test_data_generation.datashapes import (
    DeckConfigurationFixtures as DCF,
)
from test_data_generation.deck_configuration.strategy.helper_strategies import (
    a_deck_by_columns,
)

DeckConfigurationStrategy = typing.Callable[..., st.SearchStrategy[DeckConfiguration]]


@st.composite
def a_deck_configuration_with_invalid_fixture_in_col_2(
    draw: st.DrawFn,
) -> DeckConfiguration:
    """Generate a deck with an invalid fixture in column 2."""
    POSSIBLE_FIXTURES = [
        DCF.LABWARE_SLOT,
        DCF.TEMPERATURE_MODULE,
        DCF.HEATER_SHAKER_MODULE,
        DCF.TRASH_BIN,
        DCF.MAGNETIC_BLOCK_MODULE,
    ]
    INVALID_FIXTURES = [
        DCF.HEATER_SHAKER_MODULE,
        DCF.TRASH_BIN,
        DCF.TEMPERATURE_MODULE,
    ]

    deck = draw(a_deck_by_columns(col_2_contents=POSSIBLE_FIXTURES))

    num_invalid_fixtures = len(
        [
            True
            for slot in deck.column_by_number("2").slots
            if slot.contents.is_one_of(INVALID_FIXTURES)
        ]
    )
    assume(num_invalid_fixtures > 0)

    return deck


@st.composite
def a_deck_configuration_with_staging_areas(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a deck with staging areas."""
    deck = draw(a_deck_by_columns())
    assume(deck.number_of(DCF.STAGING_AREA) > 0)
    return deck


@st.composite
def a_deck_with_a_thermocycler(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a deck with a thermocycler."""
    deck = draw(a_deck_by_columns(thermocycler_on_deck=True))

    # Thermoycler spans a1 and b1 so 2 slots
    assume(deck.number_of(DCF.THERMOCYCLER_MODULE) == 2)
    return deck


@st.composite
def a_deck_with_a_waste_chute(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a deck with a waste chute."""
    deck = draw(a_deck_by_columns())
    num_waste_chutes = sum([deck.number_of(content) for content in DCF.waste_chutes()])
    assume(num_waste_chutes == 1)
    return deck


DECK_CONFIGURATION_STRATEGIES: typing.Dict[str, DeckConfigurationStrategy] = {
    f.__name__: f
    for f in [
        a_deck_configuration_with_invalid_fixture_in_col_2,
    ]
}
