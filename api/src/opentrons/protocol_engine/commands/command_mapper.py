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
        # NOTE(mc, 2021-06-22): mypy has trouble with this automatic
        # request > command routing, but behavior is covered by unit tests
        return request._CommandCls(
            id=command_id,
            createdAt=created_at,
            status=CommandStatus.QUEUED,
            data=request.data,  # type: ignore[arg-type]
        )

    @staticmethod
    def update_command(command: Command, **update: Any) -> Command:
        """Map a Command to a new Command instance with a different status."""
        return command.copy(update=update)
