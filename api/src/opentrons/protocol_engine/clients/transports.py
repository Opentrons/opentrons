"""A helper for controlling a `ProtocolEngine` without async/await."""
from asyncio import AbstractEventLoop, run_coroutine_threadsafe
from typing import Any, overload
from typing_extensions import Literal

from opentrons_shared_data.labware.dev_types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition

from ..protocol_engine import ProtocolEngine
from ..errors import ProtocolCommandFailedError
from ..state import StateView
from ..commands import CommandCreate, CommandResult


class ChildThreadTransport:
    """A helper for controlling a `ProtocolEngine` without async/await.

    You shouldn't use this directly, except to construct it and then pass it to a `SyncClient`.

    This class is responsible for doing the actual transformation from async `ProtocolEngine` calls
    to non-async ones, and doing it in a thread-safe way.
    """

    def __init__(self, engine: ProtocolEngine, loop: AbstractEventLoop) -> None:
        """Initialize the `ChildThreadTransport`.

        Args:
            engine: The `ProtocolEngine` instance that you want to interact with.
                It must be running in a thread *other* than the one from which you
                want to synchronously access it.
            loop: The event loop that `engine` is running in (in the other thread).
        """
        self._engine = engine
        self._loop = loop

    @property
    def state(self) -> StateView:
        """Get a view of the Protocol Engine's state."""
        return self._engine.state_view

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
        command = run_coroutine_threadsafe(
            self._engine.add_and_execute_command(request=request),
            loop=self._loop,
        ).result()

        # TODO: this needs to have an actual code
        if command.error is not None:
            error = command.error
            raise ProtocolCommandFailedError(
                original_error=error,
                message=f"{error.errorType}: {error.detail}",
            )

        # FIXME(mm, 2023-04-10): This assert can easily trigger from this sequence:
        #
        # 1. The engine is paused.
        # 2. The user's Python script calls this method to start a new command,
        #    which remains `queued` because of the pause.
        # 3. The engine is stopped.
        #
        # The returned command will be `queued`, so it won't have a result.
        #
        # We need to figure out a proper way to report this condition to callers
        # so they correctly interpret it as an intentional stop, not an internal error.
        assert command.result is not None, f"Expected Command {command} to have result"

        return command.result

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
        method_name: Literal["reset_tips"],
        *,
        labware_id: str,
    ) -> None:
        ...

    @overload
    def call_method(
        self,
        method_name: str,
        **kwargs: Any,
    ) -> Any:
        ...

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
