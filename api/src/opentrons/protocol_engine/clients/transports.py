"""Base transport interfaces for communicating with a Protocol Engine."""
from abc import ABC, abstractmethod
from asyncio import AbstractEventLoop, run_coroutine_threadsafe
from typing import Any, overload
from typing_extensions import Literal

from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from ..protocol_engine import ProtocolEngine
from ..errors import ProtocolEngineError
from ..state import StateView
from ..commands import CommandCreate, CommandResult


class AbstractSyncTransport(ABC):
    """Interface describing a sync. ProtocolEngine state/command transport."""

    @property
    @abstractmethod
    def state(self) -> StateView:
        """Get a view of the ProtocolEngine's state."""
        ...

    @abstractmethod
    def execute_command(self, request: CommandCreate) -> CommandResult:
        """Execute a ProtocolEngine command, blocking until the command completes.

        Args:
            request: The ProtocolEngine command request

        Returns:
            The command's result data.

        Raises:
            ProtocolEngineError: if the command execution is not successful,
                the specific error that cause the command to fail is raised.
        """
        ...

    @overload
    def call_method(
        self,
        method_name: Literal["add_labware_definition"],
        *,
        definition: LabwareDefinition,
    ) -> LabwareUri:
        ...

    @overload
    def call_method(
        self,
        method_name: str,
        **kwargs: Any,
    ) -> Any:
        ...

    @abstractmethod
    def call_method(self, method_name: str, **kwargs: Any) -> Any:
        """Execute a ProtocolEngine method, returning the result."""
        ...


class ChildThreadTransport(AbstractSyncTransport):
    """Concrete transport implementation using asyncio.run_coroutine_threadsafe."""

    def __init__(self, engine: ProtocolEngine, loop: AbstractEventLoop) -> None:
        """Initialize a ProtocolEngine transport for use in a child thread.

        This adapter allows a client to make blocking command calls on its
        thread to the asynchronous ProtocolEngine running with an event loop
        in a different thread.

        Args:
            engine: An instance of a ProtocolEngine to interact with hardware
                and other run procedures.
            loop: An event loop running in the thread where the hardware
                interaction should occur. The thread this loop is running
                in should be different than the thread in which the Python
                protocol is running.
        """
        self._engine = engine
        self._loop = loop

    @property
    def state(self) -> StateView:
        """Get a view of the Protocol Engine's state."""
        return self._engine.state_view

    def execute_command(self, request: CommandCreate) -> CommandResult:
        """Execute a command synchronously on the main thread."""
        command = run_coroutine_threadsafe(
            self._engine.add_and_execute_command(request=request),
            loop=self._loop,
        ).result()

        if command.error is not None:
            error = command.error
            raise ProtocolEngineError(f"{error.errorType}: {error.detail}")

        assert command.result is not None, f"Expected Command {command} to have result"

        return command.result

    def call_method(self, method_name: str, **kwargs: Any) -> Any:
        """Execute a ProtocolEngine method, returning the result."""
        return run_coroutine_threadsafe(
            self._call_method(method_name, **kwargs),
            loop=self._loop,
        ).result()

    async def _call_method(self, method_name: str, **kwargs: Any) -> Any:
        method = getattr(self._engine, method_name)
        assert callable(method), f"{method_name} is not a method of ProtocolEngine"
        return method(**kwargs)
