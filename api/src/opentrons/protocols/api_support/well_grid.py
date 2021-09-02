from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Sequence
from opentrons.protocols.context.well import WellImplementation


Wells = Sequence[WellImplementation]
HeaderToWells = Dict[str, Wells]
WellsByDimension = Sequence[Wells]


@dataclass
class Grid:
    rows: HeaderToWells
    columns: HeaderToWells


class WellGrid:
    """A helper class to extract Wells by row or column"""

    def __init__(self, wells: Wells):
        """
        Construct well grid from a collection of well objects ordered as they
         appear in ordering` field of Labware Defnition
        """
        self._grid = self._create_row_column(wells)
        self._row_headers = sorted(self._grid.rows.keys())
        self._column_headers = sorted(self._grid.columns.keys(), key=lambda k: int(k))
        self._rows = [self._grid.rows[h] for h in self._row_headers]
        self._columns = [self._grid.columns[h] for h in self._column_headers]

    def row_headers(self) -> Sequence[str]:
        """List of row header names"""
        return self._row_headers

    def column_headers(self) -> Sequence[str]:
        """List of column header names"""
        return self._column_headers

    def get_row_dict(self) -> HeaderToWells:
        """A mapping of row header to a list"""
        return self._grid.rows

    def get_column_dict(self) -> HeaderToWells:
        """A mapping of column header to a list"""
        return self._grid.columns

    def get_rows(self) -> WellsByDimension:
        """Get all rows as list of lists"""
        return self._rows

    def get_columns(self) -> WellsByDimension:
        """Get all columns as list of lists"""
        return self._columns

    def get_row(self, row: str) -> Wells:
        """Get an individual row"""
        return self._grid.rows.get(row, [])

    def get_column(self, column: str) -> Wells:
        """Get an individual column"""
        return self._grid.columns.get(column, [])

    @staticmethod
    def _create_row_column(wells: Wells) -> Grid:
        """
        Creates a dict of lists of Wells. Which way the labware is segmented
        determines whether this is a dict of rows or dict of columns. If group
        is 1, then it will collect wells that have the same alphabetic prefix
        and therefore are considered to be in the same row. If group is 2, it
        will collect wells that have the same numeric postfix and therefore
        are considered to be in the same column.
        """
        columns = defaultdict(list)
        rows = defaultdict(list)
        for well in wells:
            rows[well.get_row_name()].append(well)
            columns[well.get_column_name()].append(well)
        # copy to a non-default-dict
        return Grid(columns=dict(columns), rows=dict(rows))
