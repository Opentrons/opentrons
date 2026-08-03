"""Route handlers for ingesting log messages."""

import datetime
from logging import getLogger
from pathlib import Path
from typing import Annotated

import fastapi
from opentrons_shared_data.errors.exceptions import (
    AuditLoggingError,
    KeyStorageUnavailableError,
)

from server_utils.audit.fastapi import get_supplied_user_notes, skip_audit_logger
from server_utils.auth.resource_server.fastapi import (
    RequireAuthenticationResult,
    require_authentication,
    require_scopes,
)
from server_utils.auth.resource_server.types import AuthenticationNotRequiredResult
from server_utils.auth.scopes import Scope
from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)

from .dependency import get_robot_logs_directory
from .models import (
    AuditLogMessage,
    StoreRobotLogResponseData,
    SubmitAuditLogMessageData,
    SubmitAuditLogSuccessData,
    SubmitExternalAuditLogMessageData,
)
from audit_server.log_storage.dependency import get_log_data_manager
from audit_server.log_storage.log_data_manager import LogDataManager

LOG = getLogger(__name__)

router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.post,
    path="/audit/internal/logMessage",
    summary="Log an audit message to the robot database.",
    responses={
        fastapi.status.HTTP_201_CREATED: {
            "model": SimpleBody[SubmitAuditLogSuccessData]
        },
        fastapi.status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": (
                "Key-server could not be reached, so the audit log message"
                " could not be signed."
            ),
        },
        fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "The audit log request failed for an unknown reason."
        },
    },
    dependencies=[fastapi.Depends(skip_audit_logger)],
)
async def post_log_message(
    request_body: RequestModel[SubmitAuditLogMessageData],
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
) -> PydanticResponse[SimpleBody[SubmitAuditLogSuccessData]]:
    """Log an audit message."""
    ingest_time = datetime.datetime.now(datetime.timezone.utc)
    message = AuditLogMessage(
        action=request_body.data.action,
        accountName=request_body.data.accountName,
        legalName=request_body.data.legalName,
        message=request_body.data.message,
        reason=request_body.data.reason,
        loggedAt=ingest_time,
    )
    message_str = message.model_dump_json(indent=None)
    try:
        await log_data_manager.store_log(message_str)
    except KeyStorageUnavailableError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Audit log message could not be signed: key-server is unavailable."
            ),
        ) from exc
    except AuditLoggingError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audit log could not be stored.",
        ) from exc
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(data=SubmitAuditLogSuccessData(loggedAt=ingest_time)),
    )


@PydanticResponse.wrap_route(
    router.post,
    path="/audit/external/logMessage",
    summary="Log an external audit message to the robot database. Use this endpoint to log messages not associated with robot actions.",
    responses={
        fastapi.status.HTTP_201_CREATED: {
            "model": SimpleBody[SubmitAuditLogSuccessData]
        },
        fastapi.status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": (
                "Key-server could not be reached, so the audit log message"
                " could not be signed."
            ),
        },
        fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "description": "The audit log request failed for an unknown reason."
        },
    },
    dependencies=[
        fastapi.Depends(require_scopes(Scope.AUDIT_LOG_WRITE)),
        fastapi.Depends(skip_audit_logger),
    ],
)
async def post_external_log_message(
    request_body: RequestModel[SubmitExternalAuditLogMessageData],
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
    user_notes: Annotated[str | None, fastapi.Depends(get_supplied_user_notes)],
    authentication: Annotated[
        RequireAuthenticationResult, fastapi.Depends(require_authentication)
    ],
) -> PydanticResponse[SimpleBody[SubmitAuditLogSuccessData]]:
    """Log an external audit message."""
    ingest_time = datetime.datetime.now(datetime.timezone.utc)
    if isinstance(authentication, AuthenticationNotRequiredResult):
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_418_IM_A_TEAPOT,
            detail=(
                "Audit log is not available while Compliance Ready Software is inactive."
            ),
        )

    message = AuditLogMessage(
        action=f"External-{request_body.data.action}",
        accountName=authentication.username,
        legalName=authentication.fullname,
        message=request_body.data.message,
        reason=user_notes,
        loggedAt=ingest_time,
    )
    message_str = message.model_dump_json(indent=None)
    try:
        await log_data_manager.store_log(message_str)
    except KeyStorageUnavailableError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Audit log message could not be signed: key-server is unavailable."
            ),
        ) from exc
    except AuditLoggingError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Audit log could not be stored.",
        ) from exc
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(data=SubmitAuditLogSuccessData(loggedAt=ingest_time)),
    )


@PydanticResponse.wrap_route(
    router.post,
    path="/audit/internal/storeRobotLog",
    summary="Store a robot's run record and associate it with the"
    " current log period, if logging is enabled.",
    responses={
        fastapi.status.HTTP_201_CREATED: {
            "model": SimpleBody[StoreRobotLogResponseData]
        },
        fastapi.status.HTTP_503_SERVICE_UNAVAILABLE: {
            "description": (
                "Key-server could not be reached, so the robot log contents"
                " could not be signed."
            ),
        },
    },
)
async def store_robot_log(
    log_data_manager: Annotated[LogDataManager, fastapi.Depends(get_log_data_manager)],
    robot_logs_directory: Annotated[Path, fastapi.Depends(get_robot_logs_directory)],
    file: Annotated[
        fastapi.UploadFile, fastapi.File(description="Data file to upload")
    ],
) -> PydanticResponse[SimpleBody[StoreRobotLogResponseData]]:
    """Store a robot log with the current log period."""
    try:
        stored_robot_log = await log_data_manager.store_robot_log(
            robot_log=file, robot_log_path=robot_logs_directory
        )
    except KeyStorageUnavailableError as exc:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Audit log message could not be signed: key-server is unavailable."
            ),
        ) from exc
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(
            data=StoreRobotLogResponseData(loggingEnabled=stored_robot_log is not None)
        ),
    )
