from typing import Awaitable, cast, TYPE_CHECKING
from opentrons.types import Mount
from robot_server.robot.calibration.pipette_offset.user_flow import \
    PipetteOffsetCalibrationUserFlow
from robot_server.robot.calibration.pipette_offset.models import \
    PipetteOffsetCalibrationSessionStatus, SessionCreateParams
from robot_server.service.session.errors import (SessionCreationException,
                                                 CommandExecutionException)
from robot_server.service.session.command_execution import \
     CallableExecutor, Command, CompletedCommand, CommandQueue, CommandExecutor

from .base_session import BaseSession, SessionMetaData
from ..configuration import SessionConfiguration
from ..models.session import SessionType, SessionDetails
from ..errors import UnsupportedFeature

if TYPE_CHECKING:
    from opentrons_shared_data.labware import LabwareDefinition


class PipetteOffsetCalibrationCommandExecutor(CallableExecutor):

    async def execute(self, command: Command) -> CompletedCommand:
        try:
            return await super().execute(command)
        except AssertionError as e:
            raise CommandExecutionException(str(e))


class PipetteOffsetCalibrationSession(BaseSession):
    def __init__(self, configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 pip_offset_cal_user_flow: PipetteOffsetCalibrationUserFlow,
                 shutdown_handler: Awaitable[None] = None
                 ):
        super().__init__(configuration, instance_meta)
        self._pip_offset_cal_user_flow = pip_offset_cal_user_flow
        self._command_executor = PipetteOffsetCalibrationCommandExecutor(
            self._pip_offset_cal_user_flow.handle_command
        )
        self._shutdown_coroutine = shutdown_handler

    @classmethod
    async def create(cls, configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> 'BaseSession':
        assert isinstance(instance_meta.create_params, SessionCreateParams)
        mount = instance_meta.create_params.mount
        load_tip_length = instance_meta.create_params.shouldCalibrateTipLength
        tiprack = instance_meta.create_params.tipRackDefinition
        # if lights are on already it's because the user clicked the button,
        # so a) we don't need to turn them on now and b) we shouldn't turn them
        # off after
        session_controls_lights =\
            not configuration.hardware.get_lights()['rails']
        try:
            pip_offset_cal_user_flow = PipetteOffsetCalibrationUserFlow(
                    hardware=configuration.hardware,
                    mount=Mount[mount.upper()],
                    load_tip_length=load_tip_length,
                    tip_rack_def=cast('LabwareDefinition', tiprack))
        except AssertionError as e:
            raise SessionCreationException(str(e))

        if session_controls_lights:
            await configuration.hardware.set_lights(rails=True)
            shutdown_handler = configuration.hardware.set_lights(rails=False)
        else:
            shutdown_handler = None

        return cls(configuration=configuration,
                   instance_meta=instance_meta,
                   pip_offset_cal_user_flow=pip_offset_cal_user_flow,
                   shutdown_handler=shutdown_handler)

    @property
    def command_executor(self) -> CommandExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        raise UnsupportedFeature()

    @property
    def session_type(self) -> SessionType:
        return SessionType.pipette_offset_calibration

    def _get_response_details(self) -> SessionDetails:
        uf = self._pip_offset_cal_user_flow
        return PipetteOffsetCalibrationSessionStatus(
            instrument=uf.get_pipette(),
            currentStep=uf.current_state,
            labware=uf.get_required_labware(),
            hasCalibratedTipLength=uf.has_calibrated_tip_length,
        )

    async def clean_up(self):
        if self._shutdown_coroutine:
            await self._shutdown_coroutine
