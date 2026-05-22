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
from server_utils.fastapi_utils.documented_interaction import get_supplied_user_notes
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.error_responses import ErrorSource
from robot_server.errors.global_errors import InvalidRequest
from robot_server.service.dependencies import get_current_time


async def _record_documented_interaction(
    *,
    resource_id: str,
    request_data: object,
    user_notes: str | None,
    created_at: datetime,
    authorization_checker: AuthorizationChecker,
) -> None:
    try:
        await authorization_checker.record_documented_interaction(
            DocumentedInteraction(user_notes=user_notes, request_data=request_data),
            resource_id=resource_id,
            recorded_at=created_at,
        )
    except MissingUserNotesError as e:
        raise InvalidRequest(
            detail=str(e),
            source=ErrorSource(pointer="/userNotes"),
        ).as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)


async def maybe_record_documented_interaction(
    runId: str,
    request_body: RequestModel[Any],
    created_at: Annotated[datetime, Depends(get_current_time)],
    authorization_checker: Annotated[
        AuthorizationChecker, Depends(get_authorization_checker)
    ],
) -> None:
    """When auth-server requires it, require ``userNotes`` and record the interaction.

    For JSON:API bodies, ``userNotes`` is a top-level field on ``request_body``.
    """
    await _record_documented_interaction(
        resource_id=runId,
        request_data=request_body.data,
        user_notes=request_body.supplied_user_notes(),
        created_at=created_at,
        authorization_checker=authorization_checker,
    )


async def maybe_record_documented_interaction_non_json(
    resource_id: str,
    request_data: object,
    user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    created_at: Annotated[datetime, Depends(get_current_time)],
    authorization_checker: Annotated[
        AuthorizationChecker, Depends(get_authorization_checker)
    ],
) -> None:
    """When auth-server requires it, require ``userNotes`` and record the interaction.

    For POST, PUT, and PATCH requests that do not use ``RequestModel``, clients may
    supply ``userNotes`` as a query parameter or form field (see
    ``get_supplied_user_notes``). The route passes ``request_data`` describing what
    was mutated (for example upload metadata).
    """
    await _record_documented_interaction(
        resource_id=resource_id,
        request_data=request_data,
        user_notes=user_notes,
        created_at=created_at,
        authorization_checker=authorization_checker,
    )
