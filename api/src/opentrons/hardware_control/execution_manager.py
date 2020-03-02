import asyncio
from typing import Set


class ExecutionManager():
    """ This class holds onto a flag that is up/set while the hardware
    hardware controller is running and down/cleared when the hardware
    controller is "paused".

    It also handles loop clean up through its cancel method.
    """
    def __init__(self, loop: asyncio.AbstractEventLoop):
        self._is_running = asyncio.Event(loop=loop)
        self._is_running.set()
        self._loop = loop

    def pause(self):
        self._is_running.clear()

    def resume(self):
        self._is_running.set()

    def cancel(self, protected_tasks: Set[asyncio.Task] = None):
        self._is_running.clear()
        tasks_to_cancel = [t for t in asyncio.all_tasks(self._loop)
                           if t is not asyncio.current_task(self._loop)
                           and protected_tasks and t not in protected_tasks]
        [task.cancel() for task in tasks_to_cancel]

    @property
    def is_running(self):
        return self._is_running.is_set()

    async def wait_for_is_running(self):
        await self._is_running.wait()
