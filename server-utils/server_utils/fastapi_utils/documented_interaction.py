"""FastAPI helpers for audit notes supplied on mutating HTTP requests."""

import urllib.parse
from typing import Final

from fastapi import Request

_MUTATING_METHODS: Final = frozenset({"POST", "PUT", "PATCH", "DELETE"})

USER_NOTES_HEADER: Final[str] = "Opentrons-User-Notes"


# todo(mm, 2026-07-13): Move this documentation into OpenAPI somehow.
async def get_supplied_user_notes(request: Request) -> str | None:
    """Extract the value of the `Opentrons-User-Notes` request header.

    When `requireReasonForInteraction` is enabled, this header carries the user-provided
    reason for interaction.

    HTTP headers have strict charset limits; this header should be percent-encoded UTF-8
    (see: https://www.rfc-editor.org/rfc/rfc3986.html#section-2.1).

    If the value only contains whitespace (after decoding), it's treated the same
    as if it's not present.
    """
    if request.method not in _MUTATING_METHODS:
        return None

    raw = request.headers.get(USER_NOTES_HEADER, "")
    decoded = urllib.parse.unquote(raw)
    stripped = decoded.strip()
    return stripped if stripped else None
