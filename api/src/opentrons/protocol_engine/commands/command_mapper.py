"""Map command request and model types to other values."""
from datetime import datetime
from typing import Any

from .command import CommandStatus
from .command_unions import Command, CommandRequest


class CommandMapper:
    """Static methods to map and modify command models."""

    @staticmethod
    def map_request_to_command(
        request: CommandRequest,
        command_id: str,
        created_at: datetime,
    ) -> Command:
        """Map a CommandRequest instance to a full command."""
        # TODO(mc, 2021-06-22): mypy has trouble with this automatic
        # request > command mapping, figure out how to type precisely
        # (or wait for a future mypy version that can figure it out).
        # For now, unit tests cover mapping every request type
        return request._CommandCls(
            id=command_id,
            createdAt=created_at,
            status=CommandStatus.QUEUED,
            data=request.data,  # type: ignore[arg-type]
        )

    @staticmethod
    def update_command(command: Command, **update: Any) -> Command:
        """Map a Command to a new Command instance with updated field values.

        This is a thin wrapper around `BaseModel.copy`, but it ensures that
        all updates to commands happen immutably.
        """
        return command.copy(update=update)
