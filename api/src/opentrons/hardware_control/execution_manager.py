import asyncio
import functools
from typing import Set, TypeVar, Type, cast, Callable, Any, Awaitable, overload
from .types import ExecutionState, ExecutionCancelledError


TaskContents = TypeVar("TaskContents")


class ExecutionManager:
    """This class holds onto a flag that is up/set while the hardware
    hardware controller is running and down/cleared when the hardware
    controller is "paused".

    It also handles loop clean up through its cancel method.
    """

    def __init__(self) -> None:
        self._state: ExecutionState = ExecutionState.RUNNING
        self._condition = asyncio.Condition()
        # this Task would technically be parametrized with every different thing
        # that you could possible call register_cancellable_task on unfortunately
        # so it's not gonna get typechecked
        self._cancellable_tasks: Set["asyncio.Task[Any]"] = set()

    async def pause(self) -> None:
        async with self._condition:
            if self._state is ExecutionState.CANCELLED:
                raise ExecutionCancelledError
            else:
                self._state = ExecutionState.PAUSED

    async def resume(self) -> None:
        async with self._condition:
            if self._state is ExecutionState.CANCELLED:
                pass
            else:
                self._state = ExecutionState.RUNNING
                self._condition.notify_all()

    async def cancel(self) -> None:
        async with self._condition:
            self._state = ExecutionState.CANCELLED
            self._condition.notify_all()
            running_task = asyncio.current_task()
            for t in self._cancellable_tasks:
                if t is not running_task:
                    t.cancel()

    async def reset(self) -> None:
        async with self._condition:
            self._state = ExecutionState.RUNNING
            self._condition.notify_all()

    async def get_state(self) -> ExecutionState:
        async with self._condition:
            return self._state

    def register_cancellable_task(self, task: "asyncio.Task[TaskContents]") -> None:
        self._cancellable_tasks.add(task)
        task.add_done_callback(lambda t: self._cancellable_tasks.discard(t))

    async def wait_for_is_running(self) -> None:
        async with self._condition:
            if self._state == ExecutionState.PAUSED:
                await self._condition.wait()
                if self._state == ExecutionState.CANCELLED:
                    raise ExecutionCancelledError
            elif self._state == ExecutionState.CANCELLED:
                raise ExecutionCancelledError
            else:
                pass


DecoratedReturn = TypeVar("DecoratedReturn")
DecoratedMethodReturningValue = TypeVar(
    "DecoratedMethodReturningValue", bound=Callable[..., Awaitable[DecoratedReturn]]
)
DecoratedMethodNoReturn = TypeVar(
    "DecoratedMethodNoReturn", bound=Callable[..., Awaitable[None]]
)
SubclassInstance = TypeVar("SubclassInstance", bound="ExecutionManagerProvider")


class ExecutionManagerProvider:
    """A mixin that provides an execution manager.

    By inheriting from this class, hardware controller APIs can get an
    execution manager and implemented methods that provide access to it.
    """

    def __init__(self, simulator: bool) -> None:
        self._em_simulate = simulator
        self._execution_manager = ExecutionManager()

    @property
    def execution_manager(self) -> ExecutionManager:
        return self._execution_manager

    @overload
    @classmethod
    def wait_for_running(
        cls: Type[SubclassInstance], decorated: DecoratedMethodReturningValue
    ) -> DecoratedMethodReturningValue:
        ...

    @overload
    @classmethod
    def wait_for_running(
        cls: Type[SubclassInstance], decorated: DecoratedMethodNoReturn
    ) -> DecoratedMethodNoReturn:
        ...

    # this type ignore and the overloads are because mypy requires that a function
    # whose signature declares it returns None not have a return statement, whereas
    # this function's implementation relies on python having None actually be the
    # thing you return, and it's mad at that
    @classmethod  # type: ignore
    def wait_for_running(
        cls: Type[SubclassInstance], decorated: DecoratedMethodReturningValue
    ) -> DecoratedMethodReturningValue:
        @functools.wraps(decorated)
        async def replace(
            inst: SubclassInstance, *args: Any, **kwargs: Any
        ) -> DecoratedReturn:
            if not inst._em_simulate:
                await inst.execution_manager.wait_for_is_running()
            return await decorated(inst, *args, **kwargs)

        return cast(DecoratedMethodReturningValue, replace)

    async def do_delay(self, duration_s: float) -> None:
        if not self._em_simulate:

            async def sleep_for_seconds(seconds: float) -> None:
                await asyncio.sleep(seconds)

            delay_task = asyncio.create_task(sleep_for_seconds(duration_s))
            self._execution_manager.register_cancellable_task(delay_task)
            await delay_task
