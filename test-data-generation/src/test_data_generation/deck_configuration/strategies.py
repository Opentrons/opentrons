"""Test data generation for deck configuration tests."""
from hypothesis import strategies as st, assume
from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
    Row,
    SlotContents,
)
from test_data_generation.deck_configuration.assumptions import (
    VALID_DECK_CONFIGURATION_EVALUATION_FUNCTIONS,
)


@st.composite
def a_slot(draw: st.DrawFn) -> SlotContents:
    """Generate a slot with a random content."""
    return draw(st.sampled_from(SlotContents))  # type: ignore


@st.composite
def a_row(draw: st.DrawFn) -> Row:
    """Generate a row with random slots."""
    return draw(
        st.builds(
            Row,
            col1=a_slot(),
            col2=a_slot(),
            col3=a_slot(),
            col4=st.one_of(st.just(None), a_slot()),
        )
    )


@st.composite
def a_deck_configuration(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a deck with random rows."""
    return draw(
        st.builds(
            DeckConfiguration,
            A=a_row(),
            B=a_row(),
            C=a_row(),
            D=a_row(),
        )
    )


@st.composite
def a_valid_deck(draw: st.DrawFn) -> DeckConfiguration:
    """Generate a valid deck."""
    deck = draw(a_deck_configuration())

    for evaluation_function in VALID_DECK_CONFIGURATION_EVALUATION_FUNCTIONS:
        assume(evaluation_function(deck))

    return deck


@st.composite
def an_invalid_deck(draw: st.DrawFn) -> DeckConfiguration:
    """Generate an invalid deck."""
    deck = draw(a_deck_configuration())

    for evaluation_function in VALID_DECK_CONFIGURATION_EVALUATION_FUNCTIONS:
        assume(not evaluation_function(deck))

    return deck