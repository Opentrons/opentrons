"""Recovery helpers for background tasks waited on by waitForTasks."""

from __future__ import annotations

from typing import TYPE_CHECKING, Sequence

from ..types import FinishedTask

if TYPE_CHECKING:
    from ..commands.command_unions import (
        Command,
        CommandCreate,
        CommandDefinedErrorData,
    )
    from ..execution.associated_command_recovery_resolver import (
        AssociatedCommandRecoveryResolver,
    )
    from ..resources import ModelUtils
    from ..state.state import StateView


def running_wait_for_tasks_covers_task(state_view: StateView, task_id: str) -> bool:
    """Return whether the running command is a waitForTasks that includes ``task_id``."""
    running_command = _running_wait_for_tasks(state_view)
    if running_command is None:
        return False
    return task_id in _waited_task_ids(running_command)


def running_wait_for_tasks_covers_command(
    state_view: StateView, command_id: str
) -> bool:
    """Return whether a running waitForTasks can still observe a failure of ``command_id``.

    Wait owns recovery only while it can still fail: the originating task is
    still running, or has already failed.
    """
    running_command = _running_wait_for_tasks(state_view)
    if running_command is None:
        return False
    return any(
        state_view.tasks.get_originating_command_id(task_id) == command_id
        and _wait_can_observe_task_failure(state_view, task_id)
        for task_id in _waited_task_ids(running_command)
    )


def defined_error_from_failed_tasks(
    failed_task_ids: Sequence[str],
    state_view: StateView,
    resolvers: Sequence[AssociatedCommandRecoveryResolver],
    model_utils: ModelUtils,
) -> CommandDefinedErrorData | None:
    """Map failed waited-on tasks to defined error data via recovery resolvers.

    Returns the first mapped error when every failed task is handled by some
    resolver. Returns None if any failure is unhandled so waitForTasks can
    raise TaskFailedError.
    """
    mapped: CommandDefinedErrorData | None = None
    for task_id in failed_task_ids:
        this_mapped = _map_failed_task(task_id, state_view, resolvers, model_utils)
        if this_mapped is None:
            return None
        if mapped is None:
            mapped = this_mapped
    return mapped


def expand_wait_for_tasks_fixit(
    task_ids: Sequence[str],
    state_view: StateView,
    resolvers: Sequence[AssociatedCommandRecoveryResolver],
    model_utils: ModelUtils,
) -> tuple[list[CommandCreate], list[str]] | None:
    """Queue-time expansion for a waitForTasks fixit.

    When the wait is retrying recoverable background failures, return new
    originating command requests plus rewritten ``task_ids``. The caller must
    queue those requests first so the new start_* commands run before wait.

    Returns None when the wait should be queued unchanged.
    """
    failed_task_ids = state_view.tasks.get_failed_tasks(list(task_ids))
    if not failed_task_ids:
        return None
    if (
        defined_error_from_failed_tasks(
            failed_task_ids, state_view, resolvers, model_utils
        )
        is None
    ):
        return None

    origin_to_new_task: dict[str, str] = {}
    creates: list[CommandCreate] = []
    for task_id in failed_task_ids:
        origin_id = state_view.tasks.get_originating_command_id(task_id)
        if origin_id is None:
            return None
        if origin_id in origin_to_new_task:
            continue
        command = state_view.commands.get(origin_id)
        new_task_id = model_utils.generate_id()
        create = _create_retry(command, new_task_id, resolvers)
        if create is None:
            return None
        origin_to_new_task[origin_id] = new_task_id
        creates.append(create)

    rewritten_task_ids = [
        _rewritten_task_id(task_id, failed_task_ids, state_view, origin_to_new_task)
        for task_id in task_ids
    ]
    return creates, rewritten_task_ids


def _create_retry(
    command: Command,
    task_id: str,
    resolvers: Sequence[AssociatedCommandRecoveryResolver],
) -> CommandCreate | None:
    for resolver in resolvers:
        create = resolver.create_retry(command, task_id=task_id)
        if create is not None:
            return create
    return None


def _rewritten_task_id(
    task_id: str,
    failed_task_ids: Sequence[str],
    state_view: StateView,
    origin_to_new_task: dict[str, str],
) -> str:
    if task_id not in failed_task_ids:
        return task_id
    origin_id = state_view.tasks.get_originating_command_id(task_id)
    if origin_id is None:
        return task_id
    return origin_to_new_task.get(origin_id, task_id)


def _running_wait_for_tasks(state_view: StateView) -> Command | None:
    running_command_id = state_view.commands.get_running_command_id()
    if running_command_id is None:
        return None
    running_command = state_view.commands.get(running_command_id)
    if running_command.commandType != "waitForTasks":
        return None
    return running_command


def _waited_task_ids(command: Command) -> list[str]:
    task_ids = getattr(command.params, "task_ids", None)
    if not isinstance(task_ids, list):
        return []
    return [task_id for task_id in task_ids if isinstance(task_id, str)]


def _wait_can_observe_task_failure(state_view: StateView, task_id: str) -> bool:
    """Return whether waitForTasks will still see a failure for ``task_id``."""
    try:
        task = state_view.tasks.get(task_id)
    except Exception:
        return False
    if isinstance(task, FinishedTask):
        return task.error is not None
    return True


def _map_failed_task(
    task_id: str,
    state_view: StateView,
    resolvers: Sequence[AssociatedCommandRecoveryResolver],
    model_utils: ModelUtils,
) -> CommandDefinedErrorData | None:
    finished = state_view.tasks.get_finished(task_id)
    if finished.error is None:
        return None
    origin_id = state_view.tasks.get_originating_command_id(task_id)
    if origin_id is None:
        return None
    originating_command = state_view.commands.get(origin_id)
    for resolver in resolvers:
        if not resolver.can_handle_error(finished.error):
            continue
        if not resolver.is_associated_command(originating_command):
            continue
        mapped = resolver.to_defined_error_data(
            error=finished.error,
            command=originating_command,
            state_view=state_view,
            model_utils=model_utils,
        )
        if mapped is not None:
            return mapped
    return None
