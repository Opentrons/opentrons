"""Protocol analysis module."""
from typing import List
from opentrons.protocol_engine import Command, LoadedLabware, LoadedPipette
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
        commands: List[Command] = []
        labware: List[LoadedLabware] = []
        pipettes: List[LoadedPipette] = []
        errors: List[Exception] = []

        try:
            result = await self._protocol_runner.run(protocol_resource)
            commands = result.commands
            labware = result.labware
            pipettes = result.pipettes
        except Exception as e:
            errors = [e]

        self._analysis_store.update(
            analysis_id=analysis_id,
            commands=commands,
            labware=labware,
            pipettes=pipettes,
            errors=errors,
        )
