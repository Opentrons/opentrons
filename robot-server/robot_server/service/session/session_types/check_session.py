from robot_server.robot.calibration.check.session import\
    CheckCalibrationSession
from robot_server.robot.calibration.check import models as calibration_models
from robot_server.robot.calibration.check.util import StateMachineError

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
                 calibration_check: CheckCalibrationSession,
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
        # assert isinstance(instance_meta.create_params, SessionCreateParams)
        # mount = instance_meta.create_params.mount
        # if lights are on already it's because the user clicked the button,
        # so a) we don't need to turn them on now and b) we shouldn't turn them
        # off after
        session_controls_lights =\
            not configuration.hardware.get_lights()['rails']
        try:
            calibration_check = await CheckCalibrationSession.build(
                configuration.hardware
            )
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

    async def clean_up(self):
        await super().clean_up()
        await self._calibration_check.delete_session()

    def _get_response_details(self) -> SessionDetails:
        instruments = {
            str(k): calibration_models.AttachedPipette(
                model=v.model,
                name=v.name,
                tip_length=v.tip_length,
                mount=str(v.mount),
                has_tip=v.has_tip,
                rank=v.rank,
                tiprack_id=v.tiprack_id,
                serial=v.serial)
            for k, v in self._calibration_check.pipette_status().items()
        }
        labware = [
            calibration_models.LabwareStatus(
                alternatives=data.alternatives,
                slot=data.slot,
                id=data.id,
                forMounts=[str(m) for m in data.forMounts],
                loadName=data.loadName,
                namespace=data.namespace,
                version=str(data.version)) for data in
            self._calibration_check.labware_status.values()
        ]

        # TODO(mc, 2020-09-17): type of get_comparisons_by_step doesn't quite
        # match what CalibrationSessionStatus expects for comparisonsByStep
        return calibration_models.CalibrationSessionStatus(
            instruments=instruments,
            currentStep=self._calibration_check.current_state_name,
            comparisonsByStep=self._calibration_check.get_comparisons_by_step(),  # type: ignore[arg-type] # noqa: e501
            labware=labware,
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
