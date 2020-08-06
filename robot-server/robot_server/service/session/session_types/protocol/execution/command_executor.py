import asyncio
import logging
import typing
from dataclasses import asdict

if typing.TYPE_CHECKING:
    from opentrons.api.dev_types import State

from opentrons.api import Session

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
    import _Worker, WorkerListener, WorkerDirective
from robot_server.util import duration


log = logging.getLogger(__name__)


class ProtocolCommandExecutor(CommandExecutor, WorkerListener):
    """The protocol command executor."""

    STATE_COMMAND_MAP: typing.Dict[
        'State',
        typing.Set[CommandDefinitionType]
    ] = {
        'loaded': {
            ProtocolCommand.start_run,
            ProtocolCommand.start_simulate
        },
        'running': {
            ProtocolCommand.cancel,
            ProtocolCommand.pause
        },
        'error': set(),
        'paused': {
            ProtocolCommand.cancel,
            ProtocolCommand.resume
        },
        'finished': {
            ProtocolCommand.start_run,
            ProtocolCommand.start_simulate
        },
        'stopped': set(),
        None: set(),
    }

    def __init__(self,
                 protocol: UploadedProtocol,
                 configuration: SessionConfiguration):
        """Constructor

        :param protocol: The protocol resource to use
        :param configuration: The session configuration
        """
        self._worker_directive = WorkerDirective.none
        self._worker_state: 'State' = None
        self._worker = self.create_worker(configuration, protocol, self)
        self._handlers: typing.Dict[CommandDefinitionType, typing.Any] = {
            ProtocolCommand.start_run: self._worker.handle_run,
            ProtocolCommand.start_simulate: self._worker.handle_simulate,
            ProtocolCommand.cancel: self._worker.handle_cancel,
            ProtocolCommand.resume: self._worker.handle_resume,
            ProtocolCommand.pause: self._worker.handle_pause,
        }
        # TODO: Amit 8/3/2020 - proper schema for command list
        self._commands: typing.List[typing.Any] = []

    @staticmethod
    def create_worker(configuration: SessionConfiguration,
                      protocol: UploadedProtocol,
                      worker_listener: WorkerListener):
        """Create the _Worker instance that will handle commands and notify
        of progress"""
        # Create the protocol runner
        loop = asyncio.get_event_loop()
        protocol_runner = ProtocolRunner(
            protocol=protocol,
            loop=loop,
            hardware=configuration.hardware,
            motion_lock=configuration.motion_lock)
        # The async worker to which all commands are delegated.
        return _Worker(
            protocol_runner=protocol_runner,
            listener=worker_listener,
            loop=loop,)

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
                                 completed_at=timed.end))

    @property
    def commands(self):
        # TODO: Amit 8/3/2020 - proper schema for command list
        return self._commands

    @property
    def current_state(self) -> 'State':
        return self._worker_state

    @current_state.setter
    def current_state(self, state: 'State'):
        log.info(f"New worker state: '{state}'")
        self._worker_state = state

    async def clean_up(self):
        """Called from ProtocolSession upon deletion of Session"""
        await self._worker.close()

    async def on_directive(self, directive: WorkerDirective):
        """"""
        log.debug(f"on_directive: {directive}")
        self._worker_directive = directive

    async def on_ready(self):
        """"""
        log.debug("on_ready")

    async def on_error(self, err):
        """"""
        log.debug(f"on_error: {err}")

    async def on_protocol_event(self, cmd: typing.Any):
        """A protocol event arrived"""
        # These are broker notifications from Session object.
        import threading
        log.info(f"AA {threading.current_thread()}")
        topic = cmd.get('topic')
        if topic == Session.TOPIC:
            payload = cmd.get('payload')
            if isinstance(payload, Session):
                self.current_state = payload.state
            else:
                self.current_state = payload.get('state')
        else:
            # TODO: Amit 8/3/2020 - proper schema for command list
            self._commands.append({
                    'name': cmd.get('name'),
                    'desc': cmd['payload']['text'],
                    'when': cmd.get('$')
            })
