"""Python protocol executor."""

from opentrons.protocol_api_experimental import ProtocolContext
from .python_file_reader import PythonProtocol


class PythonExecutor:
    """Execute a given PythonProtocol's run method with a ProtocolContext."""

    def execute(
        self,
        python_protocol: PythonProtocol,
        protocol_context: ProtocolContext,
    ) -> None:
        raise NotImplementedError()
