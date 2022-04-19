"""Protocol analysis storage."""
from collections import defaultdict
from typing import Dict, List

from opentrons.protocol_engine import (
    Command,
    ErrorOccurrence,
    LoadedPipette,
    LoadedLabware,
)

from .analysis_models import (
    AnalysisSummary,
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisResult,
)


class AnalysisStore:
    """Storage interface for protocol analyses."""

    def __init__(self) -> None:
        """Initialize the AnalysisStore's internal state."""
        self._analysis_ids_by_protocol: Dict[str, List[str]] = defaultdict(list)
        self._analyses_by_id: Dict[str, ProtocolAnalysis] = {}

    def add_pending(self, protocol_id: str, analysis_id: str) -> PendingAnalysis:
        """Add a pending analysis to the store."""
        ids_for_protocol = self._analysis_ids_by_protocol[protocol_id]

        assert (
            analysis_id not in ids_for_protocol
            and analysis_id not in self._analyses_by_id
        ), "Duplicate analysis ID"

        pending_analysis = PendingAnalysis.construct(id=analysis_id)
        self._analyses_by_id[analysis_id] = pending_analysis
        ids_for_protocol.append(analysis_id)

        return pending_analysis

    def update(
        self,
        analysis_id: str,
        commands: List[Command],
        labware: List[LoadedLabware],
        pipettes: List[LoadedPipette],
        errors: List[ErrorOccurrence],
    ) -> None:
        """Update analysis results in the store."""
        if len(errors) > 0:
            result = AnalysisResult.NOT_OK
        else:
            result = AnalysisResult.OK

        self._analyses_by_id[analysis_id] = CompletedAnalysis.construct(
            id=analysis_id,
            result=result,
            commands=commands,
            labware=labware,
            pipettes=pipettes,
            errors=errors,
        )

    def get_summaries_by_protocol(self, protocol_id: str) -> List[AnalysisSummary]:
        """Get analysis summaries for a given protocol ID from the store."""
        full_analyses = self.get_by_protocol(protocol_id)

        return [
            AnalysisSummary.construct(id=a.id, status=a.status) for a in full_analyses
        ]

    def get_by_protocol(self, protocol_id: str) -> List[ProtocolAnalysis]:
        """Get an analysis for a given protocol ID from the store."""
        ids_for_protocol = self._analysis_ids_by_protocol[protocol_id]

        return [self._analyses_by_id[analysis_id] for analysis_id in ids_for_protocol]
