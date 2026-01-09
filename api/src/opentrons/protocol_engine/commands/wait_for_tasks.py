"""WaitForTasks command request, result, and implementation models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Type

from pydantic import BaseModel, Field
from typing_extensions import Literal

from ..errors.error_occurrence import ErrorOccurrence, ProtocolCommandFailedError
from ..errors.exceptions import TaskFailedError
from .command import AbstractCommandImpl, BaseCommand, BaseCommandCreate, SuccessData

if TYPE_CHECKING:
    from ..execution import RunControlHandler, TaskHandler
    from ..state.state import StateView


WaitForTasksCommandType = Literal["waitForTasks"]


class WaitForTasksParams(BaseModel):
    """Payload required to annotate execution with a WaitForTasks."""

    task_ids: list[str] = Field(
        ...,
        description="The list of task ids to wait for.",
    )


class WaitForTasksResult(BaseModel):
    """Result data from the execution of a WaitForTasks command."""

    task_ids: list[str] = Field(
        ...,
        description="The list of completed task ids.",
    )


class WaitForTasksImplementation(
    AbstractCommandImpl[WaitForTasksParams, SuccessData[WaitForTasksResult]]
):
    """WaitForTasks command implementation."""

    def __init__(
        self,
        task_handler: TaskHandler,
        run_control: RunControlHandler,
        state_view: StateView,
        **kwargs: object,
    ) -> None:
        self._task_handler = task_handler
        self._run_control = run_control
        self._state_view = state_view

    async def execute(
        self, params: WaitForTasksParams
    ) -> SuccessData[WaitForTasksResult]:
        """Checks for existance of task id and then asynchronously waits for the valid, specified tasks to finish."""
        # Raises the exception if we don't have a valid task id.
        for task_id in params.task_ids:
            _ = self._state_view.tasks.get(task_id)

        await self._run_control.wait_for_tasks(params.task_ids)

        failed_tasks = self._state_view.tasks.get_failed_tasks(params.task_ids)
        if failed_tasks:
            raise TaskFailedError(
                message=f"{len(failed_tasks)} tasks failed.",
                details={"failed_task_ids": failed_tasks},
                wrapping=[
                    ProtocolCommandFailedError(
                        original_error=self._state_view.tasks.get_finished(
                            task_id
                        ).error
                    )
                    for task_id in failed_tasks
                ],
            )
        return SuccessData(public=WaitForTasksResult(task_ids=params.task_ids))


class WaitForTasks(
    BaseCommand[WaitForTasksParams, WaitForTasksResult, ErrorOccurrence]
):
    """WaitForTasks command model."""

    commandType: WaitForTasksCommandType = "waitForTasks"
    params: WaitForTasksParams
    result: Optional[WaitForTasksResult] = None

    _ImplementationCls: Type[WaitForTasksImplementation] = WaitForTasksImplementation


class WaitForTasksCreate(BaseCommandCreate[WaitForTasksParams]):
    """WaitForTasks command request model."""

    commandType: WaitForTasksCommandType = "waitForTasks"
    params: WaitForTasksParams

    _CommandCls: Type[WaitForTasks] = WaitForTasks
