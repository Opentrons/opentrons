"""Migration-specific page objects and action selectors.

This package contains a small, version-aware Page Object Model (POM) used by the
migration export tooling in `tests/migration_report.py`.

We keep migration automation separate from the main PD e2e page objects because
PD UI selectors can vary across released versions.
"""

from __future__ import annotations

from playwright.sync_api import Page

from .actions import MigrationActions
from .selector import get_migration_actions

__all__ = [
    "MigrationActions",
    "get_migration_actions",
    "Page",
]
