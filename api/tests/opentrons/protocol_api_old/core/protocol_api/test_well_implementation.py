import pytest

from opentrons.protocol_api.core.protocol_api.well import WellImplementation


@pytest.mark.parametrize(
    argnames=["name", "row", "col"],
    argvalues=[
        ["A1", "A", "1"],
        ["A10", "A", "10"],
        ["Z100", "Z", "100"],
        ["A0", "A", "0"],
        ["B0100", "B", "0100"],
    ],
)
def test_row_column(name, row, col):
    w = WellImplementation(
        well_geometry=None,  # type: ignore[arg-type]
        display_name=None,  # type: ignore[arg-type]
        has_tip=None,  # type: ignore[arg-type]
        name=name,
    )
    assert w.get_name() == name
    assert w.get_row_name() == row
    assert w.get_column_name() == col


@pytest.mark.parametrize(
    argnames=["name"],
    argvalues=[
        ["a1"],
        ["Aa1"],
        ["A 1"],
    ],
)
def test_row_column_fail(name):
    with pytest.raises(AssertionError, match=f"could not match '{name}'"):
        WellImplementation(
            well_geometry=None,  # type: ignore[arg-type]
            display_name=None,  # type: ignore[arg-type]
            has_tip=None,  # type: ignore[arg-type]
            name=name,
        )
