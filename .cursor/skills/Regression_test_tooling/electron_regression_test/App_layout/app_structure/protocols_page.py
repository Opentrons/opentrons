from __future__ import annotations

from playwright.sync_api import Page, expect

from automation.helpers.app_readiness import click_when_ui_ready
from automation.helpers.screenshot_helper import ScreenshotHelper


class ProtocolsPage:
    PROTOCOL_TABS = ("Parameters", "Hardware", "Labware", "Liquids")

    def __init__(self, page: Page, shots: ScreenshotHelper | None = None):
        self.page = page
        self.shots = shots

    @property
    def nav_link(self):
        return self.page.get_by_role("link", name="Protocols")

    def navigate_landing(self):
        click_when_ui_ready(self.page, self.nav_link)
        self.page.wait_for_url("**/protocols**")
        expect(self.nav_link).to_have_attribute("aria-current", "page")

    def open(self, protocol_name: str):
        self.navigate_landing()
        self.page.get_by_test_id(f"ProtocolCard_{protocol_name}").click()
        self.page.wait_for_url("**/protocols/**")

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
