import logging
from typing import cast

from robot_server.service.session.session_types import BaseSession, \
    SessionMetaData
from robot_server.service.session import models
from robot_server.service.session.command_execution import CommandQueue,\
    CommandExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedFeature, \
    SessionCreationException
from robot_server.service.protocol.errors import ProtocolNotFoundException
from robot_server.service.protocol.protocol import UploadedProtocol


log = logging.getLogger(__name__)


class ProtocolSession(BaseSession):

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 protocol: UploadedProtocol):
        """
        Constructor

        :param configuration:
        :param instance_meta:
        :param protocol:
        """
        super().__init__(configuration, instance_meta)
        self._uploaded_protocol = protocol

    @classmethod
    async def create(cls, configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        """Try to create the protocol session"""
        try:
            protocol = configuration.protocol_manager.get(
                cast(models.ProtocolCreateParams,
                     instance_meta.create_params).protocol_id
            )
            return cls(configuration, instance_meta, protocol)
        except ProtocolNotFoundException as e:
            raise SessionCreationException(str(e))

    def _get_response_details(self) -> models.SessionDetails:
        return models.EmptyModel()

    @property
    def command_executor(self) -> CommandExecutor:
        raise UnsupportedFeature()

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    @property
    def session_type(self) -> models.SessionType:
        return models.SessionType.protocol
