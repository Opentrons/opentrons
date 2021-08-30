"""Protocol analysis storage."""
from typing import Dict, Sequence

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
        self._analyses_by_id: Dict[str, CompletedAnalysis] = {}

    def add(
        self,
        protocol_id: str,
        commands: Sequence[pe_commands.Command],
        errors: Sequence[Exception],
    ) -> None:
        """Add analysis results to the store."""
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

        self._analyses_by_id[protocol_id] = CompletedAnalysis(
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

    def get(self, protocol_id: str) -> ProtocolAnalysis:
        """Get an analysis for a given protocol ID from the store."""
        return self._analyses_by_id.get(protocol_id, PendingAnalysis())
