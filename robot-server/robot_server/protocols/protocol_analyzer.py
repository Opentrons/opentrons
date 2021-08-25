"""Protocol analysis module.

Apologies for the American English spelling of analyzer.
"""
# TODO(mc, 2021-08-25): eventually, move this to opentrons.protocol_analyzer
from opentrons.protocol_runner import ProtocolRunner

from .protocol_store import ProtocolResource
from .analysis_store import AnalysisStore


class ProtocolAnalyzer:
    """An interface to perform a run analysis of a protocol."""

    def __init__(
        self,
        protocol_runner: ProtocolRunner,
        analysis_store: AnalysisStore,
    ) -> None:
        """Initialize the analyzer and its dependencies."""
        self._protocol_runner = protocol_runner
        self._analysis_store = analysis_store

    async def analyze(self, protocol_resource: ProtocolResource) -> None:
        """Analyze a given protocol, storing the analysis when complete."""
        commands = await self._protocol_runner.run(protocol_resource)
        self._analysis_store.add(
            protocol_id=protocol_resource.protocol_id,
            commands=commands,
        )
