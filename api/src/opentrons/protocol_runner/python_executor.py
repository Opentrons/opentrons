"""Python protocol executor."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from opentrons.protocol_api_experimental import ProtocolContext
from .python_file_reader import PythonProtocol


class PythonExecutor:
    """Execute a given PythonProtocol's run method with a ProtocolContext."""

    @staticmethod
    async def execute(protocol: PythonProtocol, context: ProtocolContext) -> None:
        """Execute a PythonProtocol using the given ProtocolContext.

        Runs the protocol asynchronously in a child thread.
        """
        loop = asyncio.get_running_loop()

        with ThreadPoolExecutor(max_workers=1) as executor:
            await loop.run_in_executor(
                executor=executor,
                func=partial(protocol.run, context),
            )
