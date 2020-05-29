from typing import Dict, List, Any, Optional, Union

import time
from starlette import status
from fastapi import APIRouter
from functools import partial

from opentrons.protocol_api import labware as lw_funcs

from robot_server.service.models import V1BasicResponse, labware as lw_models
from robot_server.service.errors import V1HandlerError

router = APIRouter()


"""
These routes serve the current labware offsets on the robot to a client.
"""


def _convert_time(specified_time: int):
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(specified_time))


def _format_calibrations(calibrations: List[Dict[str, Any]]):
    formatted_calibrations = []
    for calibration in calibrations:
        namespace, loadname, version =\
            lw_funcs.details_from_uri(calibration['uri'])
        if calibration['module']:
            parent = list(calibration['module'].keys())[0]
        else:
            parent = calibration['slot']
        lw_offset = calibration['calibration']['default']
        modified = _convert_time(lw_offset['lastModified'])
        offset = lw_models.OffsetData(
            value=lw_offset['offset'],
            lastModified=modified)
        if calibration['calibration'].get('tipLength'):
            tip_difference = calibration['calibration']['tipLength']
            modified = _convert_time(tip_difference['lastModified'])
            tip_length: Optional[lw_models.TipData] = lw_models.TipData(
                value=tip_difference['length'],
                lastModified=modified)
        else:
            tip_length = None
        cal_data = lw_models.CalibrationData(
            offset=offset, tipLength=tip_length)
        formatted_cal = lw_models.LabwareCalibration(
            valueType='labwareCalibration',
            calibrationId=calibration['id'],
            calibrationData=cal_data,
            loadName=loadname,
            namespace=namespace,
            version=version,
            parent=parent)
        formatted_calibrations.append(formatted_cal)
    return formatted_calibrations


def _grab_value(
        calibration: Dict, filtering: str, comparison: Union[str, int]):
    ns, ln, ver = lw_funcs.details_from_uri(calibration['uri'])
    if filtering == 'namespace':
        return ns == comparison
    if filtering == 'loadname':
        return ln == comparison
    if filtering == 'version':
        return ver == str(comparison)


def _check_parent(values: Dict[str, Any], parent: str):
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
            response_model=lw_models.Calibrations,
            status_code=status.HTTP_200_OK)
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
            responses={status.HTTP_404_NOT_FOUND: {"model": V1BasicResponse}})
async def get_specific_labware_calibration(
        calibrationId: str) -> lw_models.LabwareCalibration:
    calibration: Dict[Any, Any] = {}
    for cal in lw_funcs.get_all_calibrations():
        if calibrationId == cal['id']:
            calibration = cal
    if not calibration:
        raise V1HandlerError(status_code=status.HTTP_404_NOT_FOUND,
                             message=f'{calibrationId} does not exist.')

    formatted_calibrations = _format_calibrations([calibration])
    return formatted_calibrations[0]


@router.delete("/labware/calibrations/{calibrationId}",
               description="Delete one specific labware offset by ID",
               response_model=V1BasicResponse,
               responses={
                   status.HTTP_404_NOT_FOUND: {"model": V1BasicResponse}})
async def delete_specific_labware_calibration(calibrationId: str):
    try:
        lw_funcs.delete_offset_file(calibrationId)
    except FileNotFoundError:
        raise V1HandlerError(status_code=status.HTTP_404_NOT_FOUND,
                             message=f'{calibrationId} does not exist.')
