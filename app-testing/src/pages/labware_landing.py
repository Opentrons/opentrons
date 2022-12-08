"""Model for the Labware Landing page that displays labware info for the app."""
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

    def get_labware_image(self) -> WebElement:
        """Get the labware image on the labware card."""
        header: Element = Element(
            (By.ID, "LabwareCard_labwareImage"),
            "the labware image on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_labware_name(self) -> WebElement:
        """Get the labware name on the labware card."""
        header: Element = Element(
            (By.ID, "LabwareCard_labwareName"),
            "the labware name on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_api_name(self) -> WebElement:
        """Get the labware api name on the labware card."""
        header: Element = Element(
            (By.ID, "LabwareCard_apiName"),
            "the labware api name on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_overflow_menu(self) -> WebElement:
        """Get the labware overflow menu on the labware card."""
        header: Element = Element(
            (By.ID, "LabwareCard_overflowMenu"),
            "the labware overflow menu on the labware card",
        )
        return self.base.present_wrapper(header, 2)

    def get_labware_header(self) -> WebElement:
        """Get the labware heading on the labware landing page."""
        header: Element = Element(
            (By.TAG_NAME, "h1"),
            "the labware heading on the labware landing page",
        )
        return self.base.present_wrapper(header, 2)

    import_button: Element = Element(
        (By.XPATH, "//button[text()='Import']"),
        "the import button on the labware landing page",
    )

    def get_import_button(self) -> WebElement:
        """Get the import button on the labware landing page."""
        return self.base.present_wrapper(self.import_button, 5)

    def click_import_button(self) -> None:
        """Click on the import button to labware landing page to import a labware file."""
        self.base.click(self.import_button)

    import_custom_labware_definition_header: Element = Element(
        (
            By.XPATH,
            "//h2[@data-testid='Slideout_title_Import a Custom Labware Definition']",
        ),
        "Slideout_title_Import a Custom Labware Definition",
    )

    def get_import_custom_labware_definition_header(self) -> WebElement:
        """Get the labware Slideout_title_Import a Custom Labware Definition."""
        return self.base.present_wrapper(
            self.import_custom_labware_definition_header, 2
        )

    choose_file_button: Element = Element(
        (By.ID, "UploadInput_protocolUploadButton"),
        "the choose file button on the labware slideout",
    )

    def get_choose_file_button(self) -> WebElement:
        """Get the choose file button on the labware slideout."""
        return self.base.present_wrapper(self.choose_file_button, 3)

    drag_drop_file_button: Element = Element(
        (By.XPATH, '//label[@data-testid="file_drop_zone"]'),
        "the drag and drop file button on Protocol Page",
    )

    def get_drag_drop_file_button(self) -> WebElement:
        """Get the drag and drop file area."""
        return self.base.present_wrapper(self.drag_drop_file_button, 2)

    def get_error_toast_message(self) -> WebElement:
        """Get the error toast message after an invalid labware definition is uploaded."""
        header: Element = Element(
            (
                By.XPATH,
                "//p[contains(text(),'invalid_labware.json. Invalid labware definition')]",
            ),
            "the error toast message after an invalid labware definition is uploaded",
        )
        return self.base.clickable_wrapper(header, 2)

    def get_success_toast_message(self) -> WebElement:
        """Get the success toast message after an invalid labware definition is uploaded."""
        header: Element = Element(
            (By.XPATH, "//p[contains(text(),'sample_labware.json imported.')]"),
            "the success toast message after an invalid labware definition is uploaded",
        )
        return self.base.clickable_wrapper(header, 2)

    def get_duplicate_error_toast_message(self) -> WebElement:
        """Get the duplicate error toast message after an invalid labware definition is uploaded."""
        header: Element = Element(
            (
                By.XPATH,
                "//p[contains(text(),'sample_labware.json. Duplicate labware definition')]",
            ),
            "the duplicate error toast message after an invalid labware definition is uploaded",
        )
        return self.base.clickable_wrapper(header, 2)

    open_labware_creator: Element = Element(
        (By.LINK_TEXT, "Open Labware Creator"),
        "Open labware creator link at bottom of page.",
    )

    def get_open_labware_creator(self) -> WebElement:
        """Open labware creator link."""
        return self.base.clickable_wrapper(self.open_labware_creator, 2)
