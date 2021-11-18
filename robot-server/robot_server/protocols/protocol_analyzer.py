"""Protocol analysis module."""
from opentrons.protocol_runner import ProtocolRunner

from .protocol_store import ProtocolResource
from .analysis_store import AnalysisStore


class ProtocolAnalyzer:
    """A collaborator to perform an analysis of a protocol and store the result."""

    def __init__(
        self,
        protocol_runner: ProtocolRunner,
        analysis_store: AnalysisStore,
    ) -> None:
        """Initialize the analyzer and its dependencies."""
        self._protocol_runner = protocol_runner
        self._analysis_store = analysis_store

    async def analyze(
        self,
        protocol_resource: ProtocolResource,
        analysis_id: str,
    ) -> None:
        """Analyze a given protocol, storing the analysis when complete."""
        result = await self._protocol_runner.run(protocol_resource)

        self._analysis_store.update(
            analysis_id=analysis_id,
            commands=result.commands,
            labware=result.labware,
            pipettes=result.pipettes,
            errors=result.errors,
        )
