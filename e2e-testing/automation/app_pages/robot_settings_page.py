"""Page object for Robot Settings on the robot detail page."""

from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

from automation.app_helpers.app_readiness import dismiss_blocking_ui
from automation.app_helpers.screenshot_helper import ScreenshotHelper
from automation.app_pages.devices_page import DevicesPage


class RobotSettingsPage:
    """Robot Settings tabs — Calibration, Networking, Camera, and Advanced."""

    PAGE_HEADING = "Robot Settings"
    ABOUT_CALIBRATION = "About Calibration"
    PIPETTE_CALIBRATIONS = "Pipette Calibrations"
    PIPETTE_OFFSET_CALIBRATIONS = "Pipette Offset Calibrations"
    WIFI_HEADING = "Wi-Fi"
    ROBOT_NAME = "Robot Name"
    ROBOT_SERVER_VERSION = "Robot Server Version"
    PAUSE_PROTOCOL = "Pause protocol when robot door opens"
    GANTRY_HOMING = "Home Gantry on Restart"
    JUPYTER_NOTEBOOK = "Jupyter Notebook"
    UPDATE_ROBOT_SOFTWARE = "Update robot software manually with a local file (.zip)"
    DEVICE_RESET = "Device Reset"
    REINSTALL = "reinstall"
    RENAME_ROBOT = "Rename robot"
    CHOOSE_RESET_SETTINGS = "Choose reset settings"
    RENAME_ROBOT_SLIDEOUT = "Rename Robot"
    DEVICE_RESET_SLIDEOUT = "Device Reset"
    CAMERA_STATUS = "Camera Status"
    LIVE_VIDEO = "Live video"
    ERROR_IMAGE_CAPTURE = "Error image capture"
    USAGE_SETTINGS = "Usage Settings"
    _USAGE_TOGGLES = (LIVE_VIDEO, ERROR_IMAGE_CAPTURE)

    TABS = (
        ("Calibration", "calibration"),
        ("Networking", "networking"),
        ("Camera", "camera"),
        ("Advanced", "advanced"),
    )

    def __init__(self, page: Page, *, robot_name: str) -> None:
        """Bind the Playwright page and target robot display name."""
        self.page = page
        self.robot_name = robot_name

    @property
    def robot_settings_url(self) -> re.Pattern[str]:
        """Hash route for any Robot Settings tab."""
        return re.compile(rf"#/devices/{re.escape(self.robot_name)}/robot-settings")

    @property
    def page_heading(self):
        """Page title — scoped to Robot Settings content, not the breadcrumb."""
        return self.page.locator('[class*="RobotSettings"]').get_by_text(
            self.PAGE_HEADING, exact=True
        )

    def tab_link(self, name: str, slug: str):
        """Return the RoundTab link for a Robot Settings tab."""
        return self.page.locator(f'a[href*="robot-settings/{slug}"]').get_by_text(name, exact=True)

    def navigate(self) -> None:
        """Open Robot Settings from the robot detail overflow menu."""
        dismiss_blocking_ui(self.page)
        if not re.search(rf"#/devices/{re.escape(self.robot_name)}", self.page.url):
            DevicesPage(self.page, robot_name=self.robot_name).navigate()

        overflow = self.page.get_by_test_id("RobotOverview_overflowMenu")
        expect(overflow).to_be_visible()
        overflow.click()
        settings_item = self.page.get_by_test_id(
            f"RobotOverviewOverflowMenu_robotSettings_{self.robot_name}"
        )
        expect(settings_item).to_be_visible()
        settings_item.click()
        expect(self.page).to_have_url(self.robot_settings_url)
        expect(self.page_heading).to_be_visible()

    def open_tab(self, name: str, slug: str) -> bool:
        """Click a Robot Settings tab and wait for its URL slug."""
        tab = self.tab_link(name, slug)
        if tab.count() == 0:
            return False
        tab.scroll_into_view_if_needed()
        tab.click()
        self.page.wait_for_url(f"**/robot-settings/{slug}")
        return True

    def _camera_status_switch(self) -> Locator:
        """Return the Camera Status toggle on the Camera tab."""
        return self.page.get_by_role("switch", name=self.CAMERA_STATUS)

    def _usage_switch(self, section_heading: str) -> Locator:
        """Return a usage-settings toggle scoped by its section heading."""
        return (
            self.page.locator("div")
            .filter(has=self.page.get_by_text(section_heading, exact=True))
            .get_by_role("switch")
        )

    def _exercise_switch(self, switch: Locator) -> None:
        """Flip a switch once, then leave it in the on/checked state."""
        switch.click()
        if not switch.is_checked():
            switch.click()

    def _close_slideout(self, title: str) -> None:
        """Dismiss a slideout by title."""
        slideout_title = self.page.get_by_test_id(f"Slideout_title_{title}")
        close = self.page.get_by_test_id(f"Slideout_icon_close_{title}")
        if close.count() > 0 and close.is_visible():
            close.click()
        else:
            self.page.keyboard.press("Escape")
        expect(slideout_title).to_have_count(0)

    def validate_calibration_about(self) -> None:
        """T69745: Calibration > About Calibration. Manual inspection required."""
        self.open_tab("Calibration", "calibration")
        ScreenshotHelper(self.page).capture("robot_settings", "calibration_about")
        print("Applitoools diff expected, alert if significantly different")

    def validate_calibration_pipettes(self) -> None:
        """T69746: Calibration > Pipette Calibrations."""
        print("Pipette Calibraiton covered by validate_calibration_about")

    def validate_networking(self) -> None:
        """T69747: Networking."""
        self.open_tab("Networking", "networking")
        ScreenshotHelper(self.page).capture("robot_settings", "networking")
        print("Networking screenshot, to validate credentials")
        print("ToDo: Disconnect from Wi-Fi and check USB and Ethernet")

    def validate_privacy(self) -> None:
        """T69748: Privacy — validated via Camera usage controls"""
        shots = ScreenshotHelper(self.page)
        self.open_tab("Camera", "camera")
        shots.capture("robot_settings", "camera")

        self._exercise_switch(self._camera_status_switch())
        shots.capture("robot_settings", "camera_status")

        for heading in self._USAGE_TOGGLES:
            switch = self._usage_switch(heading)
            if switch.count() == 0:
                continue
            self._exercise_switch(switch)
        shots.capture("robot_settings", "camera_usage_toggled")

    def validate_advanced_robot_name(self) -> None:
        """T69749: Advanced > Robot Name."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_text(self.ROBOT_NAME, exact=True)).to_be_visible()
        rename = self.page.get_by_test_id("RobotSettings_RenameRobot")
        expect(rename).to_be_visible()
        rename.click()
        expect(self.page.get_by_test_id(f"Slideout_title_{self.RENAME_ROBOT_SLIDEOUT}")).to_be_visible()
        self._close_slideout(self.RENAME_ROBOT_SLIDEOUT)

    def validate_advanced_robot_server_version(self) -> None:
        """T69750: Advanced > Robot server Version."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_test_id("AdvancedSettings_RobotServerVersion")).to_be_visible()

    def validate_advanced_pause_on_door_open(self) -> None:
        """T69751: Advanced > Pause protocol when robot door opens (OT-2 only)."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_text(self.PAUSE_PROTOCOL, exact=True)).to_be_visible()
        expect(self.page.get_by_test_id("RobotSettings_usageSettingsToggleButton")).to_be_visible()

    def validate_advanced_gantry_homing(self) -> None:
        """T69752: Advanced > Disable homing the gantry when restarting robot."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_test_id("AdvancedSettings_homing")).to_be_visible()
        expect(self.page.get_by_test_id("RobotSettings_gantryHomingToggleButton")).to_be_visible()

    def validate_advanced_jupyter_notebook(self) -> None:
        """T69753: Advanced > Jupyter Notebook."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_text(self.JUPYTER_NOTEBOOK, exact=True)).to_be_visible()
        expect(self.page.get_by_text("Launch Jupyter Notebook", exact=True)).to_be_visible()

    def validate_advanced_update_robot_software(self) -> None:
        """T69754: Advanced > Update robot software."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_test_id("AdvancedSettings_updateRobotSoftware")).to_be_visible()
        expect(self.page.get_by_text(self.UPDATE_ROBOT_SOFTWARE, exact=True)).to_be_visible()
        expect(self.page.get_by_test_id("AdvancedSettings_softwareUpdateButton")).to_be_visible()

    def validate_advanced_device_reset(self) -> None:
        """T69755: Advanced > Device Reset."""
        self.open_tab("Advanced", "advanced")
        expect(self.page.get_by_test_id("AdvancedSettings_deviceReset")).to_be_visible()
        reset = self.page.get_by_test_id("RobotSettings_DeviceResetChooseButton")
        expect(reset).to_be_visible()
        reset.click()
        expect(self.page.get_by_test_id(f"Slideout_title_{self.DEVICE_RESET_SLIDEOUT}")).to_be_visible()
        self._close_slideout(self.DEVICE_RESET_SLIDEOUT)

    def validate_advanced_robot_server_reinstall(self) -> None:
        """T69756: Advanced > Robot Server Reinstall."""
        self.open_tab("Advanced", "advanced")
        reinstall = self.page.get_by_role("button", name=self.REINSTALL)
        up_to_date = self.page.get_by_text("Up to date", exact=True)
        expect(reinstall.or_(up_to_date)).to_be_visible()

    def validate_analytics(self) -> None:
        """Analytics: Camera usage settings on the Camera tab."""
        self.open_tab("Camera", "camera")
        usage = self.page.get_by_text(self.USAGE_SETTINGS, exact=True)
        if usage.count() == 0:
            expect(self.page.get_by_text(self.CAMERA_STATUS, exact=True)).to_be_visible()
            return
        expect(usage).to_be_visible()
