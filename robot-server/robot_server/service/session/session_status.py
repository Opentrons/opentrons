import typing
from opentrons.calibration.check import models as calibration_models
from opentrons.calibration.check.session import CheckCalibrationSession,\
    CalibrationSession
from robot_server.service.models.session import SessionDetails


SessionObjectTypes = typing.Union[CalibrationSession, CheckCalibrationSession]


def create_session_details(session: SessionObjectTypes) \
        -> typing.Optional[SessionDetails]:
    """
    Create session details object

    :param session: A session
    :return: The session details
    """
    _detail_maker = {
        CheckCalibrationSession: _create_calibration_check_session_details,
        CalibrationSession: None
    }
    func = _detail_maker.get(type(session))
    if func:
        return func(session)  # type: ignore

    return None


def _create_calibration_check_session_details(
        session: CheckCalibrationSession
) -> typing.Optional[SessionDetails]:
    """Create calibration check session status"""
    instruments = {
        str(k): calibration_models.AttachedPipette(
            model=v.model,
            name=v.name,
            tip_length=v.tip_length,
            mount=str(v.mount),
            has_tip=v.has_tip,
            rank=v.rank,
            tiprack_id=v.tiprack_id)
        for k, v in session.pipette_status().items()
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
            session.labware_status.values()
        ]
    comparisons = {
        k: calibration_models.ComparisonStatus(
            differenceVector=v.differenceVector,
            thresholdVector=v.thresholdVector,
            exceedsThreshold=v.exceedsThreshold,
            transformType=str(v.transformType)
        )
        for k, v in session.get_comparisons_by_step().items()}
    return calibration_models.CalibrationSessionStatus(
        instruments=instruments,
        currentStep=session.current_state_name,
        comparisonsByStep=comparisons,
        labware=labware,
    )
