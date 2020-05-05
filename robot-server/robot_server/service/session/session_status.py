import typing
from opentrons.server.endpoints.calibration import models as calibration_models
from opentrons.server.endpoints.calibration.session import \
    CheckCalibrationSession, CalibrationSession
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
        return func(session)

    return None


def _create_calibration_check_session_details(
        session: CheckCalibrationSession
) -> calibration_models.CalibrationSessionStatus:
    """Create calibration check session status"""
    instruments = {
        str(k): calibration_models.AttachedPipette(
            model=v.model,
            name=v.name,
            tip_length=v.tip_length,
            has_tip=v.has_tip,
            tiprack_id=v.tiprack_id)
        for k, v in session.pipette_status().items()
    }
    labware = [
            calibration_models.LabwareStatus(
                alternatives=data.alternatives,
                slot=data.slot,
                id=data.id,
                forPipettes=data.forPipettes,
                loadName=data.loadName,
                namespace=data.namespace,
                version=data.version) for data in
            session.labware_status.values()
        ]

    s=session.current_state_name

    return calibration_models.CalibrationSessionStatus(
        instruments=instruments,
        currentStep=session.current_state_name,
        labware=labware,
    )
