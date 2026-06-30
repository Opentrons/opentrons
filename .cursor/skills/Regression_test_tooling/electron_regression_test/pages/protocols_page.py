"""Page object for the Protocols landing and protocol detail tabs."""

from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

from automation.helpers.left_nav import link, navigate_to
from automation.helpers.list_scroll import scroll_until_visible
from automation.helpers.page_helpers import require_helper
from automation.helpers.screenshot_helper import ScreenshotHelper


class ProtocolsPage:
    """Open protocols from the landing page and exercise detail tabs."""

    PROTOCOL_TABS = ("Parameters", "Hardware", "Labware", "Liquids")
    # Electron serves the SPA from file://…/index.html with hash routing (#/protocols/…).
    PROTOCOLS_LANDING_URL = re.compile(r"#/protocols/?$")
    PROTOCOL_DETAIL_URL = re.compile(r"#/protocols/.+")

    def __init__(self, page: Page, shots: ScreenshotHelper | None = None):
        """Bind the page and optional screenshot helper."""
        self.page = page
        self.shots = shots

    @property
    def nav_link(self):
        """Left-nav Protocols link."""
        return link(self.page, "Protocols", first=True)

    def navigate_landing(self):
        """Open the Protocols landing page from anywhere in the app."""
        if self.PROTOCOLS_LANDING_URL.search(self.page.url):
            expect(self.nav_link).to_have_attribute("aria-current", "page")
            return

        if self.PROTOCOL_DETAIL_URL.search(self.page.url):
            link(self.page, "Protocols").nth(1).click()
        else:
            navigate_to(self.page, "Protocols", self.PROTOCOLS_LANDING_URL, first=True)
            return

        self.page.wait_for_url(self.PROTOCOLS_LANDING_URL)
        expect(self.nav_link).to_have_attribute("aria-current", "page")

    def protocol_card(self, protocol_name: str) -> Locator:
        """First card for this display name (duplicate imports share the same test id)."""
        return self.page.get_by_test_id(
            re.compile(rf"^ProtocolCard_{re.escape(protocol_name)}$")
        ).first

    def open(self, protocol_name: str):
        """Open a protocol detail page from the landing list."""
        self.navigate_landing()
        card = scroll_until_visible(self.page, self.protocol_card(protocol_name))
        card.click()
        self.page.wait_for_url(self.PROTOCOL_DETAIL_URL)

    def tab_button(self, name: str):
        """Return the detail-tab button locator for ``name``."""
        return self.page.get_by_role("button", name=name, exact=True)

    def tab(self, name: str):
        """Click a protocol detail tab by visible name."""
        self.tab_button(name).click()

    def validate_all_tabs(self):
        """Click each present protocol detail tab and assert it stays visible."""
        for tab in self.PROTOCOL_TABS:
            tab_button = self.tab_button(tab)
            if tab_button.count() == 0:
                continue
            self.tab(tab)
            expect(tab_button).to_be_visible()

    def capture_all_tabs(self):
        """Screenshot each protocol detail tab."""
        shots = require_helper(
            self.shots, "ScreenshotHelper", owner="ProtocolsPage", method="capture_all_tabs"
        )
        for tab in self.PROTOCOL_TABS:
            self.tab(tab)
            shots.capture("protocols", tab.lower())
