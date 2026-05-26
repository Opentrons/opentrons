from __future__ import annotations

from playwright.sync_api import Page

from App_layout.app_structure.app_settings_page import AppSettingsPage
from App_layout.app_structure.devices_page import DevicesPage
from App_layout.app_structure.labware_page import LabwarePage
from App_layout.app_structure.protocols_page import ProtocolsPage
from automation.helpers.screenshot_helper import ScreenshotHelper


class LeftPanelNav:
    PROTOCOL_NAME = "Flex Smoke Test - v2.29 - No LLD/meniscus"
    ROBOT_NAME = "QA1Potato"

    def __init__(
        self,
        page: Page,
        *,
        protocol_name: str | None = None,
        robot_name: str | None = None,
    ):
        self.page = page
        self.protocol_name = protocol_name or self.PROTOCOL_NAME
        self.robot_name = robot_name or self.ROBOT_NAME
        self.shots = ScreenshotHelper(page)
        self.protocols = ProtocolsPage(page, shots=self.shots)
        self.app_settings = AppSettingsPage(page, shots=self.shots)
        self.labware = LabwarePage(page)
        self.devices = DevicesPage(page, robot_name=self.robot_name)

    def test_all(self):
        print(f"Testing Protocols: {self.protocol_name}")
        self.protocols.open(self.protocol_name)
        self.protocols.validate_all_tabs()
        print("Protocols page and tabs loaded correctly.")

        print("Testing App Settings navigation")
        self.app_settings.capture_all_tabs()
        print("App Settings tabs loaded correctly.")

        print("Testing Labware navigation")
        self.labware.navigate()
        print("Labware page loaded correctly.")

        print(f"Testing Devices navigation: {self.robot_name}")
        self.devices.navigate()
        print("Devices page loaded correctly.")

        print("All left panel navigation tests passed.")
