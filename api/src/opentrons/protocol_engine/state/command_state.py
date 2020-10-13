"""Protocol engine command state."""
from datetime import datetime
from logging import getLogger
from typing import Dict

from .base import ReactiveCommandState
from ..command_models import (
    CommandRequest,
    CommandResponse,
    Command,
    PendingCommand,
    RunningCommand
)


log = getLogger(__name__)


class CommandState(ReactiveCommandState):
    commands_by_id: Dict[str, Command]

    def __init__(self) -> None:
        self.commands_by_id = {}

    def handle_command_request(
        self,
        uid: str,
        created_at: datetime,
        request: CommandRequest,
    ) -> None:
        # ignore type checking rather than do a big if else refinement ladder
        self.commands_by_id[uid] = PendingCommand(  # type: ignore[assignment]
            createdAt=created_at,
            request=request
        )

    def handle_command_start(
        self,
        uid: str,
        started_at: datetime,
    ) -> None:
        cmd = self.commands_by_id.get(uid)

        if (isinstance(cmd, PendingCommand)):
            self.commands_by_id[uid] = cmd.to_running(started_at)
        else:
            status = cmd.status if cmd is not None else "missing"
            log.warning(
                f"Cannot start command {uid} because it is {status}"
            )

    def handle_command_result(
        self,
        uid: str,
        completed_at: datetime,
        result: CommandResponse
    ) -> None:
        cmd = self.commands_by_id.get(uid)

        if (isinstance(cmd, RunningCommand)):
            # TODO(mc, 2020-10-13): ensure response matches request type
            self.commands_by_id[uid] = cmd.to_completed(
                completed_at,
                result  # type: ignore[arg-type]
            )
        else:
            status = cmd.status if cmd is not None else "missing"
            log.warning(
                f"Cannot complete command {uid} because it is {status}"
            )
