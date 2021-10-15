"""Protocol analysis storage."""
from typing import Dict, List, Set, Sequence

from opentrons.protocol_engine import (
    Command,
    CommandStatus,
    LoadedPipette,
    LoadedLabware,
    ErrorOccurrence,
)

from .analysis_models import (
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisResult,
)


class AnalysisStore:
    """Storage interface for protocol analyses."""

    def __init__(self) -> None:
        """Initialize the AnalysisStore's internal state."""
        self._analysis_ids_by_protocol: Dict[str, Set[str]] = {}
        self._analyses_by_id: Dict[str, ProtocolAnalysis] = {}

    def add_pending(self, protocol_id: str, analysis_id: str) -> List[ProtocolAnalysis]:
        """Add a pending analysis to the store."""
        self._analyses_by_id[analysis_id] = PendingAnalysis(id=analysis_id)

        ids_for_protocol = self._analysis_ids_by_protocol.get(protocol_id, set())
        ids_for_protocol.add(analysis_id)
        self._analysis_ids_by_protocol[protocol_id] = ids_for_protocol

        return self.get_by_protocol(protocol_id)

    def update(
        self,
        analysis_id: str,
        commands: Sequence[Command],
        labware: Sequence[LoadedLabware],
        pipettes: Sequence[LoadedPipette],
        errors: Sequence[ErrorOccurrence],
    ) -> None:
        """Update analysis results in the store."""
        if any(c.status == CommandStatus.FAILED for c in commands):
            result = AnalysisResult.NOT_OK
        elif len(errors) > 0:
            result = AnalysisResult.ERROR
        else:
            result = AnalysisResult.OK

        self._analyses_by_id[analysis_id] = CompletedAnalysis(
            id=analysis_id,
            result=result,
            commands=list(commands),
            labware=list(labware),
            pipettes=list(pipettes),
            errors=list(errors),
        )

    def get_by_protocol(self, protocol_id: str) -> List[ProtocolAnalysis]:
        """Get an analysis for a given protocol ID from the store."""
        ids_for_protocol = self._analysis_ids_by_protocol.get(protocol_id, set())

        return [self._analyses_by_id[analysis_id] for analysis_id in ids_for_protocol]
