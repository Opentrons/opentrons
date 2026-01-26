"""Module for Protocol Designer /info page interactions."""

from __future__ import annotations

from playwright.sync_api import Page, expect

from .base_page import BasePage


class InfoPage(BasePage):
    """Page object for the Protocol Designer build info page (/info)."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def get_version(self) -> str:
        """Return the displayed app version string."""

        version_el = self.page.locator("div.version")
        expect(version_el).to_be_visible()
        return version_el.first.inner_text().strip()
