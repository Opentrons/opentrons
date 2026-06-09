"""Route handlers for ingesting log messages."""

import datetime
from logging import getLogger
from typing import Annotated

import fastapi

from server_utils.fastapi_utils.models.json_api import (
    PydanticResponse,
    RequestModel,
    SimpleBody,
)
from server_utils.keys.fastapi import get_key_client
from server_utils.keys.key_server import Client as KeyClient

from .models import SubmitAuditLogMessageData, SubmitAuditLogSuccessData

LOG = getLogger(__name__)

router = fastapi.APIRouter()


@PydanticResponse.wrap_route(
    router.post,
    path="/audit/internal/logMessage",
    summary="Log an audit message to the robot database.",
    responses={
        fastapi.status.HTTP_201_CREATED: {
            "model": SimpleBody[SubmitAuditLogSuccessData]
        }
    },
)
async def post_log_message(
    request_body: RequestModel[SubmitAuditLogMessageData],
    key_client: Annotated[KeyClient, fastapi.Depends(get_key_client)],
) -> PydanticResponse[SimpleBody[SubmitAuditLogSuccessData]]:
    """Log an audit message."""
    LOG.info(
        f"Logging action {request_body.data.action}: {request_body.data.message} from {request_body.data.accountName} for reason {request_body.data.reason}"
    )
    return await PydanticResponse.create(
        status_code=fastapi.status.HTTP_201_CREATED,
        content=SimpleBody(
            data=SubmitAuditLogSuccessData(loggedAt=datetime.datetime.utcnow())
        ),
    )
