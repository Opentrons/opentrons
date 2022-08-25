"""Deprecated calibration routes.

As of the v5 software release, these endpoints do not function.
All labware offsets are set via `/run` endpoints.
"""
from typing import Optional

from fastapi import APIRouter, status

from robot_server.errors import ErrorBody
from robot_server.service.labware import models as lw_models
from robot_server.service.errors import RobotServerError, CommonErrorDef


router = APIRouter()


@router.get(
    "/labware/calibrations",
    summary="Fetch all saved labware calibrations from the robot",
    description="Search the robot for any saved labware offsets "
    "which allows you to check whether a particular "
    "labware has been calibrated or not.",
    response_model=lw_models.MultipleCalibrationsResponse,
)
async def get_all_labware_calibrations(
    loadName: Optional[str] = None,
    namespace: Optional[str] = None,
    version: Optional[int] = None,
    parent: Optional[str] = None,
) -> lw_models.MultipleCalibrationsResponse:
    return lw_models.MultipleCalibrationsResponse(data=[], links=None)


@router.get(
    "/labware/calibrations/{calibrationId}",
    description="Fetch one specific labware offset by ID",
    response_model=lw_models.SingleCalibrationResponse,
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorBody}},
)
async def get_specific_labware_calibration(
    calibrationId: str,
) -> lw_models.SingleCalibrationResponse:
    raise RobotServerError(
        definition=CommonErrorDef.RESOURCE_NOT_FOUND,
        resource="calibration",
        id=calibrationId,
    )


@router.delete(
    "/labware/calibrations/{calibrationId}",
    description="Delete one specific labware offset by ID",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorBody}},
)
async def delete_specific_labware_calibration(calibrationId: str):
    raise RobotServerError(
        definition=CommonErrorDef.RESOURCE_NOT_FOUND,
        resource="calibration",
        id=calibrationId,
    )
