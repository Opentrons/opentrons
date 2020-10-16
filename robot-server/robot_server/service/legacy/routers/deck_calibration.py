from fastapi import APIRouter, Depends

from opentrons.config import robot_configs
from opentrons.hardware_control import ThreadManager
from opentrons.calibration_storage import helpers

from robot_server.service.dependencies import get_hardware
from robot_server.service.legacy.models.deck_calibration import (
    CalibrationStatus, DeckCalibrationStatus, DeckCalibrationData, MatrixType)
from robot_server.service.shared_models import calibration as cal_model

router = APIRouter()


@router.get("/calibration/status",
            description="Get the calibration status",
            response_model=CalibrationStatus)
async def get_calibration_status(
        hardware: ThreadManager = Depends(get_hardware)) -> CalibrationStatus:
    robot_conf = robot_configs.load()
    deck_cal = hardware.robot_calibration.deck_calibration
    status = cal_model.CalibrationStatus(
        **helpers.convert_to_dict(deck_cal.status))
    deck_cal_data = DeckCalibrationData(
        type=MatrixType.attitude,
        matrix=deck_cal.attitude,
        lastModified=deck_cal.last_modified,
        pipetteCalibratedWith=deck_cal.pipette_calibrated_with,
        tiprack=deck_cal.tiprack,
        source=deck_cal.source,
        status=status)

    return CalibrationStatus(
        deckCalibration=DeckCalibrationStatus(
            status=hardware.validate_calibration(),
            data=deck_cal_data),
        instrumentCalibration=robot_conf.instrument_offset)
