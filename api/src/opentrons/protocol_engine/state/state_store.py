"""
Protocol engine StateStore class

Reacts to command requests and command responses to update the protocol engine
state reactively.
"""
from datetime import datetime
from logging import getLogger
from typing import Optional

from ..command_models import CommandRequest, CommandResponse, Command
from .base import ReactiveCommandState
from .command_state import CommandState


log = getLogger(__name__)


class StateStore(ReactiveCommandState):
    def __init__(self):
        self._commands = CommandState()

    def handle_command_request(
        self,
        uid: str,
        created_at: datetime,
        request: CommandRequest,
    ) -> None:
        self._commands.handle_command_request(uid, created_at, request)

    def handle_command_start(self, uid: str, started_at: datetime) -> None:
        self._commands.handle_command_start(uid, started_at)

    def handle_command_result(
        self,
        uid: str,
        completed_at: datetime,
        response: CommandResponse
    ) -> None:
        self._commands.handle_command_result(uid, completed_at, response)

    def get_command_by_id(self, uid: str) -> Optional[Command]:
        return self._commands.commands_by_id.get(uid)
