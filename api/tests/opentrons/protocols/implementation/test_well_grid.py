import pytest
from opentrons.protocols.implementations.well_grid import WellGrid

NONE: list = []
ONE_VAL = ["A1"]
NORMAL = [
    "A1", "B1", "C1",
    "A2", "B2", "C2",
    "A3", "B3", "C3",
    "A4", "B4", "C4",
  ]
CRAZY_SHAPE = [
    "A1", "B1", "C1",
    "B2", "C2",
    "B3",
    "A4", "C4", "D4",
  ]


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, []],
        [ONE_VAL, ['A']],
        [NORMAL, ['A', 'B', 'C']],
        [CRAZY_SHAPE, ['A', 'B', 'C', 'D']]
    ])
def test_row_headers(names, expected):
    assert WellGrid(names, list(range(len(names)))).row_headers() == expected


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, {}],
        [ONE_VAL, {'A': [0]}],
        [NORMAL, {
            "A": [0, 3, 6, 9],
            "B": [1, 4, 7, 10],
            "C": [2, 5, 8, 11],
        }],
        [CRAZY_SHAPE, {
            "A": [0, 6],
            "B": [1, 3, 5],
            "C": [2, 4, 7],
            "D": [8],
        }]])
def test_rows(names, expected):
    grid = WellGrid(names, list(range(len(names))))
    assert grid.get_rows() == expected


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, []],
        [ONE_VAL, ['1']],
        [NORMAL, ['1', '2', '3', '4']],
        [CRAZY_SHAPE, ['1', '2', '3', '4']]
    ])
def test_column_headers(names, expected):
    grid = WellGrid(names, list(range(len(names))))
    assert grid.column_headers() == expected


@pytest.mark.parametrize(
    argnames=["names", "expected"],
    argvalues=[
        [NONE, {}],
        [ONE_VAL, {'1': [0]}],
        [NORMAL, {
            '1': [0, 1, 2],
            '2': [3, 4, 5],
            '3': [6, 7, 8],
            '4': [9, 10, 11],
        }],
        [CRAZY_SHAPE, {
            '1': [0, 1, 2],
            '2': [3, 4],
            '3': [5],
            '4': [6, 7, 8]
        }]
    ])
def test_columns(names, expected):
    grid = WellGrid(names, list(range(len(names))))
    assert grid.get_columns() == expected


def test_well_pattern():
    assert WellGrid.pattern.match('A1')
    assert WellGrid.pattern.match('A10')
    assert not WellGrid.pattern.match('A0')
