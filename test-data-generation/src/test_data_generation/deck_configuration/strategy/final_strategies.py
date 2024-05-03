"""Test data generation for deck configuration tests."""
from hypothesis import assume, strategies as st
from test_data_generation.deck_configuration.datashapes import (
    Column,
    DeckConfiguration,
    Slot,
    PossibleSlotContents as PSC,
)

from test_data_generation.deck_configuration.strategy.helper_strategies import a_column


def _above_or_below_is_module_or_trash(col: Column, slot: Slot) -> bool:
    """Return True if the deck has a module above or below the specified slot."""
    above = col.slot_above(slot)
    below = col.slot_below(slot)

    return (above is not None and above.contents.is_module_or_trash_bin()) or (
        below is not None and below.contents.is_module_or_trash_bin()
    )


@st.composite
def a_deck_configuration_with_a_module_or_trash_slot_above_or_below_a_heater_shaker(
    draw: st.DrawFn,
) -> DeckConfiguration:
    """Generate a deck with a module or trash bin fixture above or below a heater shaker."""
    deck = draw(
        st.builds(
            DeckConfiguration.from_cols,
            col1=a_column("1"),
            col2=a_column(
                "2", content_options=[PSC.LABWARE_SLOT, PSC.MAGNETIC_BLOCK_MODULE]
            ),
            col3=a_column("3"),
        )
    )
    column = deck.column_by_number(draw(st.sampled_from(["1", "3"])))

    assume(column.number_of(PSC.HEATER_SHAKER_MODULE) in [1, 2])
    for slot in column.slots:
        if slot.contents is PSC.HEATER_SHAKER_MODULE:
            assume(_above_or_below_is_module_or_trash(column, slot))
    deck.override_with_column(column)

    return deck


@st.composite
def a_deck_configuration_with_invalid_fixture_in_col_2(
    draw: st.DrawFn,
) -> DeckConfiguration:
    """Generate a deck with an invalid fixture in column 2."""
    POSSIBLE_FIXTURES = [
        PSC.LABWARE_SLOT,
        PSC.TEMPERATURE_MODULE,
        PSC.HEATER_SHAKER_MODULE,
        PSC.TRASH_BIN,
        PSC.MAGNETIC_BLOCK_MODULE,
    ]
    INVALID_FIXTURES = [
        PSC.HEATER_SHAKER_MODULE,
        PSC.TRASH_BIN,
        PSC.TEMPERATURE_MODULE,
    ]
    column2 = draw(a_column("2", content_options=POSSIBLE_FIXTURES))
    num_invalid_fixtures = len(
        [True for slot in column2.slots if slot.contents.is_one_of(INVALID_FIXTURES)]
    )
    assume(num_invalid_fixtures > 0)

    deck = draw(
        st.builds(
            DeckConfiguration.from_cols,
            col1=a_column("1"),
            col2=st.just(column2),
            col3=a_column("3"),
        )
    )

    return deck
