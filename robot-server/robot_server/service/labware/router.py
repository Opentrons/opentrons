from typing import List, Optional, Union

from starlette import status
from fastapi import APIRouter
from functools import partial


from opentrons.calibration_storage import (
    helpers,
    types as cal_types,
    get as get_cal,
    delete)

from robot_server.service.labware import models as lw_models
from robot_server.service.errors import RobotServerError
from robot_server.service.json_api import ErrorResponse, Error

router = APIRouter()


"""
These routes serve the current labware offsets on the robot to a client.
"""


def _format_calibrations(
        calibrations: List[cal_types.CalibrationInformation])\
        -> List[lw_models.LabwareCalibration]:
    formatted_calibrations = []
    for calInfo in calibrations:
        details = helpers.details_from_uri(calInfo.uri)
        lw_offset = calInfo.calibration.offset
        # TODO: Integrate datetime methods
        # to ensure that last_modified is the expected
        # value.
        offset = lw_models.OffsetData(
            value=lw_offset.value,
            lastModified=lw_offset.last_modified)

        tip_cal = calInfo.calibration.tip_length
        tip_length = lw_models.TipData(
            value=tip_cal.value,
            lastModified=tip_cal.last_modified)
        if calInfo.parent.module:
            parent_info = calInfo.parent.module
        else:
            parent_info = calInfo.parent.slot
        cal_data = lw_models.CalibrationData(
            offset=offset, tipLength=tip_length)
        formatted_cal = lw_models.LabwareCalibration(
            calibrationData=cal_data,
            loadName=details.load_name,
            namespace=details.namespace,
            version=details.version,
            parent=parent_info)
        formatted_calibrations.append(
                lw_models.ResponseDataModel.create(
                    attributes=formatted_cal,
                    resource_id=calInfo.labware_id))
    return formatted_calibrations


def _grab_value(
        calibration: cal_types.CalibrationInformation,
        filtering: str,
        comparison: Union[str, int]) -> bool:
    """
    A filtering function to determine whether a particular
    calibration matches any of the following criteria:

    - Namespace of the calibration matches the namespace
    provided by the client.
    - Loadname of the calibration matches the loadname
    provided by the client.
    - Version of the calibration matches the version
    provided by the client.
    """
    details = helpers.details_from_uri(calibration.uri)
    if filtering == 'namespace':
        return details.namespace == comparison
    if filtering == 'loadname':
        return details.load_name == comparison
    if filtering == 'version':
        return details.version == comparison
    return False


def _check_parent(
        parentOpts: cal_types.ParentOptions,
        parent: str) -> bool:
    """
    A filtering function to check whether the parent provided
    by the client matches the parent provided by the client.
    """
    if parentOpts.module == parent:
        return True
    if parentOpts.slot == parent:
        return True
    return False


@router.get("/labware/calibrations",
            description="Fetch all saved labware calibrations from the robot",
            summary="Search the robot for any saved labware offsets"
                    "which allows you to check whether a particular"
                    "labware has been calibrated or not.",
            response_model=lw_models.MultipleCalibrationsResponse)
async def get_all_labware_calibrations(
        loadName: str = None,
        namespace: str = None,
        version: int = None,
        parent: str = None) -> lw_models.MultipleCalibrationsResponse:
    all_calibrations = get_cal.get_all_calibrations()

    if not all_calibrations:
        lw_models.MultipleCalibrationsResponse(data=all_calibrations)

    if namespace:
        all_calibrations = list(filter(
            partial(_grab_value, filtering='namespace', comparison=namespace),
            all_calibrations))
    if loadName:
        all_calibrations = list(filter(
          partial(_grab_value, filtering='loadname', comparison=loadName),
          all_calibrations))
    if version:
        all_calibrations = list(filter(
          partial(_grab_value, filtering='version', comparison=version),
          all_calibrations))
    if parent:
        all_calibrations = list(filter(
          partial(_check_parent, parent=parent),
          all_calibrations))
    calibrations = _format_calibrations(all_calibrations)

    return lw_models.MultipleCalibrationsResponse(data=calibrations)


@router.get("/labware/calibrations/{calibrationId}",
            description="Fetch one specific labware offset by ID",
            response_model=lw_models.SingleCalibrationResponse,
            responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}})
async def get_specific_labware_calibration(
        calibrationId: str) -> lw_models.SingleCalibrationResponse:
    calibration: Optional[cal_types.CalibrationInformation] = None
    for cal in get_cal.get_all_calibrations():
        if calibrationId == cal.labware_id:
            calibration = cal
            break
    if not calibration:
        error = Error(title='{calibrationId} does not exist.')
        raise RobotServerError(status_code=status.HTTP_404_NOT_FOUND,
                               error=error)

    formatted_calibrations = _format_calibrations([calibration])
    return lw_models.SingleCalibrationResponse(
        data=formatted_calibrations[0])


@router.delete("/labware/calibrations/{calibrationId}",
               description="Delete one specific labware offset by ID",
               responses={
                   status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}})
async def delete_specific_labware_calibration(
        calibrationId: cal_types.CalibrationID):
    try:
        delete.delete_offset_file(calibrationId)
    except (FileNotFoundError, KeyError):
        error = Error(title='{calibrationId} does not exist.')
        raise RobotServerError(status_code=status.HTTP_404_NOT_FOUND,
                               error=error)
