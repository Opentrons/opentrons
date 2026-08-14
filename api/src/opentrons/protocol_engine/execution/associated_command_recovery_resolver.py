"""Protocols for associating async module errors with originating commands."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Protocol

from opentrons_shared_data.errors.exceptions import EnumeratedError

from ..commands import Command
from ..commands.command import SuccessData
from ..commands.command_unions import CommandDefinedErrorData
from ..errors import ErrorOccurrence
from ..types import ModuleModel

if TYPE_CHECKING:
    from ..resources import ModelUtils
    from ..state.state import StateView
    from .equipment import EquipmentHandler
    from .movement import MovementHandler
    from .task_handler import TaskHandler


class AssociatedCommandRecoveryResolver(Protocol):
    """Map async module errors to defined failures on associated background commands."""

    def can_handle_error(self, error: ErrorOccurrence | EnumeratedError) -> bool:
        """Return whether this resolver knows how to recover from the given error."""
        ...

    def get_command_id_for_async_notification(
        self,
        module_model: ModuleModel,
        module_serial: str | None,
        state_view: StateView,
    ) -> str | None:
        """Return the associated command for a hardware async notification, if any."""
        ...

    def is_associated_command(self, command: Command) -> bool:
        """Return whether the command may be failed retroactively by this resolver."""
        ...

    def to_defined_error_data(
        self,
        error: ErrorOccurrence | EnumeratedError,
        command: Command,
        state_view: StateView,
        model_utils: ModelUtils,
    ) -> CommandDefinedErrorData | None:
        """Map the error to defined command error data for the associated command."""
        ...

    async def restart(
        self,
        command: Command,
        *,
        state_view: StateView,
        task_handler: TaskHandler,
        equipment: EquipmentHandler | None,
        movement: MovementHandler | None,
        model_utils: ModelUtils,
    ) -> str | None:
        """Re-run ``command`` and return the new background task id, if any."""
        ...


async def reexecute_background_start_command(
    impl_cls: type | None,
    command: Command,
    *,
    state_view: StateView,
    task_handler: TaskHandler,
    equipment: EquipmentHandler | None,
    movement: MovementHandler | None,
    model_utils: ModelUtils,
) -> str | None:
    """Construct ``impl_cls``, re-run ``command.params``, and return the new task id."""
    if impl_cls is None or equipment is None or movement is None:
        return None
    impl = impl_cls(
        state_view=state_view,
        task_handler=task_handler,
        equipment=equipment,
        movement=movement,
        model_utils=model_utils,
    )
    result = await impl.execute(_params_for_restart(command))
    if not isinstance(result, SuccessData):
        return None
    task_id = getattr(result.public, "taskId", None)
    return task_id if isinstance(task_id, str) else None


def _params_for_restart(command: Command) -> Any:
    params = command.params
    if getattr(params, "taskId", None) is None:
        return params
    return params.model_copy(update={"taskId": None})
