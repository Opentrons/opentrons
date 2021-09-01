"""Protocol analysis module."""
from typing import Sequence
from opentrons.protocol_engine import Command as ProtocolCommand
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
        commands: Sequence[ProtocolCommand] = []
        errors: Sequence[Exception] = []

        try:
            commands = await self._protocol_runner.run(protocol_resource)
        except Exception as e:
            errors = [e]

        self._analysis_store.update(
            analysis_id=analysis_id,
            commands=commands,
            errors=errors,
        )
