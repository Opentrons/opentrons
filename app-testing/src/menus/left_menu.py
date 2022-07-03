"""Left Menu Locators."""
from typing import Literal, Optional

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element

PagesLike = Literal["devices", "protocols", "labware", "app-settings"]


class LeftMenu:
    """Locators for the left side menu."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver, console, and unique id for the test."""
        self.base: Base = Base(driver, console, execution_id)

    protocols: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/protocols")]'), "Left menu Protocols"
    )
    labware: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/labware")]'), "Left menu Labware"
    )
    devices: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/devices")]'), "Left menu Devices"
    )
    gear: Element = Element(
        (By.XPATH, '//a[contains(@href,"#/app-settings")]'),
        "Left menu bottom gear to go to App Settings",
    )

    def get_gear_button(self) -> Optional[WebElement]:
        """Search for the gear menu button."""
        return self.base.clickable_wrapper(self.gear, 5)

    def click_gear_button(self) -> None:
        """Click on the gear button to open App Settings."""
        button: Optional[WebElement] = self.get_gear_button()
        if button:
            button.click()

    def get_protocols_button(self) -> Optional[WebElement]:
        """Search for the protocols menu button."""
        return self.base.clickable_wrapper(self.protocols, 5)

    def click_protocols_button(self) -> None:
        """Click on the protocols button to open App Settings."""
        button: Optional[WebElement] = self.get_protocols_button()
        if button:
            button.click()

    def get_labware_button(self) -> WebElement:
        """Search for the labware menu button."""
        return self.base.clickable_wrapper(self.labware, 5)

    def click_labware_button(self) -> None:
        """Click on the labware button to open App Settings."""
        button: Optional[WebElement] = self.get_labware_button()
        if button:
            button.click()

    def get_devices_button(self) -> Optional[WebElement]:
        """Search for the devices menu button."""
        return self.base.clickable_wrapper(self.devices, 5)

    def click_devices_button(self) -> None:
        """Click on the devices button to open App Settings."""
        button: Optional[WebElement] = self.get_devices_button()
        if button:
            button.click()

    def navigate(self, page_name: PagesLike) -> None:
        """Use url to navigate."""
        base_url = self.base.driver.current_url.split("#")[0]
        self.base.console.print()
        self.base.driver.get(f"{base_url}#/{page_name}")
