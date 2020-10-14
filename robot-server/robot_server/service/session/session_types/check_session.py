from typing import Awaitable

from robot_server.robot.calibration.check.user_flow import\
    CheckCalibrationUserFlow
from robot_server.robot.calibration.check import models as calibration_models

from robot_server.service.session.command_execution import \
    CommandQueue, CallableExecutor, Command, CompletedCommand
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models.session import SessionType, \
    SessionDetails
from robot_server.service.session.session_types.base_session \
    import BaseSession, SessionMetaData
from robot_server.service.session.errors import SessionCreationException, \
    CommandExecutionException, UnsupportedFeature


class CheckSessionCommandExecutor(CallableExecutor):

    async def execute(self, command: Command) -> CompletedCommand:
        try:
            return await super().execute(command)
        except AssertionError as e:
            raise CommandExecutionException(str(e))


class CheckSession(BaseSession):

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 calibration_check: CheckCalibrationUserFlow,
                 shutdown_handler: Awaitable[None] = None):
        super().__init__(configuration, instance_meta)
        self._calibration_check = calibration_check
        self._command_executor = CheckSessionCommandExecutor(
            self._calibration_check.handle_command
        )
        self._shutdown_coroutine = shutdown_handler

    @classmethod
    async def create(cls,
                     configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> BaseSession:
        """Create an instance"""
        assert isinstance(
            instance_meta.create_params,
            calibration_models.SessionCreateParams)
        tip_racks = instance_meta.create_params.tipRacks
        # if lights are on already it's because the user clicked the button,
        # so a) we don't need to turn them on now and b) we shouldn't turn them
        # off after
        session_controls_lights =\
            not configuration.hardware.get_lights()['rails']
        try:
            calibration_check = CheckCalibrationUserFlow(
                configuration.hardware,
                tip_rack_defs=tip_racks)
        except AssertionError as e:
            raise SessionCreationException(str(e))

        if session_controls_lights:
            await configuration.hardware.set_lights(rails=True)
            shutdown_handler = configuration.hardware.set_lights(rails=False)
        else:
            shutdown_handler = None

        return cls(
            configuration=configuration,
            instance_meta=instance_meta,
            calibration_check=calibration_check)

    def _get_response_details(self) -> SessionDetails:

        # TODO(mc, 2020-09-17): type of get_comparisons_by_step doesn't quite
        # match what CalibrationSessionStatus expects for comparisonsByStep
        return calibration_models.CalibrationCheckSessionStatus(
            instruments=self._calibration_check.get_instruments(),
            currentStep=self._calibration_check.current_state,
            comparisonsByStep=self._calibration_check.comparison_map,  # type: ignore[arg-type] # noqa: e501
            labware=self._calibration_check.get_required_labware(),
            activePipette=self._calibration_check.get_active_pipette()
        )

    @property
    def command_executor(self) -> CallableExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    @property
    def session_type(self) -> SessionType:
        return SessionType.calibration_check

    async def clean_up(self):
        if self._shutdown_coroutine:
            await self._shutdown_coroutine
