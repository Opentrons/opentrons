from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from starlette import status

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from robot_server.errors.error_responses import ErrorBody
from robot_server.hardware import get_ot2_hardware
from robot_server.service.pipette_offset import models as pip_models

router = APIRouter()


@router.get(
    "/calibration/pipette_offset",
    summary="Get all pipette offset calibrations",
    description="Fetch all saved pipette offset calibrations from the robot",
    response_model=pip_models.MultipleCalibrationsResponse,
)
async def get_all_pipette_offset_calibrations(
    _: Annotated[None, Depends(get_ot2_hardware)],
    pipette_id: Optional[str] = None,
    mount: Optional[pip_models.MountType] = None,
) -> pip_models.MultipleCalibrationsResponse:
    # get_ot2_hardware should always raise and we never get here
    raise NotImplementedError()


@router.delete(
    "/calibration/pipette_offset",
    summary="Delete a pipette offset calibration",
    description="Delete one specific pipette calibration by pipette serial and mount.",
    responses={status.HTTP_404_NOT_FOUND: {"model": ErrorBody}},
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("delete pipette offset")),
    ],
)
async def delete_specific_pipette_offset_calibration(
    pipette_id: str,
    mount: pip_models.MountType,
    _: Annotated[None, Depends(get_ot2_hardware)],
) -> None:
    # get_ot2_hardware should always raise and we never get here
    raise NotImplementedError()
