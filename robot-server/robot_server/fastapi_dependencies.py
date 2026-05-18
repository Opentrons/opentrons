"""Shared FastAPI dependencies for robot_server."""

import logging
from datetime import datetime
from typing import Annotated, Any, Optional, cast

from fastapi import Depends

from server_utils.auth.resource_server.auth_server import Client
from server_utils.auth.resource_server.fastapi import get_auth_server_client
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.service.dependencies import get_current_time

log = logging.getLogger(__name__)


async def get_require_reason_for_interaction_enabled(
    auth_client: Annotated[Optional[Client], Depends(get_auth_server_client)],
) -> bool:
    """Return whether auth-server is configured to require a reason for interaction."""
    if auth_client is None:
        return False
    response = await auth_client.get_require_reason_for_interaction_settings()
    return response.data.requireReasonForInteraction


async def maybe_log_user_action_notes_when_setting_requires(
    runId: str,
    request_body: RequestModel[Any],
    created_at: Annotated[datetime, Depends(get_current_time)],
    require_reason_for_interaction: Annotated[
        bool, Depends(get_require_reason_for_interaction_enabled)
    ],
) -> None:
    """When auth-server requires reasons for interaction, log actions that carry ``userNotes``."""
    if not require_reason_for_interaction:
        return
    log_user_action_notes(
        runId,
        request_body,
        created_at,
        body_has_user_notes=request_body_has_supplied_user_notes(request_body),
    )


def request_body_has_supplied_user_notes(request_body: RequestModel[Any]) -> bool:
    """Determine if the request body has a non-empty ``userNotes`` field."""
    notes = request_body.userNotes
    if notes is None:
        return False
    if isinstance(notes, str) and notes.strip() == "":
        return False
    return True


def log_user_action_notes(
    runId: str,
    request_body: RequestModel[Any],
    created_at: datetime,
    *,
    body_has_user_notes: bool,
) -> None:
    """Log (and later persist) when the request includes ``userNotes``."""
    if not body_has_user_notes:
        return
    text = cast(str, request_body.userNotes)
    # TODO(TZ, 5-8-26): persist audit entry.
    log.info(
        "Run action with userNotes "
        "(persist audit entry TODO): run_id=%s recorded_at=%s note_len=%s",
        runId,
        created_at.isoformat(),
        len(text),
    )
