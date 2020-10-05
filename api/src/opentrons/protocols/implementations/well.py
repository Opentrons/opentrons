from __future__ import annotations

from typing import TYPE_CHECKING

from opentrons.protocols.geometry.well_geometry import WellGeometry

if TYPE_CHECKING:
    from opentrons.protocol_api.labware import Labware


class WellImplementation:

    def __init__(self,
                 well_geometry: WellGeometry,
                 display_name: str,
                 has_tip: bool,
                 name: str) -> None:
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
        self._geometry = well_geometry

    def get_parent(self) -> Labware:
        return self._geometry.parent.labware   # type: ignore

    def has_tip(self) -> bool:
        return self._has_tip

    def set_has_tip(self, value: bool) -> None:
        self._has_tip = value

    def get_display_name(self) -> str:
        return self._display_name

    def get_name(self) -> str:
        return self._name

    def get_geometry(self) -> WellGeometry:
        return self._geometry
