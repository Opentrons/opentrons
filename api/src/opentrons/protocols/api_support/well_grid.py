import re
from collections import defaultdict
from typing import List, Dict, NamedTuple


HeaderToIndexes = Dict[str, List[int]]


class Grid(NamedTuple):
    rows: HeaderToIndexes
    columns: HeaderToIndexes


class WellGrid:
    """A helper class to access extract row and column information from
    well names"""

    pattern = re.compile(r'^([A-Z]+)([1-9][0-9]*)$', re.X)

    def __init__(self, well_names: List[List[str]]):
        """
        Construct well grid from a list of lists of names as appear in
        `ordering` field of Labware Defnition

        :param well_names: a list of lists of well names ("A1, "B3", etc..)
        """
        # Flatten the list of lists
        self._ordering = [well for col in well_names for well in col]
        self._grid = self._create_row_column(self._ordering)
        self._row_headers = sorted(self._grid.rows.keys())
        self._column_headers = sorted(self._grid.columns.keys())

    def ordered_names(self) -> List[str]:
        """The flattened names of the wells in order"""
        return self._ordering

    def row_headers(self) -> List[str]:
        """List of row header names"""
        return self._row_headers

    def column_headers(self) -> List[str]:
        """List of column header names"""
        return self._column_headers

    def get_rows(self) -> HeaderToIndexes:
        """A mapping of row header to a list of indexes"""
        return self._grid.rows

    def get_columns(self) -> HeaderToIndexes:
        """A mapping of column header to a list of indexes"""
        return self._grid.columns

    @staticmethod
    def _create_row_column(well_names: List[str]) -> Grid:
        """
        Creates a dict of lists of Wells. Which way the labware is segmented
        determines whether this is a dict of rows or dict of columns. If group
        is 1, then it will collect wells that have the same alphabetic prefix
        and therefore are considered to be in the same row. If group is 2, it
        will collect wells that have the same numeric postfix and therefore
        are considered to be in the same column.
        """
        columns: Dict[str, List[int]] = defaultdict(list)
        rows: Dict[str, List[int]] = defaultdict(list)
        for index, well_name in enumerate(well_names):
            match = WellGrid.pattern.match(well_name)
            assert match, 'could not match well name pattern'
            rows[match.group(1)].append(index)
            columns[match.group(2)].append(index)
        # copy to a non-default-dict
        return Grid(columns=dict(columns), rows=dict(rows))
