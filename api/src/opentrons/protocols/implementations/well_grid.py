import re
from collections import defaultdict
from typing import List, Dict, NamedTuple, Generic, TypeVar, Sequence

T = TypeVar('T')

HeaderToIndexes = Dict[str, List[T]]


class Grid(NamedTuple):
    rows: HeaderToIndexes
    columns: HeaderToIndexes


class WellGrid(Generic[T]):
    """A helper class to access extract row and column information from
    well names"""

    pattern = re.compile(r'^([A-Z]+)([1-9][0-9]*)$', re.X)

    def __init__(self, well_names: Sequence[str], well_objects: Sequence[T]):
        """
        Construct well grid from a list of lists of names as appear in
        `ordering` field of Labware Defnition

        :param well_names: a list well names ("A1, "B3", etc..)
        :param well_objects: a list of objects matching well_names
        """
        self._grid = self._create_row_column(well_names, well_objects)
        self._row_headers = sorted(self._grid.rows.keys())
        self._column_headers = sorted(self._grid.columns.keys())

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
        columns: Dict[str, List[T]] = defaultdict(list)
        rows: Dict[str, List[T]] = defaultdict(list)
        for index, well in enumerate(wells):
            well_name, well_object = well
            match = WellGrid.pattern.match(well_name)
            assert match, 'could not match well name pattern'
            rows[match.group(1)].append(well_object)
            columns[match.group(2)].append(well_object)
        # copy to a non-default-dict
        return Grid(columns=dict(columns), rows=dict(rows))
