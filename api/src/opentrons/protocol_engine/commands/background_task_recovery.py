"""Recovery helpers for background tasks waited on by waitForTasks."""

from __future__ import annotations

from typing import TYPE_CHECKING, Sequence

from ..types import FinishedTask
from .command import CommandIntent

if TYPE_CHECKING:
    from ..execution import EquipmentHandler, MovementHandler, TaskHandler
    from ..execution.associated_command_recovery_resolver import (
        AssociatedCommandRecoveryResolver,
    )
    from ..resources import ModelUtils
    from ..state.state import StateView
    from .command_unions import Command, CommandDefinedErrorData


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


async def restart_originating_background_tasks(
    failed_task_ids: Sequence[str],
    state_view: StateView,
    resolvers: Sequence[AssociatedCommandRecoveryResolver],
    task_handler: TaskHandler,
    equipment: EquipmentHandler | None,
    movement: MovementHandler | None,
    model_utils: ModelUtils,
) -> list[str]:
    """Ask resolvers to re-run each unique originating command.

    Returns new task ids, or an empty list if any origin cannot be restarted.
    """
    origins = _background_commands_to_restart(failed_task_ids, state_view)
    new_task_ids: list[str] = []
    for command in origins:
        restarted_task_id = await _restart_command(
            command,
            resolvers,
            state_view=state_view,
            task_handler=task_handler,
            equipment=equipment,
            movement=movement,
            model_utils=model_utils,
        )
        if restarted_task_id is None:
            return []
        new_task_ids.append(restarted_task_id)
    return new_task_ids


async def _restart_command(
    command: Command,
    resolvers: Sequence[AssociatedCommandRecoveryResolver],
    *,
    state_view: StateView,
    task_handler: TaskHandler,
    equipment: EquipmentHandler | None,
    movement: MovementHandler | None,
    model_utils: ModelUtils,
) -> str | None:
    for resolver in resolvers:
        if not resolver.is_associated_command(command):
            continue
        return await resolver.restart(
            command,
            state_view=state_view,
            task_handler=task_handler,
            equipment=equipment,
            movement=movement,
            model_utils=model_utils,
        )
    return None


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
        # Prefer the background command, but still map if a retry attributed the
        # new task to waitForTasks. The error itself is what recovery needs.
        command_for_mapping = originating_command
        if not resolver.is_associated_command(originating_command):
            fallback_id = _associated_origin_for_error(
                originating_command, state_view, resolver
            )
            if fallback_id is not None:
                command_for_mapping = state_view.commands.get(fallback_id)
        mapped = resolver.to_defined_error_data(
            error=finished.error,
            command=command_for_mapping,
            state_view=state_view,
            model_utils=model_utils,
        )
        if mapped is not None:
            return mapped
    return None


def _associated_origin_for_error(
    originating_command: Command,
    state_view: StateView,
    resolver: AssociatedCommandRecoveryResolver,
) -> str | None:
    """If origin is waitForTasks, recover the background command it was waiting on."""
    for command in _background_commands_to_restart(
        _waited_task_ids(originating_command), state_view
    ):
        if resolver.is_associated_command(command):
            return command.id
    return None


def _background_commands_to_restart(
    failed_task_ids: Sequence[str], state_view: StateView
) -> list[Command]:
    """Walk from failed tasks to unique background commands.

    A waitForTasks fixit creates new tasks attributed to itself. Those must
    still restart the original background task implementations, not waitForTasks.
    """
    seen_origin_ids: set[str] = set()
    commands: list[Command] = []
    pending = list(failed_task_ids)
    while pending:
        task_id = pending.pop()
        origin_id = state_view.tasks.get_originating_command_id(task_id)
        if origin_id is None or origin_id in seen_origin_ids:
            continue
        seen_origin_ids.add(origin_id)
        command = state_view.commands.get(origin_id)
        if getattr(command, "commandType", None) == "waitForTasks":
            pending.extend(_waited_task_ids(command))
            continue
        commands.append(command)
    return commands


def is_fixit_wait_for_tasks(state_view: StateView) -> bool:
    """Return whether the running command is a waitForTasks fixit retry."""
    running_command = _running_wait_for_tasks(state_view)
    return running_command is not None and running_command.intent == CommandIntent.FIXIT
