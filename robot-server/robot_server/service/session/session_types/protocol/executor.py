import asyncio
import os
import sys
import threading
import logging
import typing
from enum import Enum, auto

from opentrons.api import Session as ApiProtocolSession
from opentrons.broker import Broker
from opentrons.commands import command_types
from opentrons.hardware_control import ThreadedAsyncLock, ThreadManager

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand, CommandResult
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.models import ProtocolCommand, \
    CommandDefinitionType
from robot_server.service.session.session_types.protocol.models import \
    ProtocolSessionState
from robot_server.util import duration


log = logging.getLogger(__name__)


class ProtocolCommandExecutor(CommandExecutor):

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
        self._protocol = protocol
        # Create the protocol runner
        self._protocol_runner = ProtocolRunner(
            protocol=protocol,
            loop=asyncio.get_event_loop(),
            hardware=configuration.hardware,
            motion_lock=configuration.motion_lock)
        self._protocol_runner.add_listener(self._on_command)
        # The async worker
        self._worker = Worker(
            protocol_runner=self._protocol_runner,
            loop=asyncio.get_event_loop()
        )
        self._handlers = {
            ProtocolCommand.start_run: self._worker.handle_run,
            ProtocolCommand.start_simulate: self._worker.handle_simulate,
            ProtocolCommand.cancel: self._worker.handle_cancel,
            ProtocolCommand.resume: self._worker.handle_resume,
            ProtocolCommand.pause: self._worker.handle_pause,
            ProtocolCommand.single_step: self._worker.handle_single_step,
        }

    async def execute(self, command: Command) -> CompletedCommand:
        """Command processing"""
        command_def = command.content.name
        if command_def not in self.STATE_COMMAND_MAP.get(self.current_state, {}):
            raise UnsupportedCommandException(
                f"Can't do '{command_def}' during self.{self.current_state}")

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
    def current_state(self) -> ProtocolSessionState:
        return self._worker.current_state

    def _on_command(self, msg):
        """Handler for commands executed by protocol runner"""
        log.debug(msg)

    async def clean_up(self):
        await self._worker.handle_finish()


class AsyncCommand(int, Enum):
    """A command for the worker task"""
    none = auto()
    terminate = auto()
    start_simulate = auto()
    start_run = auto()


class WorkerCommand(int, Enum):
    """A command for protocol flow"""
    none = auto()
    run = auto()
    stop = auto()
    single_step = auto()


class Worker:
    def __init__(self,
                 protocol_runner: 'ProtocolRunner',
                 loop: asyncio.AbstractEventLoop,
                 ):
        self._protocol_runner = protocol_runner
        self._protocol_runner.add_listener(self._on_command)
        self._loop = loop
        # State of the worker. Only modified on main thread
        self._state = ProtocolSessionState.idle
        # For passing AsyncCommand from main to worker task
        self._async_command_queue: asyncio.Queue = asyncio.Queue(maxsize=1)
        # Protocol running AsyncCommand handling task
        self._async_command_task = self._loop.create_task(self._runner_task())
        # Worker thread command (modified on main thread only)
        self._worker_command = WorkerCommand.none
        self._pause_event = threading.Event()

    async def handle_run(self):
        await self.set_command(AsyncCommand.start_run)

    async def handle_simulate(self):
        await self.set_command(AsyncCommand.start_simulate)

    async def handle_cancel(self):
        self._worker_command = WorkerCommand.stop
        self._pause_event.set()

    async def handle_resume(self):
        self._pause_event.set()

    async def handle_pause(self):
        self._pause_event.clear()

    async def handle_single_step(self):
        self._worker_command = WorkerCommand.single_step
        self._pause_event.set()

    async def handle_finish(self):
        """Clean up"""
        # Kill the command task
        await self.set_command(AsyncCommand.terminate)
        # And the worker thread
        self._worker_command = WorkerCommand.stop
        # Maker sure to resume
        self._pause_event.set()
        # Wait for run task to finish
        await self._async_command_task

    @property
    def current_state(self) -> ProtocolSessionState:
        return self._state

    def set_current_state(self, state: ProtocolSessionState):
        log.debug(f"Set state to '{state}'")
        self._state = state

    async def set_command(self, comm: AsyncCommand):
        await self._async_command_queue.put(comm)

    async def _runner_task(self):
        """Entry point for protocol running task"""
        self.set_current_state(ProtocolSessionState.simulating)

        await self._loop.run_in_executor(None, self._protocol_runner.load)
        self.set_current_state(ProtocolSessionState.ready)

        while True:
            log.debug(f"Waiting for command: {self._state}")
            async_command = await self._async_command_queue.get()
            log.debug(f"Got run command: {async_command}")

            if async_command == AsyncCommand.terminate:
                break
            if async_command == AsyncCommand.start_run:
                self.set_current_state(ProtocolSessionState.running)
                await self._loop.run_in_executor(None,
                                                 self._protocol_runner.run)
            if async_command == AsyncCommand.start_simulate:
                self.set_current_state(ProtocolSessionState.simulating)
                await self._loop.run_in_executor(None,
                                                 self._protocol_runner.simulate)

        # Done.
        self.set_current_state(ProtocolSessionState.exited)

    def _on_command(self, msg):
        self._check_state()

    def _check_state(self):
        """Called from worker thread"""
        if not self._pause_event.is_set():
            previous_state = self.current_state
            self._loop.call_soon_threadsafe(self.set_current_state,
                                            ProtocolSessionState.paused)
            self._pause_event.wait()
            self._loop.call_soon_threadsafe(self.set_current_state,
                                            previous_state)

        if self._worker_command == WorkerCommand.single_step:
            self._pause_event.clear()
        elif self._worker_command == WorkerCommand.stop:
            raise CancelledException()


class CancelledException(Exception):
    pass


ListenerType = typing.Callable[[typing.Dict], None]


class ProtocolRunner:
    def __init__(self,
                 protocol: UploadedProtocol,
                 loop: asyncio.AbstractEventLoop,
                 hardware: ThreadManager,
                 motion_lock: ThreadedAsyncLock,
                 ):
        """Constructor"""
        self._protocol = protocol
        self._loop = loop
        self._hardware = hardware
        self._motion_lock = motion_lock
        self._session: typing.Optional[ApiProtocolSession] = None
        self._broker = Broker()
        self._broker.subscribe(command_types.COMMAND, self._on_command)
        self._listeners: typing.List[ListenerType] = []

    def add_listener(self, listener: ListenerType):
        self._listeners.append(listener)

    def remove_listener(self, listener: ListenerType):
        self._listeners.remove(listener)

    def _on_command(self, msg):
        for listener in self._listeners:
            listener(msg)

    def load(self):
        with ProtocolRunnerContext(self._protocol):
            self._session = ApiProtocolSession.build_and_prep(
                name=self._protocol.meta.identifier,
                contents=self._protocol.get_contents(),
                hardware=self._hardware,
                loop=self._loop,
                broker=self._broker,
                motion_lock=self._motion_lock,
                extra_labware={}
            )

    def run(self):
        with ProtocolRunnerContext(self._protocol):
            self._session.run()

    def simulate(self):
        with ProtocolRunnerContext(self._protocol):
            self._session.refresh()


class ProtocolRunnerContext:
    def __init__(self, protocol: UploadedProtocol):
        self._protocol = protocol
        self._cwd = None

    def __enter__(self):
        self._cwd = os.getcwd()
        # Change working directory to temp dir
        os.chdir(self._protocol.meta.directory.name)
        # Add temp dir to path
        sys.path.append(self._protocol.meta.directory.name)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Undo working directory and path modifications
        os.chdir(self._cwd)
        sys.path.remove(self._protocol.meta.directory.name)
