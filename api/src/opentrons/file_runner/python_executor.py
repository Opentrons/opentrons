"""Python protocol executor."""

from opentrons.protocol_api_experimental import ProtocolContext
from .python_file_reader import PythonProtocol


class PythonExecutor:
    """Execute a given PythonProtocol's run method with a ProtocolContext."""

    def load(
        self,
        protocol: PythonProtocol,
        context: ProtocolContext,
    ) -> None:
        """Load the executor with the Protocol and ProtocolContext."""
        raise NotImplementedError("PythonExecutor not yet implemented")

    def execute(self) -> None:
        """Execute the previously loaded Protocol."""
        raise NotImplementedError("PythonExecutor not yet implemented")
