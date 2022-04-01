"""Model for the Labware Landing page that displays labware info for the app."""
from typing import Optional
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element


class LabwareLanding:
    """Elements and actions for the App Settings Page that loads when the app is opened."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    def get_labware_image(self) -> Optional[WebElement]:
        """Get the labware image on the labware card."""
        header: Element = Element(
            (By.ID, f"LabwareCard_labwareImage"),
            "the labware image on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_labware_name(self) -> Optional[WebElement]:
        """Get the labware name on the labware card."""
        header: Element = Element(
            (By.ID, f"LabwareCard_labwareName"),
            "the labware name on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_api_name(self) -> Optional[WebElement]:
        """Get the labware api name on the labware card."""
        header: Element = Element(
            (By.ID, f"LabwareCard_apiName"),
            "the labware api name on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_overflow_menu(self) -> Optional[WebElement]:
        """Get the labware overflow menu on the labware card."""
        header: Element = Element(
            (By.ID, f"LabwareCard_overflowMenu"),
            "the labware overflow menu on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_import_button(self) -> Optional[WebElement]:
        """Get the import button on the labware landing page."""
        button: Element = Element(
            (By.XPATH, f'//button[text()="Import"])'),
            "the import button on the labware landing page",
        )
        return self.base.present_wrapper(button, 2)

    def get_labware_header(self) -> Optional[WebElement]:
        """Get the labware heading on the labware landing page."""
        header: Element = Element(
            (By.TAG_NAME, f"h1"),
            "the labware heading on the labware landing page",
        )
        return self.base.present_wrapper(header, 2)

    def click_import_button(self) -> None:
        """Click on the import button to labware landing page to import a labware file"""
        button: Optional[WebElement] = self.get_labware_header()
        if button:
            button.click()
