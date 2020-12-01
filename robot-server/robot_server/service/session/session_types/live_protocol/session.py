from robot_server.service.session.models import session as models
from robot_server.service.session.command_execution import CommandQueue, \
    CommandExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.session_types import BaseSession, \
    SessionMetaData
from robot_server.service.session.session_types.live_protocol.command_executor import LiveProtocolCommandExecutor    # noqa: E501
from robot_server.service.session.session_types.live_protocol.command_interface import CommandInterface  # noqa: E501
from robot_server.service.session.session_types.live_protocol.state_store import StateStore  # noqa: E501


class LiveProtocolSession(BaseSession):

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData):
        """Constructor"""
        super(self.__class__, self).__init__(configuration, instance_meta)

        state_store = StateStore()
        command_interface = CommandInterface(
            hardware=configuration.hardware,
            state_store=state_store
        )
        self._executor = LiveProtocolCommandExecutor(
            command_interface=command_interface,
            state_store=state_store
        )

    @property
    def command_executor(self) -> CommandExecutor:
        return self._executor

    @property
    def command_queue(self) -> CommandQueue:
        pass

    @property
    def session_type(self) -> models.SessionType:
        return models.SessionType.live_protocol

    def get_response_model(self) -> models.LiveProtocolResponseAttributes:
        return models.LiveProtocolResponseAttributes(
            id=self.meta.identifier,
            createdAt=self.meta.created_at,
            createParams=self.meta.create_params,
            details=EmptyModel()
        )
