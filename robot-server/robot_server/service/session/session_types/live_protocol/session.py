from opentrons.protocol_engine import ProtocolEngine

from robot_server.service.session.models import session as models
from robot_server.service.session.command_execution import CommandQueue, \
    CommandExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.session_types import BaseSession, \
    SessionMetaData
from robot_server.service.session.session_types.live_protocol.command_executor import LiveProtocolCommandExecutor    # noqa: E501


class LiveProtocolSession(BaseSession):

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 protocol_engine: ProtocolEngine):
        """Constructor"""
        super(self.__class__, self).__init__(configuration, instance_meta)

        self._executor = LiveProtocolCommandExecutor(
            protocol_engine=protocol_engine
        )

    @classmethod
    async def create(cls,
                     configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'LiveProtocolSession':
        return LiveProtocolSession(
            configuration=configuration,
            instance_meta=instance_meta,
            protocol_engine=await ProtocolEngine.create(configuration.hardware)
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
