"""Shared FastAPI dependencies for robot_server."""

import logging
from datetime import datetime
from typing import Annotated, cast

from fastapi import Depends
from pydantic import BaseModel

from robot_server.runs.action_models import CreateRunActionRequest

log = logging.getLogger(__name__)

def request_body_has_supplied_user_notes(request_body: BaseModel) -> bool:
    """Determine if the request body has a non-empty ``userNotes`` field."""
    notes = getattr(request_body, "userNotes", None)
    if notes is None:
        return False
    if isinstance(notes, str) and notes.strip() == "":
        return False
    return True


def log_run_action_play_user_notes(
    runId: str,
    request_body: CreateRunActionRequest,
    created_at: datetime,
    body_has_user_notes: Annotated[bool, Depends(request_body_has_supplied_user_notes)],
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
