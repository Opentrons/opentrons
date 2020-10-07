from __future__ import annotations

import re

from opentrons.protocols.geometry.well_geometry import WellGeometry
from opentrons_shared_data.labware.constants import WELL_NAME_PATTERN


class WellImplementation:

    pattern = re.compile(WELL_NAME_PATTERN, re.X)

    def __init__(self,
                 well_geometry: WellGeometry,
                 display_name: str,
                 has_tip: bool,
                 name: str):
        """
        Construct a well

        :param well_geometry: The well's geometry
        :param display_name: a string that identifies a well. Used primarily
            for debug and test purposes. Should be unique and human-readable--
            something like "Tip C3 of Opentrons 300ul Tiprack on Slot 5" or
            "Well D1 of Biorad 96 PCR Plate on Magnetic Module in Slot 1".
            This is created by the caller and passed in, so here it is just
            saved and made available.
        :param has_tip: whether a tip is present
        :param name: The well name (ie. A1, B4, C2, etc.)
        """
        self._display_name = display_name
        self._has_tip = has_tip
        self._name = name

        match = WellImplementation.pattern.match(name)
        assert match, f"could not match '{name}' using " \
                      f"pattern '{WellImplementation.pattern.pattern}'"
        self._row_name = match.group(1)
        self._column_name = match.group(2)
        self._geometry = well_geometry

    def has_tip(self) -> bool:
        return self._has_tip

    def set_has_tip(self, value: bool) -> None:
        self._has_tip = value

    def get_display_name(self) -> str:
        return self._display_name

    def get_name(self) -> str:
        """The name of the well (ie A1, A2,... B3,...C10"""
        return self._name

    def get_column_name(self) -> str:
        """The column portion of the well name"""
        return self._column_name

    def get_row_name(self) -> str:
        """The row portion of the well name"""
        return self._row_name

    def get_geometry(self) -> WellGeometry:
        return self._geometry

    def __repr__(self):
        return self.get_display_name()

    def __eq__(self, other) -> bool:
        """Assume that if name is the same then it's the same well"""
        return \
            isinstance(other, WellImplementation) and\
            self.get_name() == other.get_name()
