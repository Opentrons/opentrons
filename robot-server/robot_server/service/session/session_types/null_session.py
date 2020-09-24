from robot_server.service.session.models import session as models
from robot_server.service.session.command_execution import CommandQueue,\
    CommandExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.errors import UnsupportedFeature
from robot_server.service.session.models.common import EmptyModel
from robot_server.service.session.models.session import SessionType
from robot_server.service.session.session_types.base_session import \
    BaseSession, SessionMetaData


class NullSession(BaseSession):
    """A session that does nothing."""

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData):
        """Constructor"""
        super().__init__(configuration, instance_meta=instance_meta)
        self._command_executor = CommandExecutor()

    @property
    def command_executor(self) -> CommandExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    def _get_response_details(self) -> models.SessionDetails:
        return EmptyModel()

    @property
    def session_type(self) -> SessionType:
        return SessionType.null
