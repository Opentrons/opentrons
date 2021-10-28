"""Model for the screens of protocol upload."""
import logging
from typing import Optional, Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)

"""Class for Protocol Upload landing page."""


class ProtocolUpload:

    browse_our_protocol_library_button_locator: Tuple[str, str] = (
        By.ID,
        "UploadInput_protocolLibraryButton",
    )

    launch_protocol_designer_button_locator: Tuple[str, str] = (
        By.ID,
        "UploadInput_protocolDesignerButton",
    )

    get_app: Tuple[str, str] = (By.XPATH, f'//a[contains(@href,"#/more/app")]')

    click_robot: Tuple[str, str] = (By.XPATH, f'//a[contains(@href,"#/robots")]')

    file_upload_button_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Choose File...']",
    )

    enable_developer_tool_toggle: Tuple[str, str] = (
        By.XPATH,
        "//p[text()='Enable Developer Tools']/following-sibling::button",
    )

    protocol: Tuple[str, str] = (By.XPATH, '//a[contains(@href,"#/protocol")]')

    enable_pre_protocol_flow_without_rpc_toggle: Tuple[str, str] = (
        By.XPATH,
        "//p[text()='__DEV__ Pre Protocol Flow Without RPC']/following-sibling::button",
    )

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def get_file_upload_button(self) -> Optional[WebElement]:
        """Try to get the file_upload button.

        If it does not show up you get None
        """
        try:
            return WebDriverWait(self.driver, 2).until(
                EC.element_to_be_clickable((ProtocolUpload.get_file_upload_button))
            )
        except Exception:  # pylint: disable=W0703
            return None

    def click_app_left_panel(self) -> None:
        """Linking to app link on the left panel."""
        self.get_app_link().click()

    @highlight
    def get_app_link(self) -> WebElement:
        """Search for the app menu button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ProtocolUpload.get_app)
        )

    @highlight
    def get_enable_developer_tool_toggle(self) -> WebElement:
        """Locating the toggle button."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ProtocolUpload.enable_developer_tool_toggle)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_enable_developer_toggle(self) -> None:
        self.get_enable_developer_tool_toggle().click()

    @highlight
    def get_enable_protocol_flow_toggle(self) -> WebElement:
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                ProtocolUpload.enable_pre_protocol_flow_without_rpc_toggle
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_enable_pur_feature(self) -> None:
        self.get_enable_protocol_flow_toggle().click()

    @highlight
    def get_robot_page(self) -> WebElement:
        return WebDriverWait(self.driver, 100).until(
            EC.element_to_be_clickable(ProtocolUpload.click_robot)
        )

    def goto_robots_page(self) -> None:
        self.get_robot_page().click()

    @highlight
    def get_protocol_upload_button(self) -> WebElement:
        return WebDriverWait(self.driver, 100).until(
            EC.element_to_be_clickable(ProtocolUpload.file_upload_button_locator)
        )

    def click_protocol_upload_link(self) -> None:
        self.get_protocol_upload_button().click()

    @highlight
    def get_protocol_button(self) -> WebElement:
        return WebDriverWait(self.driver, 100).until(
            EC.element_to_be_clickable(ProtocolUpload.protocol)
        )

    def click_protocol_left_menu(self) -> None:
        self.get_protocol_button().click()
