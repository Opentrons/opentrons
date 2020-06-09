from typing import Dict, List, Any, Optional, Union

import time
from starlette import status
from fastapi import APIRouter
from functools import partial

from opentrons.protocol_api import labware as lw_funcs

from robot_server.service.labware import models as lw_models
from robot_server.service.errors import RobotServerError
from robot_server.service.json_api import ErrorResponse, Error

router = APIRouter()


"""
These routes serve the current labware offsets on the robot to a client.
"""


def _convert_time(specified_time: Optional[int]) -> Optional[datetime]:
    if specified_time:
        return datetime.utcfromtimestamp(specified_time).isoformat()
    return None


def _format_calibrations(calibrations: List[Dict[str, Any]]) -> :
    formatted_calibrations = []
    for calInfo in calibrations:
        namespace, loadname, version =\
            lw_funcs.details_from_uri(calInfo.uri)
        if calInfo.module:
            parent = list(calInfo['module'].keys())[0]
        else:
            parent = calInfo.slot
        lw_offset = calInfo.calibration.offset
        modified = _convert_time(lw_offset.lastModified)
        offset = lw_models.OffsetData(
            value=lw_offset.value,
            lastModified=modified)

        tip_cal = calInfo.calibration.tipLength.
        modified = _convert_time(tip_cal.lastModified)
        tip_length = lw_models.TipData(
            value=tip_cal.value,
            lastModified=modified)

        cal_data = lw_models.CalibrationData(
            offset=offset, tipLength=tip_length)
        formatted_cal = lw_models.LabwareCalibration(
            valueType='labwareCalibration',
            calibrationId=calibration.labware_id,
            calibrationData=cal_data,
            loadName=loadname,
            namespace=namespace,
            version=version,
            parent=parent)
        formatted_calibrations.append(formatted_cal)
    return formatted_calibrations


def _grab_value(
        calibration: lw_funcs.CalibrationTypes,
        filtering: str,
        comparison: Union[str, int]) -> bool:
    ns, ln, ver = lw_funcs.details_from_uri(calibration.uri)
    if filtering == 'namespace':
        return ns == comparison
    if filtering == 'loadname':
        return ln == comparison
    if filtering == 'version':
        return ver == str(comparison)


def _check_parent(values: Dict[str, Any], parent: str) -> bool:
    mod = values['module']
    slot = values['slot']
    if slot == parent:
        return True
    if list(mod.keys())[0] == parent:
        return True
    return False


@router.get("/labware/calibrations",
            description="Fetch all saved labware calibrations from the robot",
            summary="Search the robot for any saved labware offsets"
                    "which allows you to check whether a particular"
                    "labware has been calibrated or not.",
            response_model=lw_models.Calibrations)
async def get_all_labware_calibrations(
        loadName: str = None,
        namespace: str = None,
        version: int = None,
        parent: str = None) -> lw_models.Calibrations:
    all_calibrations = lw_funcs.get_all_calibrations()

    if not all_calibrations:
        return lw_models.Calibrations(
            valueType='collection', value=all_calibrations)

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
    return lw_models.Calibrations(valueType='collection', value=calibrations)


@router.get("/labware/calibrations/{calibrationId}",
            description="Fetch one specific labware offset by ID",
            response_model=lw_models.LabwareCalibration,
            responses={status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}})
async def get_specific_labware_calibration(
        calibrationId: str) -> lw_models.LabwareCalibration:
    calibration: Dict[Any, Any] = {}
    for cal in lw_funcs.get_all_calibrations():
        if calibrationId == cal['id']:
            calibration = cal
            break
    if not calibration:
        error = Error(title='{calibrationId} does not exist.')
        raise RobotServerError(status_code=status.HTTP_404_NOT_FOUND,
                               error=error)

    formatted_calibrations = _format_calibrations([calibration])
    return formatted_calibrations[0]


@router.delete("/labware/calibrations/{calibrationId}",
               description="Delete one specific labware offset by ID",
               responses={
                   status.HTTP_404_NOT_FOUND: {"model": ErrorResponse}})
async def delete_specific_labware_calibration(calibrationId: str):
    try:
        lw_funcs.delete_offset_file(calibrationId)
    except (FileNotFoundError, KeyError):
        error = Error(title='{calibrationId} does not exist.')
        raise RobotServerError(status_code=status.HTTP_404_NOT_FOUND,
                               error=error)
