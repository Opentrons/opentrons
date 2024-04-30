"""Test data generation for deck configuration tests."""
from hypothesis import strategies as st, target
from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
    Row,
    Slot,
    PossibleSlotContents as PSC,
)
from test_data_generation.deck_configuration.targets import (
    num_invalid_conditions_met,
    num_non_empty_slots,
)


@st.composite
def a_slot(draw: st.DrawFn, row: str, col: str) -> Slot:
    """Generate a slot with a random content.

    Any fixture that has it's location implicitly defined is captured here by the
    filtering logic.
    """
    no_thermocycler = [
        content for content in PSC if content is not PSC.THERMOCYCLER_MODULE
    ]
    no_waste_chute_or_thermocycler = [
        content for content in no_thermocycler if not content.is_a_waste_chute()
    ]
    no_staging_area_or_waste_chute_or_thermocycler = [
        content
        for content in no_waste_chute_or_thermocycler
        if not content.is_a_staging_area()
    ]

    no_waste_chute_or_staging_area = [
        content
        for content in PSC
        if not content.is_a_waste_chute() and not content.is_a_staging_area()
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
def a_row(draw: st.DrawFn, row: str) -> Row:
    """Generate a row with random slots."""
    return draw(
        st.builds(
            Row,
            row=st.just(row),
            col1=a_slot(row=row, col="1"),
            col2=a_slot(row=row, col="2"),
            col3=a_slot(row=row, col="3"),
        )
    )


@st.composite
def a_deck_configuration(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a deck with random rows."""
    row_a_contents = draw(a_row("A"))
    row_b_contents = draw(a_row("B"))

    deck = draw(
        st.builds(
            DeckConfiguration,
            a=st.just(row_a_contents),
            b=st.just(row_b_contents),
            c=a_row("C"),
            d=a_row("D"),
        )
    )
    # https://hypothesis.readthedocs.io/en/latest/details.html#targeted-example-generation
    target(
        observation=num_non_empty_slots(deck),
        label="Maximize number of slots not empty.",
    )
    return deck


@st.composite
def an_invalid_deck(draw: st.DrawFn) -> DeckConfiguration:
    """Generate an invalid deck."""
    deck = draw(a_deck_configuration())

    target(
        observation=num_invalid_conditions_met(deck),
        label="Maximize number of invalid conditions met.",
    )

    return deck
