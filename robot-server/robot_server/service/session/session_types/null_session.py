from opentrons.calibration.check.models import SessionType

from robot_server.service.session import models
from robot_server.service.session.command_execution import CommandQueue,\
    CommandExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models import EmptyModel
from robot_server.service.session.session_types.base_session import \
    BaseSession, SessionMetaData


class NullBaseSession(BaseSession):
    """A session that does nothing."""

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData):
        """Constructor"""
        super().__init__(configuration, instance_meta=instance_meta)
        self._command_executor = CommandExecutor()
        self._command_queue = CommandQueue()

    @property
    def command_executor(self) -> CommandExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        return self._command_queue

    def _get_response_details(self) -> models.SessionDetails:
        return EmptyModel()

    @property
    def session_type(self) -> SessionType:
        return SessionType.null
