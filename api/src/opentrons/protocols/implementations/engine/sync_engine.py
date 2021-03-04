"""Synchronous wrapper for executing ProtocolEngine commands.

Note: this module may go through a lot of changes as we research
if and how multiprocessing fits into our Python protocol execution.
"""
from asyncio import AbstractEventLoop, run_coroutine_threadsafe
from uuid import uuid4
from typing import cast
from opentrons.protocol_engine import DeckSlotLocation, ProtocolEngine, commands


class SyncProtocolEngine():
    """Synchronous ProtocolEngine command executor."""

    _loop: AbstractEventLoop
    _engine: ProtocolEngine

    def __init__(
        self,
        loop: AbstractEventLoop,
        engine: ProtocolEngine,
    ) -> None:
        """Initialize a synchronous ProtocolEngine adapter.

        This adapter allows a Protocol Context to make blocking calls on its
        thread to the asynchronous Protocol Engine running with an event loop
        in a different thread.

        Args:
            loop: An event loop running in the thread where the hardware
                interaction should occur. The thread this loop is running
                in should be different than the thread in which the Python
                protocol is running.
            engine: An instance of a ProtocolEngine to interact with hardware
                and other run procedures.
        """
        self._loop = loop
        self._engine = engine

    def _execute_command_sync(
        self,
        request: commands.CommandRequestType,
    ) -> commands.CommandResultType:
        """Execute a Protocol Engine command in the external event loop.

        Blocks in the calling thread until the execution has completed in the
        external event loop.

        Args:
            request: The ProtocolEngine command request

        Returns:
            The command's result data.

        Raises:
            ProtocolEngineError: if the command execution is not successful,
                the specific error that cause the command to fail is raised.
        """
        command_id = str(uuid4())
        command_state = run_coroutine_threadsafe(
            self._engine.execute_command(request=request, command_id=command_id),
            loop=self._loop,
        ).result()

        if isinstance(command_state, commands.FailedCommand):
            raise command_state.error

        return command_state.result

    def load_labware(
        self,
        location: DeckSlotLocation,
        load_name: str,
        namespace: str,
        version: int,
    ) -> commands.LoadLabwareResult:
        """Execute a LoadLabwareRequest, returning the result."""
        request = commands.LoadLabwareRequest(
            location=location,
            loadName=load_name,
            namespace=namespace,
            version=version,
        )
        result = self._execute_command_sync(request)

        return cast(commands.LoadLabwareResult, result)
