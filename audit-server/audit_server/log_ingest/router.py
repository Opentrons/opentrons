"""Route handlers for ingesting log messages."""

import datetime
from logging import getLogger
from typing import Annotated

import aiohttp
import fastapi

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)
from server_utils.keys.fastapi import get_key_client
from server_utils.keys.key_server import Client as KeyClient
from server_utils.keys.key_server import SignMessageData

from .models import (
    AuditLogMessage,
    SubmitAuditLogMessageData,
    SubmitAuditLogSuccessData,
)

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
    },
)
async def post_log_message(
    request_body: RequestModel[SubmitAuditLogMessageData],
    key_client: Annotated[KeyClient, fastapi.Depends(get_key_client)],
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
        signed_message = await key_client.sign_message(
            SignMessageData(message=message_str, previousHash=None)
        )
    except aiohttp.ClientConnectionError as exc:
        # The key-server is unreachable. We refuse to ingest the message rather
        # than persisting it without a signature, so callers can retry once the
        # key-server is back up.
        LOG.warning("Key-server is unreachable: %s", exc)
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Audit log message could not be signed: key-server is unavailable."
            ),
        ) from exc
    LOG.info(
        f"Logged message={signed_message.message} hash={signed_message.messageHash} sig={signed_message.messageSignature} ver={signed_message.signatureVersion}"
    )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(data=SubmitAuditLogSuccessData(loggedAt=ingest_time)),
    )
