"""Tests for the WellGrid class."""

from opentrons.protocol_api.core import well_grid as subject


def test_empty_well_grid() -> None:
    """It have empty rows and colums."""
    result = subject.create(columns=[])

    assert result.columns_by_name == {}
    assert result.rows_by_name == {}


def test_well_rows() -> None:
    """It should transpose columns to rows."""
    result = subject.create(
        columns=[
            ["A1", "B1"],
            ["A2", "B2"],
        ]
    )

    assert result.columns_by_name == {
        "1": ["A1", "B1"],
        "2": ["A2", "B2"],
    }

    assert result.rows_by_name == {
        "A": ["A1", "A2"],
        "B": ["B1", "B2"],
    }


def test_well_rows_asymmetric() -> None:
    """It should transpose columns to rows when rows are asymmetrical."""
    result = subject.create(
        columns=[
            ["A1", "B1", "C1"],
            ["A2", "B2", "C2"],
            ["A3", "B3"],
            ["A4", "B4"],
        ]
    )

    assert result.columns_by_name == {
        "1": ["A1", "B1", "C1"],
        "2": ["A2", "B2", "C2"],
        "3": ["A3", "B3"],
        "4": ["A4", "B4"],
    }

    assert result.rows_by_name == {
        "A": ["A1", "A2", "A3", "A4"],
        "B": ["B1", "B2", "B3", "B4"],
        "C": ["C1", "C2"],
    }


def test_well_rows_asymmetric_bottom_aligned() -> None:
    """It should transpose columns to rows when asymmetric rows are bottom aligned."""
    result = subject.create(
        columns=[
            ["A1", "B1", "C1"],
            ["A2", "B2", "C2"],
            ["B3", "C3"],
            ["B4", "C4"],
        ]
    )

    assert result.columns_by_name == {
        "1": ["A1", "B1", "C1"],
        "2": ["A2", "B2", "C2"],
        "3": ["B3", "C3"],
        "4": ["B4", "C4"],
    }

    assert result.rows_by_name == {
        "A": ["A1", "A2"],
        "B": ["B1", "B2", "B3", "B4"],
        "C": ["C1", "C2", "C3", "C4"],
    }
