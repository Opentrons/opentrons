from typing import Any

from fastapi import APIRouter, Depends
from starlette import status

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from robot_server.errors.robot_errors import NotSupportedOnFlex

router = APIRouter()


@router.get(
    "/calibration/tip_length",
    description="Fetch all saved tip length calibrations from the robot",
    summary="This is an OT-2 only route and returns 403 on Flex.",
    status_code=status.HTTP_403_FORBIDDEN,
)
async def get_all_tip_length_calibrations(
    tiprack_hash: Any = None,
    pipette_id: Any = None,
    tiprack_uri: Any = None,
) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)


@router.delete(
    "/calibration/tip_length",
    description="Delete one specific tip length calibration by pipette "
    "serial and tiprack uri",
    summary="This is an OT-2 only route and returns 403 on Flex.",
    status_code=status.HTTP_403_FORBIDDEN,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_SETTINGS_WRITE)),
        Depends(get_audit_logger("delete tip length calibration")),
    ],
)
async def delete_specific_tip_length_calibration(
    pipette_id: Any,
    tiprack_hash: Any = None,
    tiprack_uri: Any = None,
) -> None:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)
