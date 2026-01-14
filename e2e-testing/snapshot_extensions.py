"""Syrupy snapshot extensions for e2e-testing.

This module provides helpers to normalize volatile data (timestamps, build dates, etc.)
from exported Protocol Designer artifacts before snapshot comparison.
"""

from __future__ import annotations

import re

from syrupy.extensions.amber import AmberSnapshotExtension

_ISO_Z_TIMESTAMP_RE = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z")
# Example: Mon, 12 Jan 2026 20:27:33 GMT
_RFC1123_GMT_RE = re.compile(r"[A-Za-z]{3},\s\d{2}\s[A-Za-z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT")


def _normalize_pd_export_text(text: str) -> str:
    # Normalize newlines first so snapshots are consistent across OSes.
    normalized = text.replace("\r\n", "\n")

    # Replace common volatile fields in the top-level JSON.
    normalized = re.sub(
        r"(\"created\"\s*:\s*)\"[^\"]+\"",
        r'\1"<created>"',
        normalized,
    )
    normalized = re.sub(
        r"(\"lastModified\"\s*:\s*)\"[^\"]+\"",
        r'\1"<lastModified>"',
        normalized,
    )
    normalized = re.sub(
        r"(\"internalAppBuildDate\"\s*:\s*)\"[^\"]+\"",
        r'\1"<internalAppBuildDate>"',
        normalized,
    )

    # Replace any remaining timestamp-like strings (defensive).
    normalized = _ISO_Z_TIMESTAMP_RE.sub("<timestamp>", normalized)
    normalized = _RFC1123_GMT_RE.sub("<rfc1123_gmt>", normalized)

    # Some exported files contain embedded JSON strings with epoch-ms timestamps.
    # Replace values like: "created": 1700000000000
    normalized = re.sub(
        r"(\"created\"\s*:\s*)\d{13}",
        r"\1<created_epoch_ms>",
        normalized,
    )
    normalized = re.sub(
        r"(\"lastModified\"\s*:\s*)\d{13}",
        r"\1<lastModified_epoch_ms>",
        normalized,
    )

    return normalized


class PDProtocolExportSnapshotExtension(AmberSnapshotExtension):
    """Syrupy extension for PD exported protocol text.

    Use via: `snapshot.use_extension(PDProtocolExportSnapshotExtension)`.
    """

    def serialize(self, data: object, **kwargs: object) -> str:  # type: ignore[override]
        if isinstance(data, str):
            data = _normalize_pd_export_text(data)
        return super().serialize(data, **kwargs)
