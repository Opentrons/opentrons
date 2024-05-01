"""Test data generation for deck configuration tests."""
from typing import List
from hypothesis import assume, strategies as st
from test_data_generation.deck_configuration.datashapes import (
    Column,
    DeckConfiguration,
    Row,
    Slot,
    PossibleSlotContents as PSC,
)

from test_data_generation.deck_configuration.deck_evaluation import (
    above_or_below_is_module_or_trash,
)


@st.composite
def a_slot(
    draw: st.DrawFn,
    row: str,
    col: str,
    content_options: List[PSC] = PSC.all(),
) -> Slot:
    """Generate a slot with a random content.

    Any fixture that has it's location implicitly defined is captured here by the
    filtering logic.
    """
    no_thermocycler = [
        content for content in content_options if content is not PSC.THERMOCYCLER_MODULE
    ]
    no_waste_chute_or_staging_area = [
        content
        for content in content_options
        if not content.is_a_waste_chute() and not content.is_a_staging_area()
    ]

    no_waste_chute_or_thermocycler = [
        content for content in no_thermocycler if not content.is_a_waste_chute()
    ]
    no_staging_area_or_waste_chute_or_thermocycler = [
        content
        for content in no_waste_chute_or_thermocycler
        if not content.is_a_staging_area()
    ]

    if col == "1" and (row == "A" or row == "B"):
        return draw(
            st.builds(
                Slot,
                row=st.just(row),
                col=st.just(col),
                contents=st.sampled_from(no_waste_chute_or_staging_area),
            )
        )
    elif col == "3":
        if row == "D":
            return draw(
                st.builds(
                    Slot,
                    row=st.just(row),
                    col=st.just(col),
                    contents=st.sampled_from(no_thermocycler),
                )
            )
        else:
            return draw(
                st.builds(
                    Slot,
                    row=st.just(row),
                    col=st.just(col),
                    contents=st.sampled_from(no_waste_chute_or_thermocycler),
                )
            )
    else:
        return draw(
            st.builds(
                Slot,
                row=st.just(row),
                col=st.just(col),
                contents=st.sampled_from(
                    no_staging_area_or_waste_chute_or_thermocycler
                ),
            )
        )


@st.composite
def a_row(
    draw: st.DrawFn,
    row: str,
    content_options: List[PSC] = PSC.all(),
) -> Row:
    """Generate a row with random slots."""
    return draw(
        st.builds(
            Row,
            row=st.just(row),
            col1=a_slot(row=row, col="1", content_options=content_options),
            col2=a_slot(row=row, col="2", content_options=content_options),
            col3=a_slot(row=row, col="3", content_options=content_options),
        )
    )


@st.composite
def a_column(
    draw: st.DrawFn,
    col: str,
    content_options: List[PSC] = PSC.all(),
) -> Column:
    """Generate a column with random slots."""
    return draw(
        st.builds(
            Column,
            col=st.just(col),
            a=a_slot(row="a", col=col, content_options=content_options),
            b=a_slot(row="b", col=col, content_options=content_options),
            c=a_slot(row="c", col=col, content_options=content_options),
            d=a_slot(row="d", col=col, content_options=content_options),
        )
    )


def _above_or_below_is_module_or_trash(col: Column, hs_slot: Slot) -> bool:
    """Return True if the deck has a module above or below the heater shaker."""
    above = col.slot_above(hs_slot)
    below = col.slot_below(hs_slot)

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
