"""Page object for the Protocols landing and protocol detail tabs."""

from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

from automation.app_helpers.app_readiness import dismiss_blocking_ui
from automation.app_helpers.left_nav import link, navigate_to
from automation.app_helpers.list_scroll import scroll_until_visible
from automation.app_helpers.page_helpers import require_helper
from automation.app_helpers.screenshot_helper import ScreenshotHelper
from automation.app_pages.app_base_page import AppBasePage


class ProtocolsPage(AppBasePage):
    """Open protocols from the landing page and exercise detail tabs."""

    PROTOCOL_TABS = ("Parameters", "Hardware", "Labware", "Liquids")
    # Electron serves the SPA from file://…/index.html with hash routing (#/protocols/…).
    PROTOCOLS_LANDING_URL = re.compile(r"#/protocols/?$")
    PROTOCOL_DETAIL_URL = re.compile(r"#/protocols/.+")
    OVERFLOW_BTN = "ProtocolOverflowMenu_overflowBtn"
    START_SETUP_ITEM = "ProtocolOverflowMenu_run"

    def __init__(self, page: Page, shots: ScreenshotHelper | None = None) -> None:
        """Bind the page and optional screenshot helper."""
        super().__init__(page)
        self.shots = shots

    @property
    def nav_link(self) -> Locator:
        """Left-nav Protocols link."""
        return link(self.page, "Protocols", first=True)

    def navigate_landing(self) -> None:
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
        return self.page.get_by_test_id(re.compile(rf"^ProtocolCard_{re.escape(protocol_name)}$")).first

    def protocol_card_container(self, protocol_name: str) -> Locator:
        """Outer protocol card that contains both the title and overflow menu."""
        title = self.protocol_card(protocol_name)
        return title.locator(f"xpath=ancestor::*[.//*[@data-testid='{self.OVERFLOW_BTN}']][1]")

    def open(self, protocol_name: str) -> None:
        """Open a protocol detail page from the landing list."""
        self.navigate_landing()
        card = scroll_until_visible(self.page, self.protocol_card(protocol_name))
        card.click()
        self.page.wait_for_url(self.PROTOCOL_DETAIL_URL)

    def start_setup(self, protocol_name: str) -> None:
        """Open Start setup from the protocol card overflow menu."""
        dismiss_blocking_ui(self.page)
        self.navigate_landing()
        title = scroll_until_visible(self.page, self.protocol_card(protocol_name))
        expect(title).to_be_visible()
        container = self.protocol_card_container(protocol_name)
        overflow = container.get_by_test_id(self.OVERFLOW_BTN)
        expect(overflow).to_be_visible()
        overflow.click()
        start_setup = self.page.get_by_test_id(self.START_SETUP_ITEM)
        expect(start_setup).to_be_visible()
        start_setup.click()

    def tab_button(self, name: str) -> Locator:
        """Return the detail-tab button locator for ``name``."""
        return self.page.get_by_role("button", name=name, exact=True)

    def tab(self, name: str) -> None:
        """Click a protocol detail tab by visible name."""
        self.tab_button(name).click()

    def validate_all_tabs(self) -> None:
        """Click each present protocol detail tab and assert it stays visible."""
        for tab in self.PROTOCOL_TABS:
            tab_button = self.tab_button(tab)
            if tab_button.count() == 0:
                continue
            self.tab(tab)
            expect(tab_button).to_be_visible()

    def capture_all_tabs(self) -> None:
        """Screenshot each protocol detail tab."""
        shots = require_helper(self.shots, "ScreenshotHelper", owner="ProtocolsPage", method="capture_all_tabs")
        for tab in self.PROTOCOL_TABS:
            self.tab(tab)
            shots.capture("protocols", tab.lower())
