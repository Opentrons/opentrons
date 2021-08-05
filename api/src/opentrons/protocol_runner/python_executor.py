"""Python protocol executor."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Optional

from opentrons.protocol_api_experimental import ProtocolContext
from .python_reader import PythonProtocol


class PythonExecutor:
    """Execute a given PythonProtocol's run method with a ProtocolContext."""

    def __init__(self, loop: asyncio.AbstractEventLoop) -> None:
        """Initialize the exector with its dependencies and a thread pool."""
        self._loop = loop
        self._thread_pool = ThreadPoolExecutor(max_workers=1)
        self._protocol: Optional[PythonProtocol] = None
        self._context: Optional[ProtocolContext] = None

    def load(
        self,
        protocol: PythonProtocol,
        context: ProtocolContext,
    ) -> None:
        """Load the executor with the Protocol and ProtocolContext."""
        self._protocol = protocol
        self._context = context

    async def execute(self) -> None:
        """Execute the previously loaded Protocol."""
        assert self._protocol, "Expected PythonExecutor.load to have been called"
        assert self._context, "Expected PythonExecutor.load to have been called"

        await self._loop.run_in_executor(
            executor=self._thread_pool,
            func=partial(self._protocol.run, self._context),
        )
