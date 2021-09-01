"""Protocol analysis storage."""
from typing import Dict, List, Set, Sequence

from opentrons.calibration_storage.helpers import uri_from_details
from opentrons.protocol_engine import commands as pe_commands

from .analysis_models import (
    ProtocolAnalysis,
    PendingAnalysis,
    CompletedAnalysis,
    AnalysisStatus,
    AnalysisLabware,
    AnalysisPipette,
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
        commands: Sequence[pe_commands.Command],
        errors: Sequence[Exception],
    ) -> None:
        """Update analysis results in the store."""
        labware = []
        pipettes = []
        # TODO(mc, 2021-08-25): return error details objects, not strings
        error_messages = [str(e) for e in errors]

        for c in commands:
            if isinstance(c, pe_commands.LoadLabware) and c.result is not None:
                labware.append(
                    AnalysisLabware(
                        id=c.result.labwareId,
                        loadName=c.data.loadName,
                        definitionUri=uri_from_details(
                            load_name=c.data.loadName,
                            namespace=c.data.namespace,
                            version=c.data.version,
                        ),
                        location=c.data.location,
                    )
                )
            elif isinstance(c, pe_commands.LoadPipette) and c.result is not None:
                pipettes.append(
                    AnalysisPipette(
                        id=c.result.pipetteId,
                        pipetteName=c.data.pipetteName,
                        mount=c.data.mount,
                    )
                )
            elif c.error is not None:
                error_messages.append(c.error)

        self._analyses_by_id[analysis_id] = CompletedAnalysis(
            id=analysis_id,
            status=(
                AnalysisStatus.SUCCEEDED
                if len(error_messages) == 0
                else AnalysisStatus.FAILED
            ),
            commands=list(commands),
            errors=error_messages,
            labware=labware,
            pipettes=pipettes,
        )

    def get_by_protocol(self, protocol_id: str) -> List[ProtocolAnalysis]:
        """Get an analysis for a given protocol ID from the store."""
        ids_for_protocol = self._analysis_ids_by_protocol.get(protocol_id, set())

        return [self._analyses_by_id[analysis_id] for analysis_id in ids_for_protocol]
