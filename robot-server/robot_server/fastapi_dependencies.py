"""Shared FastAPI dependencies for robot_server."""

from datetime import datetime
from typing import Annotated, Any

from fastapi import Depends, status

from server_utils.auth.resource_server.authorization_checker import (
    AuthorizationChecker,
    DocumentedInteraction,
    MissingUserNotesError,
)
from server_utils.auth.resource_server.fastapi import get_authorization_checker
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.error_responses import ErrorSource
from robot_server.errors.global_errors import InvalidRequest
from robot_server.service.dependencies import get_current_time


async def maybe_record_documented_interaction(
    runId: str,
    request_body: RequestModel[Any],
    created_at: Annotated[datetime, Depends(get_current_time)],
    authorization_checker: Annotated[
        AuthorizationChecker, Depends(get_authorization_checker)
    ],
) -> None:
    """When auth-server requires it, require ``userNotes`` and record the interaction."""
    try:
        await authorization_checker.record_documented_interaction(
            DocumentedInteraction.from_request_model(request_body),
            resource_id=runId,
            recorded_at=created_at,
        )
    except MissingUserNotesError as e:
        raise InvalidRequest(
            detail=str(e),
            source=ErrorSource(pointer="/userNotes"),
        ).as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)
