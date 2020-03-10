import asyncio
from typing import Set
from contextlib import asynccontextmanager
from .types import ExecutionState, ExecutionCancelledError


class ExecutionManager():
    """ This class holds onto a flag that is up/set while the hardware
    hardware controller is running and down/cleared when the hardware
    controller is "paused".

    It also handles loop clean up through its cancel method.
    """
    def __init__(self, loop: asyncio.AbstractEventLoop):
        self._state: ExecutionState = ExecutionState.RUNNING
        self._condition = asyncio.Condition(loop=loop)
        self._loop = loop
        self._cancellable_tasks: Set[asyncio.Task]= set()

    async def pause(self):
        async with self._condition:
            if self._state is ExecutionState.CANCELLED:
                raise ExecutionCancelledError
            else:
                self._state = ExecutionState.PAUSED

    async def resume(self):
        async with self._condition:
            if self._state is ExecutionState.CANCELLED:
                pass
            else:
                self._state = ExecutionState.RUNNING
                self._condition.notify_all()

    async def cancel(self):
        async with self._condition:
            self._state = ExecutionState.CANCELLED
            self._condition.notify_all()
            running_task = asyncio.current_task(self._loop)
            for t in self._cancellable_tasks:
                if t is not running_task:
                    t.cancel()

    async def reset(self):
        async with self._condition:
            self._state = ExecutionState.RUNNING
            self._condition.notify_all()

    async def get_state(self) -> ExecutionState:
        async with self._condition:
            return self._state

    def register_cancellable_task(self, task: asyncio.Task):
        self._cancellable_tasks.add(task)
        task.add_done_callback(lambda: self._cancellable_tasks.discard(task))
        return task

    async def wait_for_is_running(self):
        async with self._condition:
            if self._state is ExecutionState.PAUSED:
                await self._condition.wait()
                if self._state is ExecutionState.CANCELLED:
                    raise ExecutionCancelledError
            elif self._state is ExecutionState.CANCELLED:
                raise ExecutionCancelledError
            else:
                pass
