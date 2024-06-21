"""Test data generation for deck configuration tests."""

import typing

from hypothesis import strategies as st

from test_data_generation.constants import ColumnName, RowName
from test_data_generation.datashapes import (
    Column,
    DeckConfiguration,
    Row,
    Slot,
)
from test_data_generation.datashapes import (
    DeckConfigurationFixtures as DCF,
)


@st.composite
def a_slot(
    draw: st.DrawFn,
    row: RowName,
    col: ColumnName,
    thermocycler_on_deck: bool,
    content_options: typing.List[DCF] = DCF.all(),
) -> Slot:
    """Generate a slot with a random content.

    Any fixture that has it's location implicitly defined is captured here by the
    filtering logic.
    """
    no_thermocycler = [
        content for content in content_options if content is not DCF.THERMOCYCLER_MODULE
    ]
    no_waste_chute_or_thermocycler = [
        content for content in no_thermocycler if not content.is_a_waste_chute()
    ]
    no_staging_area_or_waste_chute_or_thermocycler = [
        content
        for content in no_waste_chute_or_thermocycler
        if not content.is_a_staging_area()
    ]

    # If the deck is configured a with a thermocycler, we must ensure that no other fixture
    # occupies slot a1 or b1.
    # This is for 2 reasons:
    # 1) The way Deck Configuration works under the hood, is that the thermocycler fixture spans the 2 slots.
    # 2) When go to generate a protocol, we don't want to have to be doing a ton of checks to make sure that
    #   the thermocycler exists, and that there is no other fixture in the same slot. The logic is simpler just to filter
    #   out loading a thermocycler twice.

    in_one_of_the_slots_the_thermocycler_occupies: bool = col == "1" and (
        row == "a" or row == "b"
    )
    if thermocycler_on_deck and in_one_of_the_slots_the_thermocycler_occupies:
        return draw(
            st.builds(
                Slot,
                row=st.just(row),
                col=st.just(col),
                contents=st.just(DCF.THERMOCYCLER_MODULE),
            )
        )
    elif col == "3":
        if row == "d":
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
    row: RowName,
    thermocycler_on_deck: bool,
    content_options: typing.List[DCF] = DCF.all(),
) -> Row:
    """Generate a row with random slots."""
    return draw(
        st.builds(
            Row,
            row=st.just(row),
            col1=a_slot(
                row=row,
                col="1",
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
            col2=a_slot(
                row=row,
                col="2",
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
            col3=a_slot(
                row=row,
                col="3",
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
        )
    )


@st.composite
def a_column(
    draw: st.DrawFn,
    col: ColumnName,
    thermocycler_on_deck: bool,
    content_options: typing.List[DCF] = DCF.all(),
) -> Column:
    """Generate a column with random slots."""
    return draw(
        st.builds(
            Column,
            col=st.just(col),
            a=a_slot(
                row="a",
                col=col,
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
            b=a_slot(
                row="b",
                col=col,
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
            c=a_slot(
                row="c",
                col=col,
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
            d=a_slot(
                row="d",
                col=col,
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=content_options,
            ),
        )
    )


@st.composite
def a_deck_by_columns(
    draw: st.DrawFn,
    thermocycler_on_deck: bool | None = None,
    col_1_contents: typing.List[DCF] = DCF.all(),
    col_2_contents: typing.List[DCF] = DCF.all(),
    col_3_contents: typing.List[DCF] = DCF.all(),
) -> DeckConfiguration:
    """Generate a deck by columns."""
    # Let the thermocycler existence be another generated value if
    # not specified.
    if thermocycler_on_deck is None:
        thermocycler_on_deck = draw(st.booleans())

    return draw(
        st.builds(
            DeckConfiguration.from_cols,
            a_column(
                "1",
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=col_1_contents,
            ),
            a_column(
                "2",
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=col_2_contents,
            ),
            a_column(
                "3",
                thermocycler_on_deck=thermocycler_on_deck,
                content_options=col_3_contents,
            ),
        )
    )
