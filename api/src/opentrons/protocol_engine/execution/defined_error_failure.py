"""Shared helpers for failing commands with defined errors."""

from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from ..actions import (
    ActionDispatcher,
    BeginAwaitingRecoveryAction,
    FailCommandAction,
)
from ..commands import Command
from ..commands.command_unions import CommandDefinedErrorData
from ..error_recovery_policy import ErrorRecoveryType
from ..notes import CommandNote, make_error_recovery_debug_note

if TYPE_CHECKING:
    from ..state.state import StateStore


def get_error_recovery_type_for_defined_error(
    *,
    state_store: StateStore,
    running_command: Command,
    defined_error: CommandDefinedErrorData,
) -> ErrorRecoveryType:
    """Evaluate the error recovery policy for a defined command error."""
    error_recovery_policy = state_store.commands.get_error_recovery_policy()
    return error_recovery_policy(
        state_store.config,
        running_command,
        defined_error,
    )


def dispatch_begin_awaiting_recovery_for_defined_error(
    *,
    action_dispatcher: ActionDispatcher,
    state_store: StateStore,
    command_id: str,
    running_command: Command,
    defined_error: CommandDefinedErrorData,
    notes: Optional[List[CommandNote]] = None,
    error_recovery_type: Optional[ErrorRecoveryType] = None,
) -> ErrorRecoveryType:
    """Enter recovery without failing a command that has already succeeded."""
    if error_recovery_type is None:
        error_recovery_type = get_error_recovery_type_for_defined_error(
            state_store=state_store,
            running_command=running_command,
            defined_error=defined_error,
        )
    action_dispatcher.dispatch(
        BeginAwaitingRecoveryAction(
            error=defined_error,
            command_id=command_id,
            command=running_command,
            error_id=defined_error.public.id,
            failed_at=defined_error.public.createdAt,
            notes=notes or [make_error_recovery_debug_note(error_recovery_type)],
            type=error_recovery_type,
        )
    )
    return error_recovery_type


def dispatch_fail_command_for_defined_error(
    *,
    action_dispatcher: ActionDispatcher,
    state_store: StateStore,
    command_id: str,
    running_command: Command,
    defined_error: CommandDefinedErrorData,
    notes: Optional[List[CommandNote]] = None,
    error_recovery_type: Optional[ErrorRecoveryType] = None,
) -> ErrorRecoveryType:
    """Dispatch ``FailCommandAction`` for a defined error and return the recovery type."""
    if error_recovery_type is None:
        error_recovery_type = get_error_recovery_type_for_defined_error(
            state_store=state_store,
            running_command=running_command,
            defined_error=defined_error,
        )
    action_dispatcher.dispatch(
        FailCommandAction(
            error=defined_error,
            command_id=command_id,
            running_command=running_command,
            error_id=defined_error.public.id,
            failed_at=defined_error.public.createdAt,
            notes=notes or [make_error_recovery_debug_note(error_recovery_type)],
            type=error_recovery_type,
        )
    )
    return error_recovery_type
