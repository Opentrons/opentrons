"""Model for the Overview page that describes the protocol uploaded to the robot."""
import logging
from typing import Optional, Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)


class Overview:
    """Elements and actions for the robot detail page."""

    continue_button_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='continue']",
    )
    cancel_button_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='cancel']",
    )

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def get_continue_button(self) -> Optional[WebElement]:
        """Try to get the continue button.

        If it does not show up you get None
        """
        try:
            return WebDriverWait(self.driver, 2).until(
                EC.element_to_be_clickable((Overview.continue_button_locator))
            )
        except Exception:  # pylint: disable=W0703
            return None

    def click_continue_if_present(self) -> None:
        """Click the continue button to overwrite the protocol.

        If it shows up.
        """
        button = self.get_continue_button()
        if button:
            button.click()
        else:
            logger.info("Continue button not present.")

    @highlight
    def get_filename_header(self, filename: str) -> WebElement:
        """Use the filename to make sure it matches what you uploaded."""
        return WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, f"//h1[text()='{filename}']"))
        )
