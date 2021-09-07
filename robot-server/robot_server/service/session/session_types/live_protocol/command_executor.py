import logging

from opentrons.protocol_engine import ProtocolEngine

from robot_server.service.session.command_execution import (
    CommandExecutor,
    Command,
    CompletedCommand,
)

log = logging.getLogger(__name__)


class LiveProtocolCommandExecutor(CommandExecutor):
    def __init__(self, protocol_engine: ProtocolEngine):
        self._protocol_engine = protocol_engine

    async def execute(self, command: Command) -> CompletedCommand:
        """Execute a live protocol command."""
        raise NotImplementedError(
            "Enable useProtocolEngine feature flag to use live HTTP protocols"
        )
