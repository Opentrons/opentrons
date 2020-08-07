from robot_server.robot.calibration.deck.user_flow import \
    DeckCalibrationUserFlow
from robot_server.robot.calibration.deck.models import \
    DeckCalibrationSessionStatus
from robot_server.robot.calibration.session import CalibrationException
from robot_server.service.session.errors import (SessionCreationException,
                                                 CommandExecutionException)
from robot_server.service.session.command_execution import \
    CallableExecutor, Command, CompletedCommand, CommandQueue, CommandExecutor

from .base_session import BaseSession, SessionMetaData
from ..configuration import SessionConfiguration
from ..models import SessionType, SessionDetails
from ..errors import UnsupportedFeature


class DeckCalibrationCommandExecutor(CallableExecutor):

    async def execute(self, command: Command) -> CompletedCommand:
        try:
            return await super().execute(command)
        except (CalibrationException, AssertionError) as e:
            raise CommandExecutionException(e)


class DeckCalibrationSession(BaseSession):
    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 deck_cal_user_flow: DeckCalibrationUserFlow):
        super().__init__(configuration, instance_meta)
        self._deck_cal_user_flow = deck_cal_user_flow
        self._command_executor = DeckCalibrationCommandExecutor(
            self._deck_cal_user_flow.handle_command
        )

    @classmethod
    async def create(cls,
                     configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        try:
            deck_cal_user_flow = DeckCalibrationUserFlow(
                hardware=configuration.hardware)
        except (AssertionError, CalibrationException) as e:
            raise SessionCreationException(str(e))

        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   deck_cal_user_flow=deck_cal_user_flow)

    @property
    def command_executor(self) -> CommandExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    @property
    def session_type(self) -> SessionType:
        return SessionType.deck_calibration

    def _get_response_details(self) -> SessionDetails:
        return DeckCalibrationSessionStatus(
            instrument=self._deck_cal_user_flow.get_pipette(),
            currentStep=self._deck_cal_user_flow.current_state,
            labware=self._deck_cal_user_flow.get_required_labware())
