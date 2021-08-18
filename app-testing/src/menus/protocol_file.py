"""Model for the list of robots."""
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.driver.highlight import highlight


class ProtocolFile:
    """All elements and actions for the protocol file upload."""

    open: tuple = (
        By.XPATH,
        "//label[contains(normalize-space(@class), 'upload-panel__upload_button')]",
    )

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
