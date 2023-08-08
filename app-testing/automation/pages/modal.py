"""Model for the App page that displays info and settings for the app."""
from typing import Optional

from rich.console import Console
from selenium.webdriver.chromium.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element


class Modal:
    """Elements and actions for the Page that loads when the app is opened."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    not_now: Element = Element((By.XPATH, '//button[text()="Not Now"]'), "Not Now to upgrade.")

    def get_not_now(self) -> Optional[WebElement]:
        """Safely get the not now button."""
        return self.base.clickable_wrapper_safe(self.not_now, 3)
