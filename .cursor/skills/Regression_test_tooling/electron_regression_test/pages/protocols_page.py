from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

from automation.helpers.app_readiness import click_when_ui_ready
from automation.helpers.screenshot_helper import ScreenshotHelper


class ProtocolsPage:
    PROTOCOL_TABS = ("Parameters", "Hardware", "Labware", "Liquids")
    # Electron serves the SPA from file://…/index.html with hash routing (#/protocols/…).
    PROTOCOLS_LANDING_URL = re.compile(r"#/protocols/?$")
    PROTOCOL_DETAIL_URL = re.compile(r"#/protocols/.+")

    def __init__(self, page: Page, shots: ScreenshotHelper | None = None):
        self.page = page
        self.shots = shots

    @property
    def nav_link(self):
        return self.page.get_by_role("link", name="Protocols")

    def navigate_landing(self):
        click_when_ui_ready(self.page, self.nav_link)
        self.page.wait_for_url(self.PROTOCOLS_LANDING_URL)
        expect(self.nav_link).to_have_attribute("aria-current", "page")

    def protocol_card(self, protocol_name: str) -> Locator:
        """First card for this display name (duplicate imports share the same test id)."""
        return self.page.get_by_test_id(
            re.compile(rf"^ProtocolCard_{re.escape(protocol_name)}$")
        ).first

    def _scroll_to_protocol_card(self, protocol_name: str) -> Locator:
        card = self.protocol_card(protocol_name)
        for _ in range(60):
            if card.count() > 0 and card.is_visible():
                break
            self.page.mouse.wheel(0, 400)
            self.page.wait_for_timeout(150)
        card.scroll_into_view_if_needed()
        return card

    def open(self, protocol_name: str):
        self.navigate_landing()
        card = self._scroll_to_protocol_card(protocol_name)
        card.click()
        self.page.wait_for_url(self.PROTOCOL_DETAIL_URL)

    def tab_button(self, name: str):
        return self.page.get_by_role("button", name=name, exact=True)

    def tab(self, name: str):
        self.tab_button(name).click()

    def validate_all_tabs(self):
        for tab in self.PROTOCOL_TABS:
            tab_button = self.tab_button(tab)
            if tab_button.count() == 0:
                continue
            self.tab(tab)
            expect(tab_button).to_be_visible()

    def capture_all_tabs(self):
        if self.shots is None:
            raise RuntimeError("Pass a ScreenshotHelper to ProtocolsPage for capture_all_tabs()")
        for tab in self.PROTOCOL_TABS:
            self.tab(tab)
            self.shots.capture("protocols", tab.lower())
