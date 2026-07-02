"""Orchestrate associated-command recovery for background module task failures."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Sequence

from opentrons_shared_data.errors.exceptions import EnumeratedError

from ..actions import Action, FinishTaskAction
from ..actions.action_handler import ActionHandler
from ..commands.vacuum_module.recovery import (
    VacuumModuleAssociatedCommandRecoveryResolver,
)
from ..error_recovery_policy import ErrorRecoveryType
from ..errors import ErrorOccurrence
from ..resources import ModelUtils
from ..types import ModuleModel
from .associated_command_recovery_resolver import AssociatedCommandRecoveryResolver
from .defined_error_failure import (
    dispatch_fail_command_for_defined_error,
    get_error_recovery_type_for_defined_error,
)

if TYPE_CHECKING:
    from ..actions import ActionDispatcher
    from ..state.state import StateStore

log = logging.getLogger(__name__)


def default_associated_command_recovery_resolvers() -> list[
    AssociatedCommandRecoveryResolver
]:
    """Return the default set of module associated-command recovery resolvers."""
    return [VacuumModuleAssociatedCommandRecoveryResolver()]


class AssociatedCommandErrorRecoveryOrchestrator(ActionHandler):
    """Fail originating background commands for attributable async module errors."""

    def __init__(
        self,
        state_store: StateStore,
        action_dispatcher: ActionDispatcher,
        resolvers: Sequence[AssociatedCommandRecoveryResolver],
        model_utils: ModelUtils | None = None,
    ) -> None:
        self._state_store = state_store
        self._action_dispatcher = action_dispatcher
        self._resolvers = list(resolvers)
        self._model_utils = model_utils or ModelUtils()

    def handle_action(self, action: Action) -> None:
        """React to task completion by failing an associated background command."""
        if isinstance(action, FinishTaskAction) and action.error is not None:
            self._try_recover_from_task_failure(
                task_id=action.task_id, task_error=action.error
            )

    def try_recover_from_module_error(
        self,
        module_model: ModuleModel,
        module_serial: str | None,
        error: EnumeratedError,
    ) -> bool:
        """Enter command recovery for a recoverable async module notification."""
        for resolver in self._resolvers:
            if not resolver.can_handle_error(error):
                continue
            command_id = resolver.get_command_id_for_async_notification(
                module_model=module_model,
                module_serial=module_serial,
                state_view=self._state_store,
            )
            if command_id is None:
                continue
            if self._try_fail_associated_command(
                resolver=resolver,
                command_id=command_id,
                error=error,
            ):
                return True
        return False

    def _try_recover_from_task_failure(
        self, task_id: str, task_error: ErrorOccurrence
    ) -> None:
        command_id = self._state_store.tasks.get_originating_command_id(task_id)
        if command_id is None:
            return

        for resolver in self._resolvers:
            if not resolver.can_handle_error(task_error):
                continue
            self._try_fail_associated_command(
                resolver=resolver,
                command_id=command_id,
                error=task_error,
            )
            return

    def _try_fail_associated_command(
        self,
        resolver: AssociatedCommandRecoveryResolver,
        command_id: str,
        error: ErrorOccurrence | EnumeratedError,
    ) -> bool:
        if self._state_store.commands.get_is_awaiting_recovery():
            return True
        if self._state_store.commands.get_is_terminal():
            return False

        try:
            associated_command = self._state_store.commands.get(command_id)
        except Exception:
            log.warning(
                "Could not look up associated command %s for recovery",
                command_id,
                exc_info=True,
            )
            return False

        if not resolver.is_associated_command(associated_command):
            return False

        defined_error = resolver.to_defined_error_data(
            error=error,
            command=associated_command,
            state_view=self._state_store,
            model_utils=self._model_utils,
        )
        if defined_error is None:
            return False

        error_recovery_type = get_error_recovery_type_for_defined_error(
            state_store=self._state_store,
            running_command=associated_command,
            defined_error=defined_error,
        )
        if error_recovery_type != ErrorRecoveryType.WAIT_FOR_RECOVERY:
            return False

        dispatch_fail_command_for_defined_error(
            action_dispatcher=self._action_dispatcher,
            state_store=self._state_store,
            command_id=command_id,
            running_command=associated_command,
            defined_error=defined_error,
            error_recovery_type=error_recovery_type,
        )
        return True
