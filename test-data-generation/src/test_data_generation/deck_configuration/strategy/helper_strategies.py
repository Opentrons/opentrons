"""Test data generation for deck configuration tests."""
from typing import List
from hypothesis import strategies as st
from test_data_generation.deck_configuration.datashapes import (
    Column,
    Row,
    Slot,
    PossibleSlotContents as PSC,
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
