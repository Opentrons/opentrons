"""FastAPI helpers for audit notes supplied on mutating HTTP requests."""

from typing import Final

from fastapi import Request

_MUTATING_METHODS: Final = frozenset({"POST", "PUT", "PATCH", "DELETE"})

USER_NOTES_HEADER: Final[str] = "Opentrons-User-Notes"
"""Audit reason when ``requireReasonForInteraction`` is enabled."""

# TODO(TZ, 5-26-26): Support encoded header values (e.g. ``b64:`` prefix + base64) so clients can
# send arbitrary Unicode and control characters, not only printable ASCII.
# https://opentrons.atlassian.net/browse/EXEC-2727


async def get_supplied_user_notes(request: Request) -> str | None:
    """Return normalized audit notes from the ``Opentrons-User-Notes`` request header."""
    if request.method not in _MUTATING_METHODS:
        return None

    return _parse_supplied_user_notes(request.headers.get(USER_NOTES_HEADER))


def _parse_supplied_user_notes(user_notes: str | None) -> str | None:
    """Return non-empty audit notes, or ``None`` if absent or whitespace-only."""
    if user_notes is None:
        return None
    stripped = user_notes.strip()
    return stripped if stripped else None
