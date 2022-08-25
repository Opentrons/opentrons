"""ProtocolEngine-based InstrumentContext core implementation."""

from ..instrument import AbstractInstrument
from .well import WellCore


class InstrumentCore(AbstractInstrument[WellCore]):
    """Instrument API core using a ProtocolEngine."""
