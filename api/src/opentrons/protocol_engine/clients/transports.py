"""A helper for controlling a `ProtocolEngine` without async/await."""
from asyncio import AbstractEventLoop, run_coroutine_threadsafe
from typing import Any, Final, overload
from typing_extensions import Literal

from opentrons_shared_data.labware.types import LabwareUri
from opentrons_shared_data.labware.labware_definition import LabwareDefinition


from ..protocol_engine import ProtocolEngine
from ..errors import ProtocolCommandFailedError
from ..error_recovery_policy import ErrorRecoveryType
from ..state.state import StateView
from ..commands import Command, CommandCreate, CommandResult, CommandStatus


class RunStoppedBeforeCommandError(RuntimeError):
    """Raised if the ProtocolEngine was stopped before a command could start."""

    def __init__(self, command: Command) -> None:
        self._command = command
        super().__init__(
            f"The run was stopped"
            f" before {command.commandType} command {command.id} could execute."
        )


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
        # We might access these from different threads,
        # so let's make them Final for (shallow) immutability.
        self._engine: Final = engine
        self._loop: Final = loop

    @property
    def state(self) -> StateView:
        """Get a view of the Protocol Engine's state."""
        return self._engine.state_view

    def execute_command(self, request: CommandCreate) -> CommandResult:
        """Execute a ProtocolEngine command.

        This blocks until the command completes. If the command fails, this will always
        raise the failure as an exception--even if ProtocolEngine deemed the failure
        recoverable.

        Args:
            request: The ProtocolEngine command request

        Returns:
            The command's result data.

        Raises:
            ProtocolEngineError: If the command execution was not successful,
                the specific error that caused the command to fail is raised.

                If the run was stopped before the command could complete, that's
                also signaled as this exception.
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

        if command.result is None:
            # This can happen with a certain pause timing:
            #
            # 1. The engine is paused.
            # 2. The user's Python script calls this method to start a new command,
            #    which remains `queued` because of the pause.
            # 3. The engine is stopped. The returned command will be `queued`
            #    and won't have a result.
            raise RunStoppedBeforeCommandError(command)

        return command.result

    def execute_command_wait_for_recovery(self, request: CommandCreate) -> Command:
        """Execute a ProtocolEngine command, including error recovery.

        This blocks until the command completes. Additionally, if the command fails,
        this will continue to block until its error recovery has been completed.

        Args:
            request: The ProtocolEngine command request.

        Returns:
            The command. If error recovery happened for it, the command will be
            reported here as failed.

        Raises:
            ProtocolEngineError: If the command failed, *and* the failure was not
                recovered from.

                If the run was stopped before the command could complete, that's
                also signalled as this exception.
        """

        async def run_in_pe_thread() -> Command:
            command = await self._engine.add_and_execute_command_wait_for_recovery(
                request=request
            )

            if command.error is not None:
                error_recovery_type = (
                    self._engine.state_view.commands.get_error_recovery_type(command.id)
                )
                error_should_fail_run = (
                    error_recovery_type == ErrorRecoveryType.FAIL_RUN
                )
                if error_should_fail_run:
                    error = command.error
                    # TODO: this needs to have an actual code
                    raise ProtocolCommandFailedError(
                        original_error=error,
                        message=f"{error.errorType}: {error.detail}",
                    )

            elif command.status == CommandStatus.QUEUED:
                # This can happen with a certain pause timing:
                #
                # 1. The engine is paused.
                # 2. The user's Python script calls this method to start a new command,
                #    which remains `queued` because of the pause.
                # 3. The engine is stopped. The returned command will be `queued`,
                #    and won't have a result.
                raise RunStoppedBeforeCommandError(command)

            return command

        command = run_coroutine_threadsafe(
            run_in_pe_thread(),
            loop=self._loop,
        ).result()

        return command

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
