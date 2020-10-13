"""Base state store interfaces."""
from abc import ABC
from datetime import datetime

from ..command_models import CommandRequest, CommandResponse


class ReactiveCommandState(ABC):
    def handle_command_request(
        self,
        uid: str,
        created_at: datetime,
        request: CommandRequest,
    ) -> None:
        pass

    def handle_command_start(
        self,
        uid: str,
        started_at: datetime,
    ) -> None:
        pass

    def handle_command_result(
        self,
        uid: str,
        completed_at: datetime,
        response: CommandResponse,
    ) -> None:
        pass
