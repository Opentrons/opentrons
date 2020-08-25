from typing import Awaitable
from robot_server.robot.calibration.deck.user_flow import \
    DeckCalibrationUserFlow
from robot_server.robot.calibration.deck.models import \
    DeckCalibrationSessionStatus
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
        except AssertionError as e:
            raise CommandExecutionException(str(e))


class DeckCalibrationSession(BaseSession):
    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 deck_cal_user_flow: DeckCalibrationUserFlow,
                 shutdown_handler: Awaitable[None] = None):
        super().__init__(configuration, instance_meta)
        self._deck_cal_user_flow = deck_cal_user_flow
        self._command_executor = DeckCalibrationCommandExecutor(
            self._deck_cal_user_flow.handle_command
        )
        self._shutdown_coroutine = shutdown_handler

    @classmethod
    async def create(cls,
                     configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        # if lights are on already it's because the user clicked the button,
        # so a) we don't need to turn them on now and b) we shouldn't turn them
        # off after
        session_controls_lights =\
            not configuration.hardware.get_lights()['rails']
        try:
            deck_cal_user_flow = DeckCalibrationUserFlow(
                hardware=configuration.hardware)
        except AssertionError as e:
            raise SessionCreationException(str(e))

        if session_controls_lights:
            await configuration.hardware.set_lights(rails=True)
            shutdown_handler = configuration.hardware.set_lights(rails=False)
        else:
            shutdown_handler = None

        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   deck_cal_user_flow=deck_cal_user_flow,
                   shutdown_handler=shutdown_handler)

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

    async def clean_up(self):
        if self._shutdown_coroutine:
            await self._shutdown_coroutine
