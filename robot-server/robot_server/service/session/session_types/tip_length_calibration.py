from robot_server.robot.calibration.tip_length.user_flow import \
    TipCalibrationUserFlow

from .base_session import BaseSession, SessionMetaData
from ..command_execution import CommandQueue, CommandExecutor, \
    CallableExecutor
from ..configuration import SessionConfiguration
from ..models import EmptyModel, SessionType, SessionDetails
from ..errors import UnsupportedFeature


class TipLengthCalibration(BaseSession):

    def __init__(self, configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 tip_length_calibration: TipCalibrationUserFlow
                 ):
        super().__init__(configuration, instance_meta)
        self._tip_length_calibration = tip_length_calibration
        self._command_executor = CallableExecutor(
            self._tip_length_calibration.handle_command
        )

    @classmethod
    async def create(cls, configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   tip_length_calibration=TipCalibrationUserFlow())

    @property
    def command_executor(self) -> CommandExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    @property
    def session_type(self) -> SessionType:
        return SessionType.tip_length_calibration

    def _get_response_details(self) -> SessionDetails:
        # TODO: Create a proper model for the session details. Add it to
        #   SessionDetails Union
        return EmptyModel()
