"""Custom Expected Condition."""

from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
)


class WaitForTextToStartWith:
    """Expected condition to wait for an elements text to start with some text."""

    def __init__(self, locator: tuple, text: str) -> None:
        """Initialize."""
        self.locator: tuple = locator
        self.text: str = text

    def __call__(self, driver: WebDriver) -> bool:
        """Call."""
        try:
            element_text = EC._find_element(driver, self.locator).text
            return element_text.startswith(self.text)
        except StaleElementReferenceException:
            return False
        except NoSuchElementException:
            return False
