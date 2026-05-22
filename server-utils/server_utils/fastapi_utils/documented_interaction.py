"""FastAPI helpers for audit ``userNotes`` on non–JSON:API request bodies."""

from __future__ import annotations

from typing import Final

from fastapi import Request

from .models.json_api import parse_supplied_user_notes

_MUTATING_METHODS: Final = frozenset({"POST", "PUT", "PATCH"})


async def get_supplied_user_notes(request: Request) -> str | None:
    """Return normalized ``userNotes`` for POST, PUT, or PATCH requests.

    Notes may be supplied as:

    - a ``userNotes`` query parameter, or
    - a ``userNotes`` form field on ``multipart/form-data`` or
      ``application/x-www-form-urlencoded`` bodies.

    JSON:API endpoints should continue to use top-level ``userNotes`` on
    ``RequestModel`` instead of this dependency.
    """
    if request.method not in _MUTATING_METHODS:
        return None

    if "userNotes" in request.query_params:
        return parse_supplied_user_notes(request.query_params.get("userNotes"))

    content_type = request.headers.get("content-type", "")
    if not (
        "multipart/form-data" in content_type
        or "application/x-www-form-urlencoded" in content_type
    ):
        return None

    form = await request.form()
    form_notes = form.get("userNotes")
    if isinstance(form_notes, str):
        return parse_supplied_user_notes(form_notes)
    return None
