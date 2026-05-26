"""FastAPI helpers for audit notes supplied on mutating HTTP requests."""

from typing import Final

from fastapi import Request

from .models.json_api.request import parse_supplied_user_notes

_MUTATING_METHODS: Final = frozenset({"POST", "PUT", "PATCH", "DELETE"})

USER_NOTES_HEADER: Final[str] = "Opentrons-User-Notes"
"""Audit reason when ``requireReasonForInteraction`` is enabled."""


async def get_supplied_user_notes(request: Request) -> str | None:
    """Return normalized audit notes from the ``Opentrons-User-Notes`` request header."""
    if request.method not in _MUTATING_METHODS:
        return None

    return parse_supplied_user_notes(request.headers.get(USER_NOTES_HEADER))
