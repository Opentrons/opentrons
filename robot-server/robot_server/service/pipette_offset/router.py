from starlette import status
from fastapi import APIRouter

from opentrons import types as ot_types
from opentrons.calibration_storage import (
    types as cal_types,
    get as get_cal,
    delete)

from robot_server.service.pipette_offset import models as pip_models
from robot_server.service.errors import RobotServerError, CommonErrorDef
from robot_server.service.json_api import ErrorResponse, ResponseDataModel

router = APIRouter()


def _format_calibration(
    calibration: cal_types.PipetteOffsetCalibration
) -> ResponseDataModel[pip_models.PipetteOffsetCalibration]:
    formatted_cal = pip_models.PipetteOffsetCalibration(
        pipette=calibration.pipette,
        mount=calibration.mount,
        offset=calibration.offset,
        tiprack=calibration.tiprack,
        lastModified=calibration.last_modified)

    return ResponseDataModel.create(
        attributes=formatted_cal,
        resource_id=f'{calibration.pipette}&{calibration.mount}')


@router.get(
    "/calibration/pipette_offset",
    description="Fetch all saved pipette offset calibrations from the robot",
    summary="Search the robot for any saved pipette offsets",
    response_model=pip_models.MultipleCalibrationsResponse)
async def get_all_pipette_offset_calibrations(
        pipette_id: str = None,
        mount: pip_models.MountType = None
) -> pip_models.MultipleCalibrationsResponse:
    all_calibrations = get_cal.get_all_pipette_offset_calibrations()

    if not all_calibrations:
        return pip_models.MultipleCalibrationsResponse(
            data=[_format_calibration(cal) for cal in all_calibrations]
        )

    if pipette_id:
        all_calibrations = list(filter(
            lambda cal: cal.pipette == pipette_id, all_calibrations))
    if mount:
        all_calibrations = list(filter(
            lambda cal: cal.mount == mount, all_calibrations))

    calibrations = [_format_calibration(cal) for cal in all_calibrations]
    return pip_models.MultipleCalibrationsResponse(data=calibrations)


@router.delete(
    "/calibration/pipette_offset",
    description="Delete one specific pipette calibration"
                "by pipette serial and mount",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}})
async def get_specific_pipette_offset_calibration(
        pipette_id: str, mount: pip_models.MountType):
    try:
        delete.delete_pipette_offset_file(pipette_id,
                                          ot_types.Mount[mount.upper()])
    except FileNotFoundError:
        raise RobotServerError(definition=CommonErrorDef.RESOURCE_NOT_FOUND,
                               resource='PipetteOffsetCalibration',
                               id=f"{pipette_id}&{mount}")
