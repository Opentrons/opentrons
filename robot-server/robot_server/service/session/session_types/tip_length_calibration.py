
from opentrons.types import Mount
from robot_server.robot.calibration.tip_length.user_flow import \
    TipCalibrationUserFlow
from robot_server.robot.calibration.tip_length.models import \
    TipCalibrationSessionStatus, SessionCreateParams
from robot_server.robot.calibration.session import CalibrationException
from robot_server.robot.calibration.tip_length.util import StateTransitionError
from robot_server.service.session.errors import (SessionCreationException,
                                                 CommandExecutionException,
                                                 CommandExecutionConflict)
from robot_server.service.session.command_execution import \
     CallableExecutor, Command, CompletedCommand, CommandQueue, CommandExecutor

from .base_session import BaseSession, SessionMetaData
from ..configuration import SessionConfiguration
from ..models import SessionType, SessionDetails
from ..errors import UnsupportedFeature


class TipLengthCalibrationCommandExecutor(CallableExecutor):

    async def execute(self, command: Command) -> CompletedCommand:
        try:
            return await super().execute(command)
        except StateTransitionError as e:
            raise CommandExecutionConflict(e)
        except (CalibrationException, AssertionError) as e:
            raise CommandExecutionException(e)


class TipLengthCalibration(BaseSession):
    def __init__(self, configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 tip_cal_user_flow: TipCalibrationUserFlow
                 ):
        super().__init__(configuration, instance_meta)
        self._tip_cal_user_flow = tip_cal_user_flow
        self._command_executor = TipLengthCalibrationCommandExecutor(
            self._tip_cal_user_flow.handle_command
        )

    @classmethod
    async def create(cls, configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        assert isinstance(instance_meta.create_params, SessionCreateParams)
        has_calibration_block = instance_meta.create_params.hasCalibrationBlock
        mount = instance_meta.create_params.mount
        try:
            tip_cal_user_flow = TipCalibrationUserFlow(
                    hardware=configuration.hardware,
                    mount=Mount[mount.upper()],
                    has_calibration_block=has_calibration_block)
        except (AssertionError, CalibrationException) as e:
            raise SessionCreationException(str(e))

        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   tip_cal_user_flow=tip_cal_user_flow)

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
            instrument=self._tip_cal_user_flow.get_pipette(),
            currentStep=self._tip_cal_user_flow.current_state,
            labware=self._tip_cal_user_flow.get_required_labware(),
        )
