from starlette import status
from fastapi import APIRouter
from typing import Optional

from opentrons import types as ot_types
from opentrons.calibration_storage import (
    types as cal_types,
    get as get_cal,
    helpers,
    delete,
)

from robot_server.errors import ErrorBody
from robot_server.service.pipette_offset import models as pip_models
from robot_server.service.errors import RobotServerError, CommonErrorDef
from robot_server.service.shared_models import calibration as cal_model

router = APIRouter()


def _format_calibration(
    calibration: cal_types.PipetteOffsetCalibration,
) -> pip_models.PipetteOffsetCalibration:
    status = cal_model.CalibrationStatus(**helpers.convert_to_dict(calibration.status))
    formatted_cal = pip_models.PipetteOffsetCalibration(
        id=f"{calibration.pipette}&{calibration.mount}",
        pipette=calibration.pipette,
        mount=calibration.mount,
        offset=calibration.offset,
        tiprack=calibration.tiprack,
        tiprackUri=calibration.uri,
        lastModified=calibration.last_modified,
        source=calibration.source,
        status=status,
    )

    return formatted_cal


@router.get(
    "/calibration/pipette_offset",
    description="Fetch all saved pipette offset calibrations from the robot",
    summary="Search the robot for any saved pipette offsets",
    response_model=pip_models.MultipleCalibrationsResponse,
)
async def get_all_pipette_offset_calibrations(
    pipette_id: Optional[str] = None, mount: Optional[pip_models.MountType] = None
) -> pip_models.MultipleCalibrationsResponse:
    all_calibrations = get_cal.get_all_pipette_offset_calibrations()

    if not all_calibrations:
        return pip_models.MultipleCalibrationsResponse(
            data=[_format_calibration(cal) for cal in all_calibrations],
            links=None,
        )

    if pipette_id:
        all_calibrations = list(
            filter(lambda cal: cal.pipette == pipette_id, all_calibrations)
        )
    if mount:
        all_calibrations = list(
            filter(lambda cal: cal.mount == mount, all_calibrations)
        )

    calibrations = [_format_calibration(cal) for cal in all_calibrations]
    return pip_models.MultipleCalibrationsResponse(data=calibrations, links=None)


@router.delete(
    "/calibration/pipette_offset",
    description="Delete one specific pipette calibration "
    "by pipette serial and mount",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorBody}},
)
async def get_specific_pipette_offset_calibration(
    pipette_id: str, mount: pip_models.MountType
):
    try:
        delete.delete_pipette_offset_file(pipette_id, ot_types.Mount[mount.upper()])
    except FileNotFoundError:
        raise RobotServerError(
            definition=CommonErrorDef.RESOURCE_NOT_FOUND,
            resource="PipetteOffsetCalibration",
            id=f"{pipette_id}&{mount}",
        )
