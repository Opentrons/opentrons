"""Route handlers for ingesting log messages."""

import datetime
from logging import getLogger
from typing import Annotated

import fastapi
from opentrons_shared_data.errors.exceptions import (
    AuditLoggingError,
    KeyStorageUnavailableError,
)

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)

from .models import (
    AuditLogMessage,
    SubmitAuditLogMessageData,
    SubmitAuditLogSuccessData,
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
