import asyncio
import threading
import logging
import typing
from enum import Enum, auto

from opentrons import ThreadManager
from opentrons.hardware_control import ThreadedAsyncLock

from robot_server.service.protocol.protocol import UploadedProtocol
from robot_server.service.session.command_execution import CommandExecutor, \
    Command, CompletedCommand, CommandResult
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.models import ProtocolCommand, CommandDefinitionType
from robot_server.service.session.session_types.protcol.models import \
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
            ProtocolCommand.start_simulate,
            ProtocolCommand.single_step
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
        self._worker = Worker(protocol,
                              asyncio.get_event_loop(),
                              configuration.hardware,
                              configuration.motion_lock,
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
        """Command"""
        if command not in self.STATE_COMMAND_MAP.get(self.current_state, {}):
            raise UnsupportedCommandException(
                f"Can't do {command} during self.{self.current_state}")

        handler = self._handlers.get(command.content.name)
        if not handler:
            raise UnsupportedCommandException(
                f"Command '{command.content.name}' is not supported."
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
                 protocol: UploadedProtocol,
                 loop: asyncio.AbstractEventLoop,
                 hardware: ThreadManager,
                 motion_lock: ThreadedAsyncLock,
                 ):
        self._protocol = protocol
        self._loop = loop
        self._hardware = hardware
        self._motion_lock = motion_lock

        # Log of all commands executed
        self._commands = []

        # For passing AsyncCommand from main to worker task
        self._run_queue = asyncio.Queue(maxsize=1)

        # State of the worker. Only modified on main thread
        self._state = ProtocolSessionState.idle

        # Protocol running AsyncCommand handling task
        self._run_t = self._loop.create_task(self._runner_task())

        # Worker thread command (modified on main thread only)
        self._worker_command = WorkerCommand.none

        # Pause event
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
        await self._run_t

    @property
    def current_state(self) -> ProtocolSessionState:
        return self._state

    def set_current_state(self, state: ProtocolSessionState):
        log.debug(f"Set state to '{state}'")
        self._state = state

    async def set_command(self, comm: AsyncCommand):
        await self._run_queue.put(comm)

    def _check_state(self):
        if not self._pause_event.is_set():
            fstate = self.current_state
            self._loop.call_soon_threadsafe(self.set_current_state, ProtocolSessionState.paused)
            self._pause_event.wait()
            self._loop.call_soon_threadsafe(self.set_current_state, fstate)

        if self._worker_command == WorkerCommand.single_step:
            self._pause_event.clear()
        elif self._worker_command == WorkerCommand.stop:
            raise RuntimeError("Stopping")

    async def _runner_task(self):
        """Entry point for protocol running task"""
        self.set_current_state(ProtocolSessionState.preparing)

        await self._loop.run_in_executor(None, self.load_things, 4)
        self.set_current_state(ProtocolSessionState.simulating)

        # await loop.run_in_executor(None, self.do_something, 3)
        self.set_current_state(ProtocolSessionState.ready)

        while True:
            log.debug(f"Waiting for command: {self._state}")
            async_command = await self._run_queue.get()
            log.debug(f"Got run command: {async_command}")

            if async_command == AsyncCommand.terminate:
                break
            if async_command == AsyncCommand.start_run:
                self.set_current_state(ProtocolSessionState.running)
                await self._loop.run_in_executor(None, self.do_something, 20)
            if async_command == AsyncCommand.start_simulate:
                self.set_current_state(ProtocolSessionState.simulating)
                await self._loop.run_in_executor(None, self.do_something, 5)

        # Done.
        self.set_current_state(ProtocolSessionState.exited)
