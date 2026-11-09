from opentrons.protocol_api import Labware


def test_wells_accessor(
    min_lw: Labware,
) -> None:
    assert min_lw.wells()[0].well_name == "A1"
    assert min_lw.wells()[1].well_name == "A2"


def test_wells_name_accessor(
    min_lw: Labware,
) -> None:
    assert min_lw.wells_by_name()["A1"].well_name == "A1"
    assert min_lw.wells_by_name()["A2"].well_name == "A2"


def test_deprecated_index_accessors(min_lw: Labware) -> None:
    assert min_lw.wells_by_name() == min_lw.wells_by_index()
    assert min_lw.rows_by_name() == min_lw.rows_by_index()
    assert min_lw.columns_by_name() == min_lw.columns_by_index()


def test_dict_accessor(
    min_lw: Labware,
) -> None:
    assert min_lw["A1"].well_name == "A1"
    assert min_lw["A2"].well_name == "A2"


def test_rows_accessor(
    min_lw2: Labware,
) -> None:
    assert min_lw2.rows()[0][0].well_name == "A1"
    assert min_lw2.rows()[1][1].well_name == "B2"


def test_row_name_accessor(
    min_lw2: Labware,
) -> None:
    assert min_lw2.rows_by_name()["A"][0].well_name == "A1"
    assert min_lw2.rows_by_name()["B"][1].well_name == "B2"


def test_cols_accessor(
    min_lw: Labware,
) -> None:
    assert min_lw.columns()[0][0].well_name == "A1"
    assert min_lw.columns()[1][0].well_name == "A2"


def test_col_name_accessor(
    min_lw: Labware,
) -> None:
    assert min_lw.columns_by_name()["1"][0].well_name == "A1"
    assert min_lw.columns_by_name()["2"][0].well_name == "A2"
