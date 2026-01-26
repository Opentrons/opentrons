"""Version selector for migration action implementations."""

from __future__ import annotations

import re
from dataclasses import dataclass

from playwright.sync_api import Page

from .actions import MigrationActions
from .v8_7_x import MigrationActionsV8_7_X
from .v8_8_x import MigrationActionsV8_8_X


@dataclass(frozen=True, slots=True)
class ParsedVersion:
    """Best-effort parse of a PD version string."""

    major: int
    minor: int
    patch: int


_VERSION_RE = re.compile(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)")


def _parse_version(version: str) -> ParsedVersion | None:
    match = _VERSION_RE.match(version.strip())
    if match is None:
        return None
    return ParsedVersion(
        major=int(match.group("major")),
        minor=int(match.group("minor")),
        patch=int(match.group("patch")),
    )


def get_migration_actions(version: str, page: Page) -> MigrationActions:
    """Return the correct migration actions for the given PD app version."""

    parsed = _parse_version(version)
    if parsed is None:
        # Fall back to latest known flow for non-semver versions.
        # (e.g. dev builds).
        return MigrationActionsV8_8_X(page)

    if parsed.major == 8 and parsed.minor == 7:
        return MigrationActionsV8_7_X(page)
    if parsed.major == 8 and parsed.minor >= 8:
        return MigrationActionsV8_8_X(page)

    # Default to newest behavior we support.
    return MigrationActionsV8_8_X(page)
