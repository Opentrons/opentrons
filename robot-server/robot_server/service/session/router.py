from typing import Any

from fastapi import APIRouter, Depends, status

from server_utils.audit.fastapi import get_audit_logger
from server_utils.auth.resource_server.fastapi import require_scopes
from server_utils.auth.scopes import Scope

from robot_server.errors.robot_errors import NotSupportedOnFlex

router = APIRouter()


PATH_SESSION_BY_ID = "/sessions/{sessionId}"


@router.post(
    "/sessions",
    summary="Create an OT-2 calibration session",
    description=("This is an OT-2 only endpoint and always returns 403 on Flex."),
    deprecated=True,
    status_code=status.HTTP_403_FORBIDDEN,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("make ot-2 calibration session")),
    ],
)
async def create_session_handler(
    create_request: Any,
) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)


@router.delete(
    PATH_SESSION_BY_ID,
    summary="Delete an OT-2 calibration session",
    description=("This is an OT-2 only endpoint and always returns 403 on Flex."),
    deprecated=True,
    status_code=status.HTTP_403_FORBIDDEN,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("delete ot2- calibration session")),
    ],
)
async def delete_session_handler(sessionId: Any) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)


@router.get(
    PATH_SESSION_BY_ID,
    summary="Get an OT-2 calibration session",
    description=("This is an OT-2 only endpoint and always returns 403 on Flex."),
    deprecated=True,
    status_code=status.HTTP_403_FORBIDDEN,
)
async def get_session_handler(sessionId: Any) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)


@router.get(
    "/sessions",
    summary="Get all OT-2 calibration sessions",
    description=("This is an OT-2 only endpoint and always returns 403 on Flex."),
    deprecated=True,
    status_code=status.HTTP_403_FORBIDDEN,
)
async def get_sessions_handler(session_type: Any = None) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)


@router.post(
    f"{PATH_SESSION_BY_ID}/commands/execute",
    summary="Execute an OT-2 calibration command",
    description=("This is an OT-2 only endpoint and always returns 403 on Flex."),
    deprecated=True,
    dependencies=[
        Depends(require_scopes(Scope.ROBOT_CONTROL_WRITE)),
        Depends(get_audit_logger("execute OT-2 calibration command")),
    ],
)
async def session_command_execute_handler(sessionId: Any, command_request: Any) -> Any:
    raise NotSupportedOnFlex(
        detail="This route is only available on an OT-2."
    ).as_error(status.HTTP_403_FORBIDDEN)
