"""Well grid information."""
import collections
import re
from dataclasses import dataclass
from typing import Dict, List

from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN


_WELL_NAME_RE = re.compile(WELL_NAME_PATTERN)


@dataclass(frozen=True)
class WellGrid:
    """Well grid information.

    Props:
        columns: A matrix of well names, organized by columns.
        rows: A matrix of well names, organized by rows.
        column_names: The name of each column in `columns`, by index.
        row_names: The name of each row in `rows`, by index.
    """

    rows_by_name: Dict[str, List[str]]
    columns_by_name: Dict[str, List[str]]


# NOTE(mc, 2022-11-11): to preserve historical behavior,
# this function organizes rows and columns using the well name,
# rather than the well's position in the labware definition's `ordering` field.
# Logic originally added in https://github.com/Opentrons/opentrons/pull/2418
def create(columns: List[List[str]]) -> WellGrid:
    columns_by_name = collections.defaultdict(list)
    rows_by_name = collections.defaultdict(list)

    for column in columns:
        for well_name in column:
            well_name_match = _WELL_NAME_RE.match(well_name)

            assert (
                well_name_match is not None
            ), "Well name did not match required pattern; please check labware definition."

            row_name, column_name = well_name_match.group(1, 2)
            rows_by_name[row_name].append(well_name)
            columns_by_name[column_name].append(well_name)

    return WellGrid(
        columns_by_name=columns_by_name,
        rows_by_name=rows_by_name,
    )
