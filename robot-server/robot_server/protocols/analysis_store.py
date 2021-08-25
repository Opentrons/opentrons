"""Protocol analysis storage."""
from typing import Sequence

from opentrons.protocol_engine import Command as ProtocolCommand
from .analysis_models import ProtocolAnalysis


class AnalysisStore:
    """Storage interface for protocol analyses."""

    def add(self, protocol_id: str, commands: Sequence[ProtocolCommand]) -> None:
        """Add analysis results to the store."""
        raise NotImplementedError("AnalysisStore not yet implemented.")

    def get(self, protocol_id: str) -> ProtocolAnalysis:
        """Get an analysis for a given protocol ID from the store."""
        raise NotImplementedError("AnalysisStore not yet implemented.")
