"""CreateTimer command request, result, and implementation models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Type

from pydantic import BaseModel, Field
from typing_extensions import Literal

from ..errors.error_occurrence import ErrorOccurrence
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from ..execution import RunControlHandler, TaskHandler


CreateTimerCommandType = Literal["createTimer"]


class CreateTimerParams(BaseModel):
    """Payload required to annotate execution with a CreateTimer."""

    time: float = Field(
        ...,
        description="The time before the timer should elapse in seconds. This is the minimum time before the timer elapses; it may in practice take longer than this.",
    )
    task_id: str | None = Field(
        None,
        description="The id of the timer task",
    )


class CreateTimerResult(BaseModel):
    """Result data from the execution of a CreateTimer command."""

    task_id: str = Field(..., description="The id of the timer task")
    time: float = Field(..., description="The same time as the parameter.")


class CreateTimerImplementation(
    AbstractCommandImpl[CreateTimerParams, SuccessData[CreateTimerResult]]
):
    """CreateTimer command implementation."""

    def __init__(
        self,
        task_handler: TaskHandler,
        run_control: RunControlHandler,
        **kwargs: object,
    ) -> None:
        self._task_handler = task_handler
        self._run_control = run_control

    async def execute(
        self, params: CreateTimerParams
    ) -> SuccessData[CreateTimerResult]:
        """No operation taken other than capturing message in command."""

        async def timer(task_handler: TaskHandler) -> None:
            async with task_handler.synchronize_concurrent("createTimer"):
                await self._run_control.wait_for_duration(params.time)

        task = await self._task_handler.create_task(timer, params.task_id)
        return SuccessData(
            public=CreateTimerResult(task_id=task.id, time=params.time),
        )


class CreateTimer(BaseCommand[CreateTimerParams, CreateTimerResult, ErrorOccurrence]):
    """CreateTimer command model."""

    commandType: CreateTimerCommandType = "createTimer"
    params: CreateTimerParams
    result: Optional[CreateTimerResult] = None

    _ImplementationCls: Type[CreateTimerImplementation] = CreateTimerImplementation


class CreateTimerCreate(BaseCommandCreate[CreateTimerParams]):
    """CreateTimer command request model."""

    commandType: CreateTimerCommandType = "createTimer"
    params: CreateTimerParams

    _CommandCls: Type[CreateTimer] = CreateTimer
