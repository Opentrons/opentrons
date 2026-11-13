from typing import Any

from fastapi import APIRouter, Depends
from starlette import status

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from robot_server.errors.robot_errors import NotSupportedOnFlex

router = APIRouter()


@router.get(
    "/calibration/pipette_offset",
    summary="Get all pipette offset calibrations",
    description="This is an OT-2 only route and returns 403 on Flex.",
    response_model=Any,
    status_code=status.HTTP_403_FORBIDDEN,
)
async def get_all_pipette_offset_calibrations(
    pipette_id: Any = None,
    mount: Any = None,
) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)


@router.delete(
    "/calibration/pipette_offset",
    summary="Delete a pipette offset calibration",
    description="This is an OT-2 only route and returns 403 on Flex.",
    status_code=status.HTTP_403_FORBIDDEN,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("delete pipette offset")),
    ],
)
async def delete_specific_pipette_offset_calibration(
    pipette_id: Any, mount: Any
) -> None:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)
