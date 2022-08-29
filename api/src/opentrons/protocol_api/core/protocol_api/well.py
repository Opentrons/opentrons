"""Legacy Well core implementation."""

import re

from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN

from ..well import AbstractWellCore


class WellImplementation(AbstractWellCore):
    """Well implementation core based on legacy PAPIv2 behavior.

    Args:
        well_geometry: Information about the well's geometry.
        display_name: User-facing display name.
        has_tip: Whether the well contains a tip.
        name: Unique well name inside its labware, e.g. `A1`.
            Must match pattern /^([A-Z]+)([0-9]+)$/.
    """

    pattern = re.compile(WELL_NAME_PATTERN, re.X)

    def __init__(
        self, well_geometry: WellGeometry, display_name: str, has_tip: bool, name: str
    ) -> None:
        self._display_name = display_name
        self._has_tip = has_tip
        self._name = name

        match = WellImplementation.pattern.match(name)
        assert match, (
            f"could not match '{name}' using "
            f"pattern '{WellImplementation.pattern.pattern}'"
        )
        self._row_name = match.group(1)
        self._column_name = match.group(2)
        self._geometry = well_geometry

    def has_tip(self) -> bool:
        """Whether the well contains a tip."""
        return self._has_tip

    def set_has_tip(self, value: bool) -> None:
        """Set the well as containing or not containing a tip."""
        self._has_tip = value

    def get_display_name(self) -> str:
        """Get the well's full display name."""
        return self._display_name

    def get_name(self) -> str:
        """Get the name of the well (e.g. "A1")."""
        return self._name

    def get_column_name(self) -> str:
        """Get the column portion of the well name (e.g. "A")."""
        return self._column_name

    def get_row_name(self) -> str:
        """Get the row portion of the well name (e.g. "1")."""
        return self._row_name

    def get_geometry(self) -> WellGeometry:
        """Get the well's geometry information interface."""
        return self._geometry

    def __repr__(self) -> str:
        """Use the well's display name as its repr."""
        return self.get_display_name()

    # TODO(mc, 2022-08-24): comparing only names seems insufficient
    def __eq__(self, other: object) -> bool:
        """Assume that if name is the same then it's the same well."""
        return (
            isinstance(other, WellImplementation)
            and self.get_name() == other.get_name()
        )
