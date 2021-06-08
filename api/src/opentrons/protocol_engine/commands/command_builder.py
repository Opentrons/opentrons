"""Command resource factory."""
from datetime import datetime
from typing import Optional

from opentrons.protocol_engine.errors import ProtocolEngineError
from .command_unions import CommandRequest, Command
from .base import CommandResultT


class CommandBuilder:
    """Interface to construct command instances."""

    @staticmethod
    def build(
        command_request: CommandRequest,
        command_id: str,
        created_at: datetime,
    ) -> Command:
        """Create a command resource instance."""
        raise NotImplementedError("CommandBuilder not yet implemented")

    @staticmethod
    def to_running(
        command: Command,
        started_at: datetime,
    ) -> Command:
        """Set a command's status and timestamp for running."""
        raise NotImplementedError("CommandBuilder not yet implemented")

    @staticmethod
    def to_completed(
        command: Command,
        result: Optional[CommandResultT],
        error: Optional[ProtocolEngineError],
        completed_at: datetime,
    ) -> Command:
        """Set a command's status and timestamp for executed or failed."""
        raise NotImplementedError("CommandBuilder not yet implemented")
