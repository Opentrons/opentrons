from robot_server.service.session import models
from robot_server.service.session.command_execution import CommandQueue, \
    CommandExecutor
from robot_server.service.session.session_types import BaseSession


class LiveProtocolSession(BaseSession):

    @property
    def command_executor(self) -> CommandExecutor:
        pass

    @property
    def command_queue(self) -> CommandQueue:
        pass

    @property
    def session_type(self) -> models.SessionType:
        return models.SessionType.live_protocol

    def _get_response_details(self) -> models.SessionDetails:
        pass