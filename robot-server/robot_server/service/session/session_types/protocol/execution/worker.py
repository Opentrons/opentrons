import asyncio
import logging
import typing
from enum import Enum, auto

from robot_server.service.session.session_types.protocol.\
    execution.protocol_runner import ProtocolRunner

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


class _Worker:
    """
    A private class used by ProtocolCommandExecutor to handle protocol session
     commands. It manages a ProtocolRunner's behavior in an asyncio task.
    """
    def __init__(self,
                 protocol_runner: ProtocolRunner,
                 listener: 'WorkerListener',
                 loop: asyncio.AbstractEventLoop):
        """Constructor the command handling worker"""
        self._protocol_runner = protocol_runner
        self._protocol_runner.add_listener(self._on_command)
        self._loop = loop
        self._listener = listener
        # For passing AsyncCommand from main to worker task
        self._async_command_queue: asyncio.Queue = asyncio.Queue(maxsize=1)
        # Protocol running AsyncCommand handling task
        self._async_command_task = self._loop.create_task(self._runner_task())

    async def handle_run(self):
        """Begin running the protocol"""
        await self._set_command(WorkerDirective.start_run)

    async def handle_simulate(self):
        """Begin a simulation"""
        await self._set_command(WorkerDirective.start_simulate)

    async def handle_cancel(self):
        """Cancel a running protocol"""
        self._protocol_runner.cancel()

    async def handle_resume(self):
        """Resume running"""
        self._protocol_runner.resume()

    async def handle_pause(self):
        """Pause the currently running protocol"""
        self._protocol_runner.pause()

    async def close(self):
        """Shutdown the worker. Cancel run and terminate worker task"""
        # Kill the command task
        await self._set_command(WorkerDirective.terminate)
        # Kill the protocl
        self._protocol_runner.cancel()
        # Wait for run task to finish
        await self._async_command_task

    async def _set_command(self, comm: WorkerDirective):
        """Enqueue a command for the worker"""
        await self._async_command_queue.put(comm)

    async def _runner_task(self):
        """Entry point for protocol running task"""

        await self._load()

        while True:
            # Notify that we are ready for a command
            await self._listener.on_ready()

            log.debug("Waiting...")
            async_command = await self._async_command_queue.get()

            await self._listener.on_directive(async_command)

            log.info(f"Got directive: {async_command.name}")
            if async_command == WorkerDirective.terminate:
                break
            elif async_command == WorkerDirective.start_run:
                await self._run()
            elif async_command == WorkerDirective.start_simulate:
                await self._simulate()

    async def _load(self):
        """Load the protocol"""
        await self._loop.run_in_executor(None, self._protocol_runner.load)

    async def _simulate(self):
        """Simulate the protocol"""
        await self._loop.run_in_executor(None, self._protocol_runner.simulate)

    async def _run(self):
        """Run the protocol"""
        await self._loop.run_in_executor(None, self._protocol_runner.run)

    def _on_command(self, msg):
        """ProtocolRunner command listener"""
        # Notify command on main thread
        asyncio.run_coroutine_threadsafe(
            self._listener.on_protocol_event(msg),
            self._loop
        )


class WorkerListener:
    async def on_directive(self, directive: 'WorkerDirective'):
        """Called when worker has a new directive"""
        pass

    async def on_ready(self):
        """Called when worker task is ready for a directive"""
        pass

    async def on_error(self, err):
        """Called on an unrecoverable error"""
        pass

    async def on_protocol_event(self, cmd: typing.Any):
        """Called on protocol command"""
        pass
