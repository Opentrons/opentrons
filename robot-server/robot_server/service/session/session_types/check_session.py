from opentrons.calibration.check.session import CheckCalibrationSession
from opentrons.calibration.check import models as calibration_models

from robot_server.service.session import models
from robot_server.service.session.command_execution import \
    CommandQueue, StateMachineExecutor
from robot_server.service.session.configuration import SessionConfiguration
from robot_server.service.session.session_types.base_session \
    import BaseSession, SessionMetaData


class CheckBaseSession(BaseSession):

    def __init__(self,
                 configuration: SessionConfiguration,
                 instance_meta: SessionMetaData,
                 calibration_check: CheckCalibrationSession):
        super().__init__(configuration, instance_meta)
        self._calibration_check = calibration_check
        self._command_executor = StateMachineExecutor(self._calibration_check)
        self._command_queue = CommandQueue()

    @classmethod
    async def create(cls,
                     configuration: SessionConfiguration,
                     instance_meta: SessionMetaData) -> BaseSession:
        """Create an instance"""
        calibration_check = await CheckCalibrationSession.build(
            configuration.hardware
        )
        return cls(
            configuration=configuration,
            instance_meta=instance_meta,
            calibration_check=calibration_check)

    async def clean_up(self):
        await super().clean_up()
        await self._calibration_check.delete_session()

    def _get_response_details(self) -> models.SessionDetails:
        instruments = {
            str(k): calibration_models.AttachedPipette(
                model=v.model,
                name=v.name,
                tip_length=v.tip_length,
                mount=str(v.mount),
                has_tip=v.has_tip,
                rank=v.rank,
                tiprack_id=v.tiprack_id)
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
                version=data.version) for data in
            self._calibration_check.labware_status.values()
        ]

        return calibration_models.CalibrationSessionStatus(
            instruments=instruments,
            currentStep=self._calibration_check.current_state_name,
            comparisonsByStep=self._calibration_check.get_comparisons_by_step(),
            labware=labware,
        )

    @property
    def command_executor(self) -> StateMachineExecutor:
        return self._command_executor

    @property
    def command_queue(self) -> CommandQueue:
        return self._command_queue

    @property
    def session_type(self) -> calibration_models.SessionType:
        return calibration_models.SessionType.calibration_check
