import asyncio
import logging
import typing
from dataclasses import asdict

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand, CommandResult
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.models import ProtocolCommand, \
    CommandDefinitionType
from robot_server.service.session.session_types.protocol.execution.\
    protocol_runner import ProtocolRunner
from robot_server.service.session.session_types.protocol.execution.worker \
    import Worker
from robot_server.service.session.session_types.protocol.models import \
    ProtocolSessionState
from robot_server.util import duration


log = logging.getLogger(__name__)


class ProtocolCommandExecutor(CommandExecutor):
    """The protocol command executor."""

    STATE_COMMAND_MAP: typing.Dict[
        ProtocolSessionState,
        typing.Set[CommandDefinitionType]
    ] = {
        ProtocolSessionState.idle: set(),
        ProtocolSessionState.ready: {
            ProtocolCommand.start_run,
            ProtocolCommand.start_simulate
        },
        ProtocolSessionState.running: {
            ProtocolCommand.cancel,
            ProtocolCommand.pause
        },
        ProtocolSessionState.simulating: {
            ProtocolCommand.cancel,
            ProtocolCommand.pause
        },
        ProtocolSessionState.failed: set(),
        ProtocolSessionState.paused: {
            ProtocolCommand.cancel,
            ProtocolCommand.resume,
            ProtocolCommand.single_step
        },
    }

    def __init__(self,
                 protocol: UploadedProtocol,
                 configuration: SessionConfiguration):
        """Constructor

        :param protocol: The protocol resource to use
        :param configuration: The session configuration
        """
        self._loop = asyncio.get_event_loop()
        self._protocol = protocol
        # Create the protocol runner
        self._protocol_runner = ProtocolRunner(
            protocol=protocol,
            loop=self._loop,
            hardware=configuration.hardware,
            motion_lock=configuration.motion_lock)
        self._protocol_runner.add_listener(self._on_command)
        # The async worker with all commands are delegated.
        self._worker = Worker(
            protocol_runner=self._protocol_runner,
            loop=asyncio.get_event_loop()
        )
        self._handlers: typing.Dict[CommandDefinitionType, typing.Any] = {
            ProtocolCommand.start_run: self._worker.handle_run,
            ProtocolCommand.start_simulate: self._worker.handle_simulate,
            ProtocolCommand.cancel: self._worker.handle_cancel,
            ProtocolCommand.resume: self._worker.handle_resume,
            ProtocolCommand.pause: self._worker.handle_pause,
            ProtocolCommand.single_step: self._worker.handle_single_step,
        }
        # TODO: Amit 8/3/2020 - proper schema for command list
        self._commands: typing.List[typing.Any] = []

    async def execute(self, command: Command) -> CompletedCommand:
        """Command processing"""
        command_def = command.content.name
        if command_def not in self.STATE_COMMAND_MAP.get(
                self.current_state, {}
        ):
            raise UnsupportedCommandException(
                f"Can't do '{command_def}' during self.{self.current_state}")

        # TODO: Amit 8/3/2020 - proper schema for command list
        self._commands.append(asdict(command))

        handler = self._handlers.get(command_def)
        if not handler:
            raise UnsupportedCommandException(
                f"Command '{command_def}' is not supported."
            )

        with duration() as timed:
            await handler()

        return CompletedCommand(
            content=command.content,
            meta=command.meta,
            result=CommandResult(started_at=timed.start,
                                 completed_at=timed.end)
        )

    @property
    def commands(self):
        # TODO: Amit 8/3/2020 - proper schema for command list
        return self._commands

    @property
    def current_state(self) -> ProtocolSessionState:
        return self._worker.current_state

    def _on_command(self, msg):
        """Handler for commands executed by protocol runner"""
        log.debug(msg)
        # TODO: Amit 8/3/2020 - proper schema for command entries
        self._loop.call_soon_threadsafe(self._commands.append, msg)

    async def clean_up(self):
        await self._worker.handle_finish()
