"""Shared FastAPI dependencies for robot_server."""

import logging
from datetime import datetime
from typing import Annotated, Any

from fastapi import Depends, status

from server_utils.auth.resource_server.auth_server import (
    RequireReasonForInteractionSettingsResponse,
)
from server_utils.auth.resource_server.fastapi import (
    get_require_reason_for_interaction_settings,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.global_errors import InvalidRequest
from robot_server.service.dependencies import get_current_time

log = logging.getLogger(__name__)


async def maybe_log_user_action_notes_when_setting_requires(
    runId: str,
    request_body: RequestModel[Any],
    created_at: Annotated[datetime, Depends(get_current_time)],
    require_reason_settings: Annotated[
        RequireReasonForInteractionSettingsResponse,
        Depends(get_require_reason_for_interaction_settings),
    ],
) -> None:
    """When require-reason is on, require ``userNotes`` on run actions and log supplied notes."""
    if not require_reason_settings.data.requireReasonForInteraction:
        return

    user_notes = request_body.supplied_user_notes()
    if user_notes is None:
        raise InvalidRequest(
            detail=(
                "userNotes is required when require-reason-for-interaction is enabled."
            ),
        ).as_error(status.HTTP_422_UNPROCESSABLE_ENTITY)

    if user_notes is not None:
        log_user_action_notes(runId, user_notes, created_at)


def log_user_action_notes(
    runId: str,
    user_notes: str,
    created_at: datetime,
) -> None:
    """Log (and later persist) when the request includes ``userNotes``."""
    # TODO(TZ, 5-8-26): persist audit entry.
    log.info(
        "Run action with userNotes "
        "(persist audit entry TODO): run_id=%s recorded_at=%s note_len=%s",
        runId,
        created_at.isoformat(),
        len(user_notes),
    )
