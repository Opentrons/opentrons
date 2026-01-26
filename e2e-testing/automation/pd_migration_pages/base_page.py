"""Base classes for migration POM.

The migration export tool uses a pared-down POM that only needs a Playwright
`Page` and a handful of high-signal selectors.
"""

from __future__ import annotations

from playwright.sync_api import Page


class MigrationBasePage:
    """Base page object for migration flows."""

    def __init__(self, page: Page) -> None:
        self.page = page
