"""Python protocol executor."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial

from opentrons.protocol_api_experimental import ProtocolContext
from .python_file_reader import PythonProtocol


class PythonExecutor:
    """Execute a given PythonProtocol's run method with a ProtocolContext."""

    def __init__(self) -> None:
        """Initialize the executor with a thread pool.

        A PythonExecutor uses its own ThreadPoolExecutor (rather than the default)
        to avoid thread pool exhaustion from tying up protocol execution.
        """
        self._loop = asyncio.get_running_loop()
        # fixme(mm, 2021-08-09): This class should be a context manager and call
        # self._thread_pool.shutdown(). Currently, I think we leak threads.
        self._thread_pool = ThreadPoolExecutor(max_workers=1)

    async def execute(self, protocol: PythonProtocol, context: ProtocolContext) -> None:
        """Execute a PythonProtocol using the given ProtocolContext.

        Runs the protocol asynchronously in a child thread.
        """
        await self._loop.run_in_executor(
            executor=self._thread_pool,
            func=partial(protocol.run, context),
        )
