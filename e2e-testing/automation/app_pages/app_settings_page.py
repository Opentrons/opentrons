"""Page object for the App Settings gear menu."""

from __future__ import annotations

import re

from playwright.sync_api import Page, expect

from automation.app_helpers.app_readiness import (
    GEAR_NAV_DEBOUNCE_MS,
    click_when_ui_ready,
    dismiss_blocking_ui,
)
from automation.app_helpers.page_helpers import require_helper
from automation.app_helpers.screenshot_helper import ScreenshotHelper


class AppSettingsPage:
    """App Settings gear menu — General, Privacy, Advanced, and optional Feature Flags."""

    CONNECT_IP_HEADING = "Connect to a Robot via IP Address"
    PRIVACY_HEADING = "Share App Analytics with Opentrons"
    PRIVACY_DESCRIPTION = (
        "Help Opentrons improve its products and services by automatically "
        "sending anonymous diagnostics and usage data."
    )
    ADVANCED_HEADING = "Update Channel"
    FEATURE_FLAGS_TAB = "Feature Flags"

    TABS = (
        ("General", "general"),
        ("Privacy", "privacy"),
        ("Advanced", "advanced"),
        (FEATURE_FLAGS_TAB, "feature-flags"),
    )

    def __init__(self, page: Page, shots: ScreenshotHelper | None = None):
        """Bind the Playwright page and optional screenshot helper."""
        self.page = page
        self.shots = shots

    @property
    def nav_link(self):
        """Navbar gear icon that opens App Settings."""
        return self.page.get_by_test_id("Navbar_settingsLink")

    def tab_link(self, name: str):
        """Return the sidebar link for an App Settings tab by visible name."""
        return self.page.locator('a[href*="/app-settings/"]').get_by_text(name, exact=True)

    def navigate(self):
        """Open App Settings from the navbar."""
        click_when_ui_ready(self.page, self.nav_link)
        expect(self.page).to_have_url(re.compile(r"#/app-settings"))
        self.page.wait_for_timeout(GEAR_NAV_DEBOUNCE_MS)

    def _close_connect_robot_slideout(self) -> None:
        """Dismiss the Connect via IP slideout if it is open."""
        slideout_title = self.page.get_by_test_id(f"Slideout_title_{self.CONNECT_IP_HEADING}")
        done = self.page.get_by_text("Done", exact=True)
        if done.count() > 0 and done.is_visible():
            done.click()
        else:
            close = self.page.get_by_test_id(f"Slideout_icon_close_{self.CONNECT_IP_HEADING}")
            if close.count() > 0 and close.is_visible():
                try:
                    close.click(force=True, timeout=2_000)
                except Exception:
                    self.page.keyboard.press("Escape")
        expect(slideout_title).to_have_count(0)

    def _open_tab(self, name: str, slug: str):
        """Click a settings tab and wait for its URL slug to become active."""
        tab = self.tab_link(name)
        if tab.count() == 0:
            return False
        tab.scroll_into_view_if_needed()
        tab.click()
        self.page.wait_for_url(f"**/app-settings/{slug}")
        expect(tab).to_have_class(re.compile("active"))
        return True

    def validate_general(self):
        """Validate General tab: connect via IP, software version, and update alerts."""
        expect(self.page.get_by_text("App Software Version", exact=True)).to_be_visible()
        expect(self.page.get_by_test_id("GeneralSettings_currentVersion")).to_be_visible()
        update_button = self.page.get_by_test_id("GeneralSettings_softwareUpdate")
        up_to_date = self.page.get_by_text("Up to date", exact=True)
        expect(update_button.or_(up_to_date)).to_be_visible()

        expect(self.page.get_by_text("Software Update Alerts", exact=True)).to_be_visible()
        expect(self.page.get_by_test_id("GeneralSettings_softwareUpdateAlerts")).to_be_visible()

        setup_connection = self.page.get_by_test_id("GeneralSettings_setUpConnection")
        setup_connection.scroll_into_view_if_needed()
        setup_connection.click()
        slideout_title = self.page.get_by_test_id(f"Slideout_title_{self.CONNECT_IP_HEADING}")
        try:
            expect(slideout_title).to_be_visible()
        finally:
            self._close_connect_robot_slideout()
        dismiss_blocking_ui(self.page)

    def validate_privacy(self):
        """Open Privacy and assert the app analytics heading, copy, and toggle."""
        self._open_tab("Privacy", "privacy")
        expect(self.page.get_by_text(self.PRIVACY_HEADING, exact=True)).to_be_visible()
        expect(self.page.get_by_text(self.PRIVACY_DESCRIPTION, exact=True)).to_be_visible()
        expect(self.page.get_by_test_id("PrivacySettings_analytics")).to_be_visible()

    def validate_advanced(self):
        """Open Advanced and validate every settings section."""
        self._open_tab("Advanced", "advanced")
        expect(self.page.get_by_text(self.ADVANCED_HEADING, exact=True)).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_updatedChannel")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_customLabware")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_changeLabwareSource")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_disableRobotCache")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_disableRobotCacheToggleButton")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_clearRobots")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_clearUnavailableRobots")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_devTools")).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_devTooltoggle")).to_be_visible()

    def validate_feature_flags(self):
        """Open Feature Flags when present and assert the tab heading is visible."""
        if not self._open_tab(self.FEATURE_FLAGS_TAB, "feature-flags"):
            return
        expect(self.page.get_by_text(self.FEATURE_FLAGS_TAB, exact=True)).to_be_visible()

    def validate_all_tabs(self):
        """Navigate to App Settings and validate every available tab."""
        self.navigate()
        self.validate_general()
        self.validate_privacy()
        self.validate_advanced()
        self.validate_feature_flags()

    def capture_all_tabs(self):
        """Validate each App Settings tab and save a screenshot per tab."""
        shots = require_helper(self.shots, "ScreenshotHelper", owner="AppSettingsPage", method="capture_all_tabs")

        self.navigate()
        self.validate_general()
        shots.capture("app_settings", "general")

        self.validate_privacy()
        shots.capture("app_settings", "privacy")

        self.validate_advanced()
        shots.capture("app_settings", "advanced")

        if self.tab_link(self.FEATURE_FLAGS_TAB).count() > 0:
            self.validate_feature_flags()
            shots.capture("app_settings", "feature_flags")
