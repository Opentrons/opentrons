"""ProtocolEngine-based Labware core implementations."""

from ..labware import AbstractLabware
from .well import WellCore


class LabwareCore(AbstractLabware[WellCore]):
    """Labware API core using a ProtocolEngine."""
