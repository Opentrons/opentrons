"""Protocols for associating async module errors with originating commands."""

from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

from opentrons_shared_data.errors.exceptions import EnumeratedError

from ..commands import Command
from ..commands.command_unions import CommandDefinedErrorData
from ..errors import ErrorOccurrence
from ..types import ModuleModel

if TYPE_CHECKING:
    from ..commands.command_unions import CommandCreate
    from ..resources import ModelUtils
    from ..state.state import StateView


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

    def create_retry(self, command: Command, *, task_id: str) -> CommandCreate | None:
        """Return a new originating command request for a waitForTasks fixit.

        The request must use ``task_id`` so the following waitForTasks can wait
        on the new background task. Return None if this resolver does not own
        ``command``.
        """
        ...
