"""Model for the App page that displays info and settings for the app."""
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.driver.highlight import highlight


class AppPage:
    """Elements and actions for the more -> app page."""

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def header(self) -> WebElement:
        """Get the header of the page by robot name."""
        header: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable((By.XPATH, "//h1[text()='App']"))
        )
        return header
