from opentrons.calibration.check.models import SessionType

from robot_server.service.session import models
from robot_server.service.session.command_execution import CommandQueue, \
    CommandExecutor, DefaultHardwareExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedFeature
from robot_server.service.session.session_types import BaseSession, \
    SessionMetaData


class DefaultSession(BaseSession):

    def __init__(self, configuration: SessionConfiguration,
                 instance_meta: SessionMetaData):
        """Constructor"""
        super().__init__(configuration, instance_meta)
        self._executor = DefaultHardwareExecutor(configuration.hardware)

    @property
    def command_executor(self) -> CommandExecutor:
        return self._executor

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    def _get_response_details(self) -> models.SessionDetails:
        return models.EmptyModel()

    @property
    def session_type(self) -> SessionType:
        return SessionType.default
