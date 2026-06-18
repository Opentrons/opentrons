from __future__ import annotations

import re

from playwright.sync_api import Page, expect

from automation.helpers.app_readiness import click_when_ui_ready, dismiss_blocking_ui
from automation.helpers.screenshot_helper import ScreenshotHelper


class AppSettingsPage:
    """App Settings gear menu — General, Privacy, Advanced, and optional Feature Flags."""

    CONNECT_IP_HEADING = "Connect to a Robot via IP Address"
    PRIVACY_HEADING = "Share App Analytics with Opentrons"
    ADVANCED_HEADING = "Update Channel"
    FEATURE_FLAGS_TAB = "Feature Flags"

    TABS = (
        ("General", "general"),
        ("Privacy", "privacy"),
        ("Advanced", "advanced"),
        (FEATURE_FLAGS_TAB, "feature-flags"),
    )

    def __init__(self, page: Page, shots: ScreenshotHelper | None = None):
        self.page = page
        self.shots = shots

    @property
    def nav_link(self):
        return self.page.get_by_test_id("Navbar_settingsLink")

    def tab_link(self, name: str):
        return self.page.get_by_role("link", name=name, exact=True)

    def navigate(self):
        click_when_ui_ready(self.page, self.nav_link)

    def _close_connect_robot_slideout(self) -> None:
        close = self.page.get_by_test_id(
            f"Slideout_icon_close_{self.CONNECT_IP_HEADING}"
        )
        if close.count() > 0 and close.is_visible():
            close.click(force=True)
        else:
            done = self.page.get_by_role("button", name="Done")
            if done.count() > 0 and done.is_visible():
                done.click()
        expect(close).to_have_count(0)

    def _open_tab(self, name: str, slug: str):
        tab = self.tab_link(name)
        if tab.count() == 0:
            return False
        tab.click()
        self.page.wait_for_url(f"**/app-settings/{slug}**")
        expect(tab).to_have_class(re.compile("active"))
        return True

    def validate_general(self):
        self.page.get_by_role("button", name="Set up connection").click()
        slideout_title = self.page.get_by_test_id(
            f"Slideout_title_{self.CONNECT_IP_HEADING}"
        )
        try:
            expect(slideout_title).to_be_visible()
        finally:
            self._close_connect_robot_slideout()
        dismiss_blocking_ui(self.page)

    def validate_privacy(self):
        self._open_tab("Privacy", "privacy")
        expect(self.page.get_by_text(self.PRIVACY_HEADING, exact=True)).to_be_visible()

    def validate_advanced(self):
        self._open_tab("Advanced", "advanced")
        expect(self.page.get_by_text("Advanced", exact=True)).to_be_visible()
        expect(self.page.get_by_text(self.ADVANCED_HEADING, exact=True)).to_be_visible()

    def validate_feature_flags(self):
        if not self._open_tab(self.FEATURE_FLAGS_TAB, "feature-flags"):
            return
        expect(self.page.get_by_text(self.FEATURE_FLAGS_TAB, exact=True)).to_be_visible()

    def validate_all_tabs(self):
        self.navigate()
        self.validate_general()
        self.validate_privacy()
        self.validate_advanced()
        self.validate_feature_flags()

    def capture_all_tabs(self):
        if self.shots is None:
            raise RuntimeError("Pass a ScreenshotHelper to AppSettingsPage for capture_all_tabs()")

        self.navigate()
        self.validate_general()
        self.shots.capture("app_settings", "general")

        self.validate_privacy()
        self.shots.capture("app_settings", "privacy")

        self.validate_advanced()
        self.shots.capture("app_settings", "advanced")

        if self.tab_link(self.FEATURE_FLAGS_TAB).count() > 0:
            self.validate_feature_flags()
            self.shots.capture("app_settings", "feature_flags")
