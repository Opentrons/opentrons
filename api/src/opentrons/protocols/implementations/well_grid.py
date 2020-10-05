import re
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Dict, Generic, TypeVar, Sequence

from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN

T = TypeVar('T')

HeaderToList = Dict[str, List[T]]


@dataclass
class Grid:
    rows: HeaderToList
    columns: HeaderToList


class WellGrid(Generic[T]):
    """A helper class to access extract row and column information from
    well names"""

    pattern = re.compile(WELL_NAME_PATTERN, re.X)

    def __init__(self, well_names: Sequence[str], well_objects: Sequence[T]):
        """
        Construct well grid from a list of lists of names as appear in
        `ordering` field of Labware Defnition

        :param well_names: a list well names ("A1, "B3", etc..)
        :param well_objects: a list of objects matching well_names
        """
        self._grid = self._create_row_column(well_names, well_objects)
        self._row_headers = sorted(self._grid.rows.keys())
        self._column_headers = sorted(self._grid.columns.keys(),
                                      key=lambda k: int(k))
        self._rows = [self._grid.rows[h] for h in self._row_headers]
        self._columns = [self._grid.columns[h] for h in self._column_headers]

    def row_headers(self) -> List[str]:
        """List of row header names"""
        return self._row_headers

    def column_headers(self) -> List[str]:
        """List of column header names"""
        return self._column_headers

    def get_row_dict(self) -> HeaderToList:
        """A mapping of row header to a list"""
        return self._grid.rows

    def get_column_dict(self) -> HeaderToList:
        """A mapping of column header to a list"""
        return self._grid.columns

    def get_rows(self) -> List[List[T]]:
        """Get all rows as list of lists"""
        return self._rows

    def get_columns(self) -> List[List[T]]:
        """Get all columns as list of lists"""
        return self._columns

    def get_row(self, row: str) -> List[T]:
        """Get an individual row"""
        return self._grid.rows.get(row, [])

    def get_column(self, column: str) -> List[T]:
        """Get an individual column"""
        return self._grid.columns.get(column, [])

    @staticmethod
    def _create_row_column(well_names: Sequence[str],
                           well_objects: Sequence[T]) -> Grid:
        """
        Creates a dict of lists of Wells. Which way the labware is segmented
        determines whether this is a dict of rows or dict of columns. If group
        is 1, then it will collect wells that have the same alphabetic prefix
        and therefore are considered to be in the same row. If group is 2, it
        will collect wells that have the same numeric postfix and therefore
        are considered to be in the same column.
        """
        wells = zip(well_names, well_objects)
        columns: HeaderToList = defaultdict(list)
        rows: HeaderToList = defaultdict(list)
        for index, well in enumerate(wells):
            well_name, well_object = well
            match = WellGrid.pattern.match(well_name)
            assert match, f"could not match '{well_name}' using " \
                          f"pattern '{WellGrid.pattern.pattern}'"
            rows[match.group(1)].append(well_object)
            columns[match.group(2)].append(well_object)
        # copy to a non-default-dict
        return Grid(columns=dict(columns), rows=dict(rows))
