"""Model for the Labware Landing page that displays labware info for the app."""
from typing import Optional
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element


class LabwareLanding:
    """Elements and actions for the Labware Landing Page that loads when the app is opened."""

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
            (By.TAG_NAME, f"button"),
            "the import button on the labware landing page",
        )
        return self.base.present_wrapper(button, 5)

    def get_labware_header(self) -> Optional[WebElement]:
        """Get the labware heading on the labware landing page."""
        header: Element = Element(
            (By.TAG_NAME, f"h1"),
            "the labware heading on the labware landing page",
        )
        return self.base.present_wrapper(header, 2)

    def click_import_button(self) -> None:
        """Click on the import button to labware landing page to import a labware file"""
        button: Optional[WebElement] = self.get_import_button()
        if button:
            button.click()

    def get_import_custom_labware_definition_header(self) -> Optional[WebElement]:
        """Get the labware Slideout_title_Import a Custom Labware Definition."""
        header: Element = Element(
            (
                By.XPATH,
                f"//p[@data-testid='Slideout_title_Import a Custom Labware Definition']",
            ),
            "Slideout_title_Import a Custom Labware Definition",
        )
        return self.base.present_wrapper(header, 2)

    def get_choose_file_button(self) -> Optional[WebElement]:
        """Get the choose file button on the labware slideout."""
        header: Element = Element(
            (By.ID, f"UploadInput_protocolUploadButton"),
            "the choose file button on the labware slideout",
        )
        return self.base.present_wrapper(header, 2)

    def get_error_toast_message(self) -> Optional[WebElement]:
        """Get the error toast message after an invalid labware definition is uploaded."""
        header: Element = Element(
            (
                By.XPATH,
                f"//p[text()='Error importing /Users/nehaojha/opentrons/app-testing/files/protocol/json/invalid_labware.json. Invalid labware definition']",
            ),
            "the error toast message after an invalid labware definition is uploaded",
        )
        return self.base.present_wrapper(header, 2)

    def get_success_toast_message(self) -> Optional[WebElement]:
        """Get the success toast message after an invalid labware definition is uploaded."""
        header: Element = Element(
            (
                By.XPATH,
                f"//p[text()='/Users/nehaojha/opentrons/app-testing/files/protocol/json/sample_labware.json imported.']",
            ),
            "the success toast message after an invalid labware definition is uploaded",
        )
        return self.base.present_wrapper(header, 2)

    def get_dublicate_error_toast_message(self) -> Optional[WebElement]:
        """Get the dublicate error toast message after an invalid labware definition is uploaded."""
        header: Element = Element(
            (
                By.XPATH,
                f"//p[text()='Error importing /Users/nehaojha/opentrons/app-testing/files/protocol/json/sample_labware.json. Duplicate labware definition']",
            ),
            "the dublicate error toast message after an invalid labware definition is uploaded",
        )
        return self.base.present_wrapper(header, 2)
