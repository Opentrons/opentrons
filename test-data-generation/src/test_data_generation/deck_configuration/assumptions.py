"""Assumptions about deck configurations."""

import typing
from test_data_generation.deck_configuration.datashapes import (
    DeckConfiguration,
    Row,
    RowWithStagingArea,
)


def _row_has_staging_area(row: "Row") -> typing.TypeGuard[RowWithStagingArea]:
    """Return True if the row has a staging area."""
    return row.col4 is not None


class EvaluationFunction(typing.Protocol):
    """A method that validates a deck configuration."""

    def __call__(self, deck: DeckConfiguration) -> bool:
        """Evaluates the deck configuration and returns True if it is valid."""
        ...


def _no_modules_in_staging_area_col_4(deck: DeckConfiguration) -> bool:
    """Return True if there are no modules in the staging area of col4."""
    return [
        row
        for row in deck.rows
        if _row_has_staging_area(row) and row.col4.is_a_module()
    ] == []


def _no_modules_in_staging_area_col_3(deck: DeckConfiguration) -> bool:
    """Return True if there are no modules in the staging area of col3."""
    return [
        row
        for row in deck.rows
        if _row_has_staging_area(row) and row.col3.is_a_module()
    ] == []


VALID_DECK_CONFIGURATION_EVALUATION_FUNCTIONS: typing.List[EvaluationFunction] = [
    _no_modules_in_staging_area_col_4,
    _no_modules_in_staging_area_col_3,
]
