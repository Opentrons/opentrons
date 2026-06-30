"""Page object for the Devices list and robot detail navigation."""

from __future__ import annotations

import re

from playwright.sync_api import Locator, Page, expect

from automation.helpers.app_readiness import dismiss_blocking_ui
from automation.helpers.left_nav import link, navigate_to
from automation.helpers.list_scroll import scroll_until_visible
from automation.helpers.locator_helpers import first_resolved


class DevicesPage:
    """Navigate from Devices landing to a robot detail page."""

    # Electron serves the SPA from file://…/index.html with hash routing (#/devices/…).
    DEVICES_LANDING_URL = re.compile(r"#/devices/?$")

    def __init__(self, page: Page, *, robot_name: str = "QA1Potato"):
        """Bind the page and target robot display name."""
        self.page = page
        self.robot_name = robot_name

    @property
    def nav_link(self) -> Locator:
        """Left-nav Devices link."""
        return link(self.page, "Devices")

    @property
    def robot_detail_url(self) -> re.Pattern[str]:
        """Hash route for this robot's detail page."""
        return re.compile(rf"#/devices/{re.escape(self.robot_name)}/?$")

    def robot_card(self) -> Locator:
        """Best-effort robot card click target for ``robot_name``."""
        escaped_name = re.escape(self.robot_name)

        def _by_image_id() -> Locator:
            return self.page.locator(f"#RobotCard_{self.robot_name}_robotImage")

        def _by_overflow_menu() -> Locator:
            return self.page.get_by_test_id(
                f"RobotCard_{self.robot_name}_overflowMenu"
            ).locator(
                "xpath=ancestor::*[.//img[contains(@id, 'RobotCard_')]][1]"
            )

        def _by_robot_name() -> Locator:
            return self.page.get_by_text(self.robot_name, exact=True).locator(
                "xpath=ancestor::*[.//img[contains(@id, 'RobotCard_')]][1]"
            )

        def _by_detail_link() -> Locator:
            return self.page.locator(
                f'a[href="#/devices/{escaped_name}"], '
                f'a[href="/devices/{escaped_name}"]'
            ).filter(has_not=self.page.locator('[class*="crumb_link"]'))

        return first_resolved(
            (_by_image_id, _by_overflow_menu, _by_robot_name, _by_detail_link)
        )

    def navigate(self) -> None:
        """Open Devices, select the robot card, and wait for robot detail."""
        dismiss_blocking_ui(self.page)

        if self.robot_detail_url.search(self.page.url):
            return

        if not self.DEVICES_LANDING_URL.search(self.page.url):
            navigate_to(self.page, "Devices", self.DEVICES_LANDING_URL)

        card = scroll_until_visible(self.page, self.robot_card())
        card.click()
        expect(self.page).to_have_url(self.robot_detail_url)
