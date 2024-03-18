import asyncio
import functools
from typing import (
    Set,
    TypeVar,
    Type,
    cast,
    Callable,
    Any,
    Coroutine,
    ParamSpec,
    Concatenate,
)
from .types import ExecutionState
from opentrons_shared_data.errors.exceptions import ExecutionCancelledError

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
                # type-ignore needed because this is a reentrant function and narrowing cannot
                # apply
                if self._state == ExecutionState.CANCELLED:  # type: ignore[comparison-overlap]
                    raise ExecutionCancelledError
            elif self._state == ExecutionState.CANCELLED:
                raise ExecutionCancelledError
            else:
                pass


SubclassInstance = TypeVar("SubclassInstance", bound="ExecutionManagerProvider")
DecoratedMethodParams = ParamSpec("DecoratedMethodParams")
DecoratedReturn = TypeVar("DecoratedReturn")


class ExecutionManagerProvider:
    """A mixin that provides an execution manager.

    By inheriting from this class, hardware controller APIs can get an
    execution manager and implemented methods that provide access to it.
    """

    def __init__(self, simulator: bool) -> None:
        self._em_simulate = simulator
        self._execution_manager = ExecutionManager()
        self._taskify_movement_execution: bool = False

    @property
    def taskify_movement_execution(self) -> bool:
        return self._taskify_movement_execution

    @taskify_movement_execution.setter
    def taskify_movement_execution(self, cancellable: bool) -> None:
        self._taskify_movement_execution = cancellable

    @property
    def execution_manager(self) -> ExecutionManager:
        return self._execution_manager

    @classmethod
    def wait_for_running(
        cls: Type["ExecutionManagerProvider"],
        decorated: Callable[
            Concatenate[SubclassInstance, DecoratedMethodParams],
            Coroutine[Any, Any, DecoratedReturn],
        ],
    ) -> Callable[
        Concatenate[SubclassInstance, DecoratedMethodParams],
        Coroutine[Any, Any, DecoratedReturn],
    ]:
        @functools.wraps(decorated)
        async def replace(
            inst: SubclassInstance,
            *args: DecoratedMethodParams.args,
            **kwargs: DecoratedMethodParams.kwargs,
        ) -> DecoratedReturn:
            if not inst._em_simulate:
                await inst.execution_manager.wait_for_is_running()
            if inst.taskify_movement_execution:
                # Running these functions inside cancellable tasks makes it easier and
                # faster to cancel protocol runs. In the higher, runner & engine layers,
                # a cancellation request triggers cancellation of the running move task
                # and hence, prevents any further communication with hardware.
                decorated_task: "asyncio.Task[DecoratedReturn]" = asyncio.create_task(
                    decorated(inst, *args, **kwargs)
                )
                inst.execution_manager.register_cancellable_task(decorated_task)
                return await decorated_task
            else:
                return await decorated(inst, *args, **kwargs)

        return cast(
            Callable[
                Concatenate[SubclassInstance, DecoratedMethodParams],
                Coroutine[Any, Any, DecoratedReturn],
            ],
            replace,
        )

    async def do_delay(self, duration_s: float) -> None:
        if not self._em_simulate:

            async def sleep_for_seconds(seconds: float) -> None:
                await asyncio.sleep(seconds)

            delay_task = asyncio.create_task(sleep_for_seconds(duration_s))
            self._execution_manager.register_cancellable_task(delay_task)
            await delay_task
