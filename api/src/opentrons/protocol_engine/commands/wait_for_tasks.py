"""WaitForTasks command request, result, and implementation models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Sequence, Type, Union

from pydantic import BaseModel, Field
from typing_extensions import Literal

from ..errors import ErrorOccurrence
from ..errors.error_occurrence import ProtocolCommandFailedError
from ..errors.exceptions import TaskFailedError
from ..resources import ModelUtils
from .background_task_recovery import defined_error_from_failed_tasks
from .command import (
    AbstractCommandImpl,
    BaseCommand,
    BaseCommandCreate,
    SuccessData,
)

if TYPE_CHECKING:
    from ..execution import RunControlHandler, TaskHandler
    from ..execution.associated_command_recovery_resolver import (
        AssociatedCommandRecoveryResolver,
    )
    from ..state.state import StateView
    from .command_unions import CommandDefinedErrorData


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


_ExecuteReturn = Union[
    SuccessData[WaitForTasksResult],
    "CommandDefinedErrorData",
]


class WaitForTasksImplementation(
    AbstractCommandImpl[WaitForTasksParams, _ExecuteReturn]
):
    """WaitForTasks command implementation."""

    def __init__(
        self,
        task_handler: TaskHandler,
        run_control: RunControlHandler,
        state_view: StateView,
        model_utils: ModelUtils | None = None,
        resolvers: Sequence[AssociatedCommandRecoveryResolver] | None = None,
        **_unused_dependencies: object,
    ) -> None:
        self._task_handler = task_handler
        self._run_control = run_control
        self._state_view = state_view
        self._model_utils = model_utils or ModelUtils()
        self._resolvers = resolvers

    async def execute(self, params: WaitForTasksParams) -> _ExecuteReturn:
        """Wait for tasks. Recoverable background failures become defined errors."""
        for task_id in params.task_ids:
            _ = self._state_view.tasks.get(task_id)

        await self._run_control.wait_for_tasks(params.task_ids)

        failed_tasks = self._state_view.tasks.get_failed_tasks(params.task_ids)
        if not failed_tasks:
            return SuccessData(public=WaitForTasksResult(task_ids=params.task_ids))

        # Fail-before-wait race only: start_* already owns recovery, so do not
        # raise a second error. Mixed or uncovered failures still fail the wait.
        if self._state_view.failed_task_failures_absorbed_by_active_recovery(
            params.task_ids
        ):
            return SuccessData(public=WaitForTasksResult(task_ids=params.task_ids))

        defined_error = defined_error_from_failed_tasks(
            failed_tasks,
            self._state_view,
            self._get_resolvers(),
            self._model_utils,
        )
        if defined_error is not None:
            return defined_error

        raise TaskFailedError(
            message=f"{len(failed_tasks)} tasks failed.",
            details={"failed_task_ids": failed_tasks},
            wrapping=[
                ProtocolCommandFailedError(
                    original_error=self._state_view.tasks.get_finished(task_id).error
                )
                for task_id in failed_tasks
            ],
        )

    def _get_resolvers(self) -> Sequence[AssociatedCommandRecoveryResolver]:
        if self._resolvers is None:
            from ..execution.associated_command_error_recovery import (
                default_associated_command_recovery_resolvers,
            )

            self._resolvers = default_associated_command_recovery_resolvers()
        return self._resolvers


class WaitForTasks(
    BaseCommand[
        WaitForTasksParams,
        WaitForTasksResult,
        ErrorOccurrence,
    ]
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
