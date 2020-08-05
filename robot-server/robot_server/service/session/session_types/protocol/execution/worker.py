import asyncio
import logging
import threading
from enum import Enum, auto

from robot_server.service.session.session_types.protocol.\
    execution.protocol_runner import CancelledException, ProtocolRunner
from robot_server.service.session.session_types.protocol.models import \
    ProtocolSessionState

log = logging.getLogger(__name__)


class WorkerDirective(int, Enum):
    """Direction for the worker task"""
    none = auto()
    # End the task. This is used for cleanup.
    terminate = auto()
    # Start a protocol simulation
    start_simulate = auto()
    # Start a protocol run
    start_run = auto()


class ProtocolFlowDirective(int, Enum):
    """A directive checked during protocol execution steps."""
    none = auto()
    # Continue running (not currently in use)
    run = auto()
    # Stop the execution (ie cancel)
    stop = auto()
    # Resume running for one step
    single_step = auto()


class _Worker:
    """
    A private class used by ProtocolCommandExecutor to handle protocol session
     commands. It manages a ProtocolRunner's behavior in an asyncio task.
    """
    def __init__(self,
                 protocol_runner: ProtocolRunner,
                 loop: asyncio.AbstractEventLoop):
        """Constructor the command handling worker"""
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
        self._worker_command = ProtocolFlowDirective.none
        self._pause_event = threading.Event()
        self._pause_event.set()

    async def handle_run(self):
        """Begin running the protocol"""
        await self.set_command(WorkerDirective.start_run)

    async def handle_simulate(self):
        """Begin a simulation"""
        await self.set_command(WorkerDirective.start_simulate)

    async def handle_cancel(self):
        """Cancel a running protocol"""
        self._worker_command = ProtocolFlowDirective.stop
        self._pause_event.set()

    async def handle_resume(self):
        """Resume running or simulation"""
        self._pause_event.set()

    async def handle_pause(self):
        """Pause the currently running or simulating protocol"""
        self._pause_event.clear()

    async def handle_single_step(self):
        """Take a single step in a running or simulating protocol"""
        self._worker_command = ProtocolFlowDirective.single_step
        self._pause_event.set()

    async def handle_finish(self):
        """Cancel current run and terminate worker task"""
        # Kill the command task
        await self.set_command(WorkerDirective.terminate)
        # And the worker thread
        self._worker_command = ProtocolFlowDirective.stop
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

    async def set_command(self, comm: WorkerDirective):
        """Enqueue a command for the worker"""
        await self._async_command_queue.put(comm)

    async def _runner_task(self):
        """Entry point for protocol running task"""
        self.set_current_state(ProtocolSessionState.simulating)

        await self._loop.run_in_executor(None, self._protocol_runner.load)

        while True:
            self.set_current_state(ProtocolSessionState.ready)

            log.debug(f"Waiting for command: {self._state}")
            async_command = await self._async_command_queue.get()

            log.info(f"Got run command: {async_command.name}")
            if async_command == WorkerDirective.terminate:
                break
            if async_command == WorkerDirective.start_run:
                self.set_current_state(ProtocolSessionState.running)
                await self._loop.run_in_executor(
                    None,
                    self._protocol_runner.run)
            if async_command == WorkerDirective.start_simulate:
                self.set_current_state(ProtocolSessionState.simulating)
                await self._loop.run_in_executor(
                    None,
                    self._protocol_runner.simulate)

        # Done.
        self.set_current_state(ProtocolSessionState.exited)

    def _on_command(self, msg):
        """ProtocolRunner command listener"""
        self._check_flow()

    def _check_flow(self):
        """Called from ProtocolRunner to check for changes in run flow"""
        if not self._pause_event.is_set():
            # Need to pause. Collect prior state for after the pause.
            previous_state = self.current_state
            self._loop.call_soon_threadsafe(self.set_current_state,
                                            ProtocolSessionState.paused)
            # Wait on pause event
            self._pause_event.wait()
            # Resume to previous state
            self._loop.call_soon_threadsafe(self.set_current_state,
                                            previous_state)

        if self._worker_command == ProtocolFlowDirective.single_step:
            self._pause_event.clear()
        elif self._worker_command == ProtocolFlowDirective.stop:
            raise CancelledException()
