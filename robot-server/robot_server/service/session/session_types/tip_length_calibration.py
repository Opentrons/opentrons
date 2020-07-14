from robot_server.robot.calibration.tip_length.user_flow import (
    TipCalibrationUserFlow,
)
from robot_server.robot.calibration.tip_length.models import \
    TipCalibrationSessionStatus
from robot_server.robot.calibration.session import CalibrationException
from robot_server.service.session.errors import SessionCreationException

from .base_session import BaseSession, SessionMetaData
from ..command_execution import CommandQueue, CommandExecutor, \
    CallableExecutor
from ..configuration import SessionConfiguration
from ..models import SessionType, SessionDetails
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
        try:
            tip_length_cal = TipCalibrationUserFlow(
                    hardware=configuration.hardware)
        except (AssertionError, CalibrationException) as e:
            raise SessionCreationException(str(e))

        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   tip_length_calibration=tip_length_cal)

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
        return TipCalibrationSessionStatus(
            instrument=self._tip_length_calibration.pipette,
            currentStep=self._tip_length_calibration.current_state,
            labware=self._tip_length_calibration.required_labware,
        )
