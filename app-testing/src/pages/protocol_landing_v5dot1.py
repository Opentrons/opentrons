"""Model for the screens of protocol upload v5dot1."""
from typing import Optional
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from src.driver.base import Base, Element


class ProtocolLanding:
    """Class for Protocol landing page."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    def get_choose_file_button(self) -> Optional[WebElement]:
        """Get the choose file button on Protocol Page."""
        header: Element = Element(
            (By.ID, "UploadInput_protocolUploadButton"),
            "the choose file button on Protocol Page",
        )
        return self.base.present_wrapper(header, 2)

    def get_drag_drop_file_button(self) -> Optional[WebElement]:
        """Get the drag and drop file button on Protocol Page."""
        header: Element = Element(
            (By.XPATH, f'//label[@data-testid="file_drop_zone"]'),
            "the drag and drop file button on Protocol Page",
        )
        return self.base.present_wrapper(header, 2)

    def get_protocol_library_link(self) -> Optional[WebElement]:
        """Get the Protocol Library Link on Protocol Page."""
        header: Element = Element(
            (By.ID, "EmptyStateLinks_protocolLibraryButton"),
            "the Protocol Library Link on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_protocol_designer_link(self) -> Optional[WebElement]:
        """Get the Protocol Designer Link on Protocol Page."""
        header: Element = Element(
            (By.ID, "EmptyStateLinks_protocolDesignerButton"),
            "the Protocol Designer Link on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_python_api_link(self) -> Optional[WebElement]:
        """Get the python api Link on Protocol Page."""
        header: Element = Element(
            (By.ID, "EmptyStateLinks_apiDocsButton"),
            "the python api Link on Protocol Page.",
        )
        return self.base.present_wrapper(header, 2)

    def get_import_button_protocol_landing(self) -> Optional[WebElement]:
        """Get the import button on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//button[text()="Import"]'),
            "the import button on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 7)

    def get_deckMap_protocol_landing(self) -> Optional[WebElement]:
        """Get the deckmap on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_deckLayout_script_pur_sample_1.json"]',
            ),
            "the deckmap on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 7)

    def get_protocol_name_text_protocol_landing(self) -> Optional[WebElement]:
        """Get the protocol name on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_script_pur_sample_1.json"]',
            ),
            "the protocol name on Protocol Landing Page.",
        )
        element = self.base.present_wrapper(header, 1)
        if not element:
            return ""
        return element.text

    def get_left_mount_text_protocol_landing(self) -> Optional[WebElement]:
        """Get the left mount on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_leftMount_script_pur_sample_1.json//h6"]',
            ),
            "the left mount on Protocol Landing Page.",
        )
        element = self.base.present_wrapper(header, 1)
        if not element:
            return ""
        return element.text

    def get_left_mount_value_protocol_landing(self) -> Optional[WebElement]:
        """Get the left mount value on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_leftMount_script_pur_sample_1.json//p"]',
            ),
            "the left mount value on Protocol Landing Page.",
        )
        element = self.base.present_wrapper(header, 1)
        if not element:
            return ""
        return element.text

    def get_right_mount_text_protocol_landing(self) -> Optional[WebElement]:
        """Get the right mount on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_rightMount_script_pur_sample_1.json//h6"]',
            ),
            "the right mount on Protocol Landing Page.",
        )
        element = self.base.present_wrapper(header, 1)
        if not element:
            return ""
        return element.text

    def get_right_mount_value_protocol_landing(self) -> Optional[WebElement]:
        """Get the right mount value on Protocol Landing Page."""
        header: Element = Element(
            (
                By.XPATH,
                '//div[@data-testid="ProtocolCard_rightMount_script_pur_sample_1.json//p"]',
            ),
            "the right mount value on Protocol Landing Page.",
        )
        element = self.base.present_wrapper(header, 1)
        if not element:
            return ""
        return element.text

    def get_mag_module_protocol_landing(self) -> Optional[WebElement]:
        """Get the mag module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//svg[@data-testid="ModuleIcon_ot-magnet-v2"]'),
            "the mag module on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_temp_module_protocol_landing(self) -> Optional[WebElement]:
        """Get the temp module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//svg[@data-testid="ModuleIcon_ot-temperature-v2"]'),
            "the temp module on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_thermocycler_module_protocol_landing(self) -> Optional[WebElement]:
        """Get the thermocycler module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//svg[@data-testid="ModuleIcon_ot-thermocycler"]'),
            "the thermocycler module on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)

    def get_updated_timestamp_protocol_landing(self) -> Optional[WebElement]:
        """Get the updated timestamp module on Protocol Landing Page."""
        header: Element = Element(
            (By.XPATH, '//div[@data-testid="ProtocolCard_date_script_pur_sample_1"]'),
            "the updated timestamp on Protocol Landing Page.",
        )
        return self.base.present_wrapper(header, 1)
