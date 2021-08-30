from typing import List

import pytest
from opentrons.protocols.api_support.well_grid import WellGrid
from opentrons.protocols.context.well import WellImplementation

NONE: list = []
ONE_VAL = ["A1"]
NORMAL = [
    "A1",
    "B1",
    "C1",
    "A2",
    "B2",
    "C2",
    "A3",
    "B3",
    "C3",
    "A4",
    "B4",
    "C4",
]
CRAZY_SHAPE = [
    "A1",
    "B1",
    "C1",
    "B2",
    "C2",
    "B3",
    "A4",
    "C4",
    "D4",
]
TWELVE_BY_TWELVE_GRID = [
    [f"{c}{r}" for c in [chr(65 + i) for i in range(12)]] for r in range(1, 13)
]
# Flatten to a list of well names
TWELVE_BY_TWELVE = [n for x in TWELVE_BY_TWELVE_GRID for n in x]


def wells_from_names(names: List[str]) -> List[WellImplementation]:
    return [
        WellImplementation(
            well_geometry=None, display_name=None, has_tip=None, name=name
        )
        for name in names
    ]


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, []],
        [ONE_VAL, ["A"]],
        [NORMAL, ["A", "B", "C"]],
        [CRAZY_SHAPE, ["A", "B", "C", "D"]],
        [
            TWELVE_BY_TWELVE,
            ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
        ],
    ],
)
def test_row_headers(names, expected):
    assert WellGrid(wells_from_names(names)).row_headers() == expected


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, {}],
        [ONE_VAL, {"A": [0]}],
        [
            NORMAL,
            {
                "A": [0, 3, 6, 9],
                "B": [1, 4, 7, 10],
                "C": [2, 5, 8, 11],
            },
        ],
        [CRAZY_SHAPE, {"A": [0, 6], "B": [1, 3, 5], "C": [2, 4, 7], "D": [8]}],
    ],
)
def test_row_dict(names, expected):
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.get_row_dict() == {
        k: [wells[i] for i in v] for k, v in expected.items()
    }


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, []],
        [ONE_VAL, [[0]]],
        [
            NORMAL,
            [
                [0, 3, 6, 9],
                [1, 4, 7, 10],
                [2, 5, 8, 11],
            ],
        ],
        [
            CRAZY_SHAPE,
            [
                [0, 6],
                [1, 3, 5],
                [2, 4, 7],
                [8],
            ],
        ],
    ],
)
def test_rows(names, expected):
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.get_rows() == [[wells[i] for i in r] for r in expected]


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, []],
        [ONE_VAL, ["1"]],
        [NORMAL, ["1", "2", "3", "4"]],
        [CRAZY_SHAPE, ["1", "2", "3", "4"]],
        [
            TWELVE_BY_TWELVE,
            ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
        ],
    ],
)
def test_column_headers(names, expected):
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.column_headers() == expected


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, {}],
        [ONE_VAL, {"1": [0]}],
        [
            NORMAL,
            {
                "1": [0, 1, 2],
                "2": [3, 4, 5],
                "3": [6, 7, 8],
                "4": [9, 10, 11],
            },
        ],
        [CRAZY_SHAPE, {"1": [0, 1, 2], "2": [3, 4], "3": [5], "4": [6, 7, 8]}],
    ],
)
def test_column_dict(names, expected):
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.get_column_dict() == {
        k: [wells[i] for i in v] for k, v in expected.items()
    }


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, []],
        [ONE_VAL, [[0]]],
        [
            NORMAL,
            [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8],
                [9, 10, 11],
            ],
        ],
        [CRAZY_SHAPE, [[0, 1, 2], [3, 4], [5], [6, 7, 8]]],
    ],
)
def test_columns(names, expected):
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.get_columns() == [[wells[i] for i in r] for r in expected]


@pytest.mark.parametrize(
    argnames=["column", "expected"], argvalues=[["2", [3, 4, 5]], ["1000", []]]
)
def test_column(column, expected):
    names = NORMAL
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.get_column(column) == [wells[i] for i in expected]


@pytest.mark.parametrize(
    argnames=["row", "expected"], argvalues=[["B", [1, 4, 7, 10]], ["X", []]]
)
def test_row(row, expected):
    names = NORMAL
    wells = wells_from_names(names)
    grid = WellGrid(wells)
    assert grid.get_row(row) == [wells[i] for i in expected]
