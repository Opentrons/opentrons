"""Vacuum module associated-command error recovery."""

from __future__ import annotations

from typing import TYPE_CHECKING, get_args

from opentrons_shared_data.errors.exceptions import EnumeratedError

from ...errors import ErrorOccurrence
from ...state import update_types
from ...types import LoadedModule, ModuleModel
from .common import (
    defined_error_data_from_enumerated_error,
    defined_error_data_from_task_error,
    is_recoverable_module_error,
)
from .start_run_profile import StartRunProfileCommandType
from .start_set_vacuum_power import StartSetVacuumPowerCommandType
from .start_set_vacuum_pressure import StartSetVacuumPressureCommandType

VACUUM_BACKGROUND_COMMAND_TYPES: frozenset[str] = frozenset(
    {
        get_args(StartSetVacuumPowerCommandType)[0],
        get_args(StartSetVacuumPressureCommandType)[0],
        get_args(StartRunProfileCommandType)[0],
    }
)

if TYPE_CHECKING:
    from ...commands import Command
    from ...commands.command_unions import CommandDefinedErrorData
    from ...resources import ModelUtils
    from ...state.state import StateView


class VacuumModuleAssociatedCommandRecoveryResolver:
    """Associate vacuum async errors with originating vacuum ``start_*`` commands."""

    def can_handle_error(self, error: ErrorOccurrence | EnumeratedError) -> bool:
        """Return whether the error is a recoverable vacuum module error."""
        return is_recoverable_module_error(error)

    def get_command_id_for_async_notification(
        self,
        module_model: ModuleModel,
        module_serial: str | None,
        state_view: StateView,
    ) -> str | None:
        """Return the last vacuum background command for a late async notification."""
        if not ModuleModel.is_vacuum_module(module_model):
            return None
        if not state_view.modules.get_has_module_probably_matching_hardware_details(
            module_model, module_serial
        ):
            return None

        module_id = _vacuum_module_id_for_serial(module_serial, state_view)
        if module_id is None:
            return None

        return state_view.tasks.get_last_background_command_id(module_id)

    def is_associated_command(self, command: Command) -> bool:
        """Return whether the command is a vacuum background start command."""
        return command.commandType in VACUUM_BACKGROUND_COMMAND_TYPES

    def to_defined_error_data(
        self,
        error: ErrorOccurrence | EnumeratedError,
        command: Command,
        state_view: StateView,
        model_utils: ModelUtils,
    ) -> CommandDefinedErrorData | None:
        """Map a vacuum error to defined error data for the associated command."""
        module_id = getattr(command.params, "moduleId", None)
        state_update_if_false_positive = (
            _vacuum_false_positive_state_update(module_id, state_view)
            if isinstance(module_id, str)
            else update_types.StateUpdate()
        )

        if isinstance(error, EnumeratedError):
            return defined_error_data_from_enumerated_error(
                error,
                model_utils,
                state_update_if_false_positive=state_update_if_false_positive,
            )

        return defined_error_data_from_task_error(
            error,
            model_utils,
            state_update_if_false_positive=state_update_if_false_positive,
        )


def _vacuum_false_positive_state_update(
    module_id: str, state_view: StateView
) -> update_types.StateUpdate:
    substate = state_view.modules.get_vacuum_module_substate(module_id)
    state_update = update_types.StateUpdate()
    state_update.update_vacuum_module_pump_engaged(module_id, substate.pump_engaged)
    return state_update


def _vacuum_module_id_for_serial(
    module_serial: str | None, state_view: StateView
) -> str | None:
    for module in state_view.modules.get_all():
        if not _is_matching_vacuum_module(module, module_serial):
            continue
        return module.id
    return None


def _is_matching_vacuum_module(module: LoadedModule, module_serial: str | None) -> bool:
    if not ModuleModel.is_vacuum_module(module.model):
        return False
    return module_serial is None or module.serialNumber == module_serial
