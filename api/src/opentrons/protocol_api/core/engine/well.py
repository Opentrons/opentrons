"""ProtocolEngine-based Well core implementations."""


from ..well import AbstractWellCore

from opentrons.protocols.geometry.well_geometry import WellGeometry


class WellCore(AbstractWellCore):
    """Well API core using a ProtocolEngine."""

    def has_tip(self) -> bool:
        """Whether the well contains a tip."""
        raise NotImplementedError("WellCore not implemented")

    def set_has_tip(self, value: bool) -> None:
        """Set the well as containing or not containing a tip."""
        raise NotImplementedError("WellCore not implemented")

    def get_display_name(self) -> str:
        """Get the well's full display name."""
        raise NotImplementedError("WellCore not implemented")

    def get_name(self) -> str:
        """Get the name of the well (e.g. "A1")."""
        raise NotImplementedError("WellCore not implemented")

    def get_column_name(self) -> str:
        """Get the column portion of the well name (e.g. "A")."""
        raise NotImplementedError("WellCore not implemented")

    def get_row_name(self) -> str:
        """Get the row portion of the well name (e.g. "1")."""
        raise NotImplementedError("WellCore not implemented")

    def get_geometry(self) -> WellGeometry:
        """Get the well's geometry information interface."""
        raise NotImplementedError("WellCore not implemented")
