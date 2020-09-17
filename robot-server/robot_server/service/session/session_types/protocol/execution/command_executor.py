import asyncio
import logging
import typing

from opentrons.util.helpers import deep_get, utc_now

if typing.TYPE_CHECKING:
    from opentrons.api.dev_types import State

from opentrons.api import Session

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand, CommandResult
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.session_models.command import (
    ProtocolCommand, CommandDefinitionType)
from robot_server.service.session.session_types.protocol.execution.\
    protocol_runner import ProtocolRunner
from robot_server.service.session.session_types.protocol.execution.worker \
    import _Worker, WorkerListener, WorkerDirective
from robot_server.util import duration
from robot_server.service.session.session_types.protocol import models


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
        # We're using Session to manage state so I'm not
        #  adding states. Don't want to start with `None` and `stopped` seems
        #  the most reasonable start state.
        self._worker_state: 'State' = 'stopped'
        self._worker = self.create_worker(configuration, protocol, self)
        self._handlers: typing.Dict[CommandDefinitionType, typing.Any] = {
            ProtocolCommand.start_run: self._worker.handle_run,
            ProtocolCommand.start_simulate: self._worker.handle_simulate,
            ProtocolCommand.cancel: self._worker.handle_cancel,
            ProtocolCommand.resume: self._worker.handle_resume,
            ProtocolCommand.pause: self._worker.handle_pause,
        }
        self._events: typing.List[models.ProtocolSessionEvent] = []
        self._id_maker = IdMaker()

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
            hardware=configuration.hardware.sync,
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
                f"Can't execute '{command_def}' during "
                f"state '{self.current_state}'")

        handler = self._handlers.get(command_def)
        if not handler:
            raise UnsupportedCommandException(
                f"Command '{command_def}' is not supported."
            )

        with duration() as timed:
            await handler()

        self._events.append(
            models.ProtocolSessionEvent(
                source=models.EventSource.session_command,
                event=command.content.name,
                commandId=command.meta.identifier,
                timestamp=timed.end,
            )
        )

        return CompletedCommand(
            content=command.content,
            meta=command.meta,
            result=CommandResult(started_at=timed.start,
                                 completed_at=timed.end))

    @property
    def events(self) -> typing.List[models.ProtocolSessionEvent]:
        return self._events

    @property
    def current_state(self) -> 'State':
        return self._worker_state

    @current_state.setter
    def current_state(self, state: 'State'):
        log.info(f"New state: '{state}'")
        self._worker_state = state

    async def clean_up(self):
        """Called from ProtocolSession upon deletion of Session"""
        await self._worker.close()

    async def on_directive(self, directive: WorkerDirective):
        """worker listener callback"""
        log.info(f"on_directive: {directive}")

    async def on_ready(self):
        """worker listener callback"""
        log.info("on_ready")

    async def on_error(self, err):
        """worker listener callback"""
        log.info(f"on_error: {err}")
        # TODO Amit 08/10/2020 Store err as part of ProtocolSession response
        #  schema.
        self.current_state = "error"

    async def on_protocol_event(self, cmd: typing.Any):
        """worker listener callback"""
        # These are broker notifications from Session object.
        topic = cmd.get('topic')
        if topic == Session.TOPIC:
            payload = cmd.get('payload')
            if isinstance(payload, dict):
                self.current_state = payload.get('state')
            elif hasattr(payload, 'state'):
                self.current_state = payload.state
        else:
            dollar_val = cmd.get('$')
            event_name = cmd.get('name')
            event = None
            if dollar_val == 'before':
                # text may be a format string using the payload vals as kwargs
                text = deep_get(cmd, ('payload', 'text',), "")
                if text:
                    text = text.format(**cmd.get('payload', {}))
                event = models.ProtocolSessionEvent(
                    source=models.EventSource.protocol_event,
                    event=f'{event_name}.start',
                    commandId=self._id_maker.create_id(),
                    params={'text': text},
                    timestamp=utc_now(),
                )
            elif dollar_val == 'after':
                result = deep_get(cmd, ('payload', 'return',))
                event = models.ProtocolSessionEvent(
                    source=models.EventSource.protocol_event,
                    event=f'{event_name}.end',
                    commandId=self._id_maker.use_last_id(),
                    timestamp=utc_now(),
                    result=result,
                )

            if event:
                self._events.append(event)


class IdMaker:
    """Helper to create ids for pairs of before/after command pairs"""

    def __init__(self):
        """Constructor"""
        self._id_stack: typing.List[str] = []
        self._next_id = 1

    def create_id(self) -> str:
        """Create a new id on the stack"""
        s = str(self._next_id)
        self._id_stack.append(s)
        self._next_id += 1
        return s

    def use_last_id(self) -> str:
        """Use the the most recently created id"""
        return self._id_stack.pop()
