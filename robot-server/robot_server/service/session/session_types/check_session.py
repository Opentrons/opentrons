from typing import Awaitable, cast, TYPE_CHECKING, List, Optional

from robot_server.robot.calibration.check.user_flow import\
    CheckCalibrationUserFlow
from robot_server.robot.calibration.check.models import (
    ComparisonMap, ComparisonStatePerPipette,
    CalibrationCheckSessionStatus)
from robot_server.robot.calibration.check import util

from robot_server.service.session.command_execution import \
    CommandQueue, CallableExecutor, Command, CompletedCommand
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.models.session import SessionType, \
    SessionDetails
from robot_server.service.session.session_types.base_session \
    import BaseSession, SessionMetaData
from robot_server.service.session.errors import SessionCreationException, \
    CommandExecutionException, UnsupportedFeature

if TYPE_CHECKING:
    from opentrons_shared_data.labware import LabwareDefinition


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
        # (lc, 10-19-2020) For now, only pass in empty tipracks. We cannot
        # have a session model with an optional tiprack for session
        # create params right now because of the pydantic union problem.
        tip_racks: List[Optional['LabwareDefinition']] = []
        # if lights are on already it's because the user clicked the button,
        # so a) we don't need to turn them on now and b) we shouldn't turn them
        # off after
        session_controls_lights =\
            not configuration.hardware.get_lights()['rails']
        try:
            calibration_check = CheckCalibrationUserFlow(
                configuration.hardware,
                tip_rack_defs=[
                    cast('LabwareDefinition', rack) for rack in tip_racks])
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
            calibration_check=calibration_check,
            shutdown_handler=shutdown_handler)

    def _map_to_pydantic_model(
            self, comparison_map: util.ComparisonStatePerPipette
            ) -> ComparisonStatePerPipette:
        first = comparison_map.first
        second = comparison_map.second
        first_compmap = ComparisonMap(
            comparingHeight=first.comparingHeight,
            comparingPointOne=first.comparingPointOne,
            comparingPointTwo=first.comparingPointTwo,
            comparingPointThree=first.comparingPointThree)
        second_compmap = ComparisonMap(
            comparingHeight=second.comparingHeight,
            comparingPointOne=second.comparingPointOne)
        return ComparisonStatePerPipette(
            first=first_compmap, second=second_compmap)

    def _get_response_details(self) -> SessionDetails:
        comparison_map =\
            self._map_to_pydantic_model(self._calibration_check.comparison_map)
        return CalibrationCheckSessionStatus(
            instruments=self._calibration_check.get_instruments(),
            currentStep=self._calibration_check.current_state,
            comparisonsByPipette=comparison_map,
            labware=self._calibration_check.get_required_labware(),
            activePipette=self._calibration_check.get_active_pipette(),
            activeTipRack=self._calibration_check.get_active_tiprack()
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
