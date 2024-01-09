from starlette import status
from fastapi import APIRouter, Depends
from typing import Optional

from opentrons.calibration_storage import types as cal_types
from opentrons.calibration_storage.ot2 import tip_length, models

from robot_server.hardware import get_ot2_hardware
from robot_server.errors import ErrorBody
from robot_server.service.tip_length import models as tl_models
from robot_server.service.errors import RobotServerError, CommonErrorDef
from robot_server.service.shared_models import calibration as cal_model

from opentrons.hardware_control import API


router = APIRouter()


def _format_calibration(
    calibration: models.v1.TipLengthCalibration,
) -> tl_models.TipLengthCalibration:
    # TODO (lc 09-20-2022) We should use the calibration
    # status model in calibration storage.
    status = cal_model.CalibrationStatus(
        markedBad=calibration.status.markedBad,
        source=calibration.status.source,
        markedAt=calibration.status.markedAt,
    )
    formatted_cal = tl_models.TipLengthCalibration(
        id=f"{calibration.tiprack}&{calibration.pipette}",
        tipLength=calibration.tipLength,
        tiprack=calibration.tiprack,
        pipette=calibration.pipette,
        lastModified=calibration.lastModified,
        source=calibration.source,
        status=status,
        uri=calibration.uri,
    )

    return formatted_cal


@router.get(
    "/calibration/tip_length",
    description="Fetch all saved tip length calibrations from the robot",
    summary="Search the robot for any saved tip length calibration",
    response_model=tl_models.MultipleCalibrationsResponse,
)
async def get_all_tip_length_calibrations(
    tiprack_hash: Optional[str] = None,
    pipette_id: Optional[str] = None,
    tiprack_uri: Optional[str] = None,
    _: API = Depends(get_ot2_hardware),
) -> tl_models.MultipleCalibrationsResponse:
    all_calibrations = tip_length.get_all_tip_length_calibrations()
    if not all_calibrations:
        return tl_models.MultipleCalibrationsResponse(
            data=[_format_calibration(cal) for cal in all_calibrations],
            links=None,
        )

    if tiprack_hash:
        all_calibrations = list(
            filter(lambda cal: cal.tiprack == tiprack_hash, all_calibrations)
        )
    if pipette_id:
        all_calibrations = list(
            filter(lambda cal: cal.pipette == pipette_id, all_calibrations)
        )
    if tiprack_uri:
        all_calibrations = list(
            filter(lambda cal: cal.uri == tiprack_uri, all_calibrations)
        )

    calibrations = [_format_calibration(cal) for cal in all_calibrations]
    return tl_models.MultipleCalibrationsResponse(data=calibrations, links=None)


@router.delete(
    "/calibration/tip_length",
    description="Delete one specific tip length calibration by pipette "
    "serial and tiprack hash",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorBody}},
)
async def delete_specific_tip_length_calibration(
    tiprack_hash: str, pipette_id: str, _: API = Depends(get_ot2_hardware)
):
    try:
        tip_length.delete_tip_length_calibration(tiprack_hash, pipette_id)
    except cal_types.TipLengthCalNotFound:
        raise RobotServerError(
            definition=CommonErrorDef.RESOURCE_NOT_FOUND,
            resource="TipLengthCalibration",
            id=f"{tiprack_hash}&{pipette_id}",
        )
