import asyncio
import functools
from typing import Set, TypeVar, Type, cast, Callable
from .types import ExecutionState, ExecutionCancelledError


class ExecutionManager:
    """This class holds onto a flag that is up/set while the hardware
    hardware controller is running and down/cleared when the hardware
    controller is "paused".

    It also handles loop clean up through its cancel method.
    """

    def __init__(self, loop: asyncio.AbstractEventLoop):
        self._state: ExecutionState = ExecutionState.RUNNING
        self._condition = asyncio.Condition(loop=loop)
        self._loop = loop
        self._cancellable_tasks: Set[asyncio.Task] = set()

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
        task.add_done_callback(lambda t: self._cancellable_tasks.discard(t))
        return task

    async def wait_for_is_running(self):
        async with self._condition:
            if self._state == ExecutionState.PAUSED:
                await self._condition.wait()
                if self._state == ExecutionState.CANCELLED:
                    raise ExecutionCancelledError
            elif self._state == ExecutionState.CANCELLED:
                raise ExecutionCancelledError
            else:
                pass


DecoratedMethod = TypeVar("DecoratedMethod", bound=Callable)
SubclassInstance = TypeVar("SubclassInstance", bound="ExecutionManagerProvider")


class ExecutionManagerProvider:
    """A mixin that provides an execution manager.

    By inheriting from this class, hardware controller APIs can get an
    execution manager and implemented methods that provide access to it.
    """

    def __init__(self, loop: asyncio.AbstractEventLoop, simulator: bool) -> None:
        self._em_simulate = simulator
        self._execution_manager = ExecutionManager(loop=loop)

    @property
    def execution_manager(self) -> ExecutionManager:
        return self._execution_manager

    @classmethod
    def wait_for_running(
        cls: Type[SubclassInstance], decorated: DecoratedMethod
    ) -> DecoratedMethod:
        @functools.wraps(decorated)
        async def replace(inst: SubclassInstance, *args, **kwargs):
            if not inst._em_simulate:
                await inst.execution_manager.wait_for_is_running()
            return await decorated(inst, *args, **kwargs)

        return cast(DecoratedMethod, replace)

    async def do_delay(self, duration_s: float):
        if not self._em_simulate:

            async def sleep_for_seconds(seconds: float):
                await asyncio.sleep(seconds)

            delay_task = self._execution_manager._loop.create_task(
                sleep_for_seconds(duration_s)
            )
            await self._execution_manager.register_cancellable_task(delay_task)
