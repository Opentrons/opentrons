from opentrons.calibration.check.models import SessionType
from opentrons.calibration.tip_length.state_machine import \
    TipCalibrationStateMachine

from .base_session import BaseSession, SessionMetaData
from .. import models
from ..command_execution import CommandQueue, CommandExecutor, \
    StateMachineExecutor
from ..configuration import SessionConfiguration
from ..models import EmptyModel


class TipLengthCalibration(BaseSession):

    def __init__(self, configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 tip_length_calibration: TipCalibrationStateMachine
                 ):
        super().__init__(configuration, instance_meta)
        self._tip_length_calibration = tip_length_calibration
        self._command_executor = StateMachineExecutor(
            self._tip_length_calibration
        )
        self._command_queue = CommandQueue()

    @classmethod
    async def create(cls, configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   tip_length_calibration=TipCalibrationStateMachine())

    @property
    def command_executor(self) -> CommandExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        return self._command_queue

    @property
    def session_type(self) -> SessionType:
        return SessionType.tip_length_calibration

    def _get_response_details(self) -> models.SessionDetails:
        # TODO: Create a proper model for the session details. Add it to
        #   SessionDetails Union
        return EmptyModel()
