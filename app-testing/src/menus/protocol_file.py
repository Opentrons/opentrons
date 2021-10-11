"""Model for the list of robots."""
from typing import Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.driver.highlight import highlight


class ProtocolFile:
    """All elements and actions for the protocol file upload."""

    open: Tuple[str, str] = (
        By.XPATH,
        "//label[contains(normalize-space(@class), 'upload-panel__upload_button')]",
    )

    drag_and_drop: Tuple[str, str] = (
        By.XPATH,
        "(//input[contains(normalize-space(@class), 'upload-panel__file_input')])[2]",
    )
    file_drag_locator: tuple = (By.ID, "file_input")

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def get_open_button(self) -> WebElement:
        """Retrieve the Webelement toggle buttone for a robot by name."""
        button: WebElement = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located(ProtocolFile.open)
        )
        return button

    @highlight
    def get_drag_and_drop(self) -> WebElement:
        """Retrieve the Webelement input for drag and drop."""
        input: WebElement = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located(ProtocolFile.drag_and_drop)
        )
        return input

    @highlight
    def get_drag_json_protocol(self) -> WebElement:
        """Retrieve the Webelement input for drag and drop."""
        input: WebElement = WebDriverWait(self.driver, 5).until(
            EC.visibility_of_element_located(ProtocolFile.file_drag_locator)
        )
        return input
