from typing import Dict, List, Optional, Any, Sequence, Iterator, Tuple, cast
from dataclasses import dataclass
from collections import OrderedDict
from enum import Enum

from opentrons.hardware_control.types import CriticalPoint
from opentrons.types import Point
from opentrons_shared_data.pipette.pipette_definition import (
    PipetteGeometryDefinition,
    PipetteRowDefinition,
)
from opentrons_shared_data.errors import ErrorCodes, GeneralError, PythonException


def _nozzle_names_by_row(rows: List[PipetteRowDefinition]) -> Iterator[str]:
    for row in rows:
        for nozzle in row.ordered_nozzles:
            yield nozzle


def _row_or_col_for_nozzle(
    row_or_col: "OrderedDict[str, List[str]]", nozzle: str
) -> str:
    for row_or_col_name, row_or_col_contents in row_or_col.items():
        if nozzle in row_or_col_contents:
            return row_or_col_name
    raise KeyError(nozzle)


def _row_col_for_nozzle(
    rows: "OrderedDict[str, List[str]]",
    cols: "OrderedDict[str, List[str]]",
    nozzle: str,
) -> Tuple[str, str]:
    return _row_or_col_for_nozzle(rows, nozzle), _row_or_col_for_nozzle(cols, nozzle)


class NozzleConfigurationType(Enum):
    """
    Nozzle Configuration Type.

    Represents the current nozzle
    configuration stored in NozzleMap
    """

    COLUMN = "COLUMN"
    ROW = "ROW"
    QUADRANT = "QUADRANT"
    SINGLE = "SINGLE"
    FULL = "FULL"
    SUBRECT = "SUBRECT"

    @classmethod
    def determine_nozzle_configuration(
        cls,
        physical_rows: "OrderedDict[str, List[str]]",
        current_rows: "OrderedDict[str, List[str]]",
        physical_cols: "OrderedDict[str, List[str]]",
        current_cols: "OrderedDict[str, List[str]]",
    ) -> "NozzleConfigurationType":
        """
        Determine the nozzle configuration based on the starting and
        ending nozzle.
        """
        if physical_rows == current_rows and physical_cols == current_cols:
            return NozzleConfigurationType.FULL
        if len(current_rows) == 1 and len(current_cols) == 1:
            return NozzleConfigurationType.SINGLE
        if len(current_rows) == 1:
            return NozzleConfigurationType.ROW
        if len(current_cols) == 1:
            return NozzleConfigurationType.COLUMN
        physical_corner_nozzles = set(
            (
                next(iter(physical_cols.values()))[0],
                next(reversed(list(physical_cols.values())))[0],
                next(reversed(list(physical_cols.values())))[-1],
                next(iter(physical_cols.values()))[-1],
            )
        )
        current_corner_nozzles = set(
            (
                next(iter(current_cols.values()))[0],
                next(reversed(list(current_cols.values())))[0],
                next(reversed(list(current_cols.values())))[-1],
                next(iter(current_cols.values()))[-1],
            )
        )
        common_corners = physical_corner_nozzles.intersection(current_corner_nozzles)
        if len(common_corners) == 1:
            if len(current_rows) == len(physical_rows) // 2:
                if len(current_cols) == len(physical_cols) // 2:
                    return NozzleConfigurationType.QUADRANT

        return NozzleConfigurationType.SUBRECT


@dataclass
class NozzleMap:
    """
    Nozzle Map.

    A data store class that can build and store nozzle configurations based on the physical default
    nozzle map of the pipette and the requested starting/ending tips.
    """

    starting_nozzle: str
    # these are really ordered dicts but you can't say that even in quotes because pydantic needs to
    # evaluate them to generate serdes code so please only use ordered dicts here
    map_store: Dict[str, Point]
    rows: Dict[str, List[str]]
    columns: Dict[str, List[str]]
    configuration: NozzleConfigurationType

    def __str__(self) -> str:
        return f"back_left_nozzle: {self.back_left} front_right_nozzle: {self.front_right} configuration: {self.configuration}"

    @property
    def back_left(self) -> str:
        return next(iter(self.rows.values()))[0]

    @property
    def front_right(self) -> str:
        return next(reversed(list(self.rows.values())))[-1]

    @property
    def starting_nozzle_offset(self) -> Point:
        return self.map_store[self.starting_nozzle]

    @property
    def xy_center_offset(self) -> Point:
        difference = self.map_store[self.front_right] - self.map_store[self.back_left]
        return self.map_store[self.back_left] + Point(
            difference[0] / 2, difference[1] / 2, 0
        )

    @property
    def front_nozzle_offset(self) -> Point:
        # front left-most nozzle of the 96 channel in a given configuration
        # and front nozzle of the 8 channel
        front_left = next(iter(self.columns.values()))[-1]
        return self.map_store[front_left]

    @property
    def tip_count(self) -> int:
        return len(self.map_store)

    @classmethod
    def build(
        cls,
        physical_nozzles: "OrderedDict[str, Point]",
        physical_rows: "OrderedDict[str, List[str]]",
        physical_columns: "OrderedDict[str, List[str]]",
        starting_nozzle: str,
        back_left_nozzle: str,
        front_right_nozzle: str,
    ) -> "NozzleMap":

        try:
            back_left_row, back_left_column = _row_col_for_nozzle(
                physical_rows, physical_columns, back_left_nozzle
            )
        except KeyError as e:
            raise IncompatibleNozzleConfiguration(
                message=f"No entry for back left nozzle {e} in pipette",
                wrapping=[PythonException(e)],
            ) from e
        try:
            front_right_row, front_right_column = _row_col_for_nozzle(
                physical_rows, physical_columns, front_right_nozzle
            )
        except KeyError as e:
            raise IncompatibleNozzleConfiguration(
                message=f"No entry for front right nozzle {e} in pipette",
                wrapping=[PythonException(e)],
            ) from e

        def _rows_in_map() -> Iterator[Tuple[str, List[str]]]:
            rows_iter = iter(
                physical_rows.items()
            )  # Iterator(("A", ["A1", "A2"...]), ("B": ["B1", "B2"...]))
            this_row = next(rows_iter)  # ("A", ["A1", "A2",...])
            while this_row[0] != back_left_row:  # "A" to "A"
                this_row = next(rows_iter)  # yielding ("A", ["A1", "A2",...])
            yield this_row
            while this_row[0] != front_right_row:
                this_row = next(rows_iter)
                yield this_row

        def _cols_in_row_in_map(
            row_name: str, row_contents: List[str]
        ) -> Iterator[str]:
            col_iter = iter(physical_columns.items())
            row_contents_iter = iter(row_contents)
            this_col = next(col_iter)
            this_nozzle = next(row_contents_iter)
            while this_col[0] != back_left_column:
                this_col = next(col_iter)
                this_nozzle = next(row_contents_iter)
            yield this_nozzle
            while this_col[0] != front_right_column:
                this_col = next(col_iter)
                this_nozzle = next(row_contents_iter)
                yield this_nozzle

        def _cols_in_map() -> Iterator[Tuple[str, List[str]]]:
            cols_iter = iter(physical_columns.items())
            this_col = next(cols_iter)
            while this_col[0] != back_left_column:
                this_col = next(cols_iter)
            yield this_col
            while this_col[0] != front_right_column:
                this_col = next(cols_iter)
                yield this_col

        def _rows_in_col_in_map(
            col_name: str, col_contents: List[str]
        ) -> Iterator[str]:
            row_iter = iter(physical_rows.items())
            col_contents_iter = iter(col_contents)
            this_row = next(row_iter)
            this_nozzle = next(col_contents_iter)
            while this_row[0] != back_left_row:
                this_row = next(row_iter)
                this_nozzle = next(col_contents_iter)
            yield this_nozzle
            while this_row[0] != front_right_row:
                this_row = next(row_iter)
                this_nozzle = next(col_contents_iter)
                yield this_nozzle

        def _nozzles() -> Iterator[str]:
            for row in _rows_in_map():
                for nozzle in _cols_in_row_in_map(row[0], row[1]):
                    yield nozzle

        nozzles = list(_nozzles())
        if len(nozzles) == 0:
            raise IncompatibleNozzleConfiguration(
                message=f"Back left nozzle {back_left_nozzle} provided is not to the back or left of {front_right_nozzle}.",
                detail={
                    "requested_back_left_nozzle": back_left_nozzle,
                    "requested_front_right_nozzle": front_right_nozzle,
                },
            )

        map_store = OrderedDict(
            (nozzle, physical_nozzles[nozzle]) for nozzle in nozzles
        )
        rows = OrderedDict(
            (row_name, list(_cols_in_row_in_map(row_name, row_contents)))
            for row_name, row_contents in _rows_in_map()
        )
        cols = OrderedDict(
            (col_name, list(_rows_in_col_in_map(col_name, col_contents)))
            for col_name, col_contents in _cols_in_map()
        )
        return cls(
            starting_nozzle=starting_nozzle,
            map_store=map_store,
            rows=rows,
            columns=cols,
            configuration=NozzleConfigurationType.determine_nozzle_configuration(
                physical_rows, rows, physical_columns, cols
            ),
        )


class IncompatibleNozzleConfiguration(GeneralError):
    """Error raised if nozzle configuration is incompatible with the currently loaded pipette."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[GeneralError]] = None,
    ) -> None:
        """Build a IncompatibleNozzleConfiguration error."""
        super().__init__(
            code=ErrorCodes.API_MISCONFIGURATION,
            message=message,
            detail=detail,
            wrapping=wrapping,
        )


class NozzleConfigurationManager:
    def __init__(
        self,
        nozzle_map: NozzleMap,
    ) -> None:
        self._physical_nozzle_map = nozzle_map
        self._current_nozzle_configuration = nozzle_map

    @classmethod
    def build_from_config(
        cls, pipette_geometry: PipetteGeometryDefinition
    ) -> "NozzleConfigurationManager":

        sorted_nozzle_map = OrderedDict(
            (
                (k, Point(*pipette_geometry.nozzle_map[k]))
                for k in _nozzle_names_by_row(pipette_geometry.ordered_rows)
            )
        )
        sorted_rows = OrderedDict(
            (entry.key, entry.ordered_nozzles)
            for entry in pipette_geometry.ordered_rows
        )
        sorted_cols = OrderedDict(
            (entry.key, entry.ordered_nozzles)
            for entry in pipette_geometry.ordered_columns
        )
        back_left = next(iter(sorted_rows.values()))[0]
        front_right = next(reversed(list(sorted_rows.values())))[-1]
        starting_nozzle_config = NozzleMap.build(
            physical_nozzles=sorted_nozzle_map,
            physical_rows=sorted_rows,
            physical_columns=sorted_cols,
            starting_nozzle=back_left,
            back_left_nozzle=back_left,
            front_right_nozzle=front_right,
        )
        return cls(starting_nozzle_config)

    @property
    def starting_nozzle_offset(self) -> Point:
        return self._current_nozzle_configuration.starting_nozzle_offset

    @property
    def current_configuration(self) -> NozzleMap:
        return self._current_nozzle_configuration

    def reset_to_default_configuration(self) -> None:
        self._current_nozzle_configuration = self._physical_nozzle_map

    def update_nozzle_configuration(
        self,
        back_left_nozzle: str,
        front_right_nozzle: str,
        starting_nozzle: Optional[str] = None,
    ) -> None:
        self._current_nozzle_configuration = NozzleMap.build(
            # these casts are because of pydantic in the protocol engine (see above)
            physical_nozzles=cast(
                "OrderedDict[str, Point]", self._physical_nozzle_map.map_store
            ),
            physical_rows=cast(
                "OrderedDict[str, List[str]]", self._physical_nozzle_map.rows
            ),
            physical_columns=cast(
                "OrderedDict[str, List[str]]", self._physical_nozzle_map.columns
            ),
            starting_nozzle=starting_nozzle or back_left_nozzle,
            back_left_nozzle=back_left_nozzle,
            front_right_nozzle=front_right_nozzle,
        )

    def get_tip_count(self) -> int:
        return self._current_nozzle_configuration.tip_count

    def critical_point_with_tip_length(
        self,
        cp_override: Optional[CriticalPoint],
        tip_length: float = 0.0,
    ) -> Point:
        if cp_override == CriticalPoint.XY_CENTER:
            current_nozzle = self._current_nozzle_configuration.xy_center_offset
        elif cp_override == CriticalPoint.FRONT_NOZZLE:
            current_nozzle = self._current_nozzle_configuration.front_nozzle_offset
        else:
            current_nozzle = self.starting_nozzle_offset
        return current_nozzle - Point(0, 0, tip_length)
