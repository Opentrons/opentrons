import pytest

from opentrons.protocol_api.core.legacy.legacy_well_core import LegacyWellCore


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
def test_row_column(name: str, row: str, col: str) -> None:
    w = LegacyWellCore(
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
def test_row_column_fail(name: str) -> None:
    with pytest.raises(AssertionError, match=f"could not match '{name}'"):
        LegacyWellCore(
            well_geometry=None,  # type: ignore[arg-type]
            display_name=None,  # type: ignore[arg-type]
            has_tip=None,  # type: ignore[arg-type]
            name=name,
        )
