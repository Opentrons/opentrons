"""Model for the App page that displays info and settings for the app."""
from typing import Literal, Optional
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element

PageName = Literal["devices","protocols", "labware", "app-settings/general"]
class DeviceLanding:
    """Elements and actions for the Page that loads when the app is opened."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    header: Element = Element(
        (By.ID, "DevicesLanding_title"), "Header that is 'Devices'"
    )

    def robot_banner(self, robot_name: str) -> None:
        """Look for a robot to be present by name."""
        banner: Element = Element(
            (By.ID, f"RobotStatusBanner_{robot_name}_robotName"),
            f"Banner with robot name = {robot_name}",
        )
        self.base.present_wrapper(
            banner,
            5,
        )

    def expander(self, robot_name: str) -> Element:
        """Get the ... expander link in the top right of the robot card by Robot name."""
        return Element(
            (By.XPATH, f'//a[contains(@href,"#/devices/{robot_name}")]'),
            f"Expander for robot name = {robot_name}",
        )

    def get_lights_toggle(self) -> Optional[WebElement]:
        """Get the lights toggle button."""
        lights: Element = Element(
            (By.ID, "RobotOverview_lightsToggle"), f"Lights toggle button."
        )
        return self.base.clickable_wrapper(lights, 5)

    def get_lights_status(self) -> bool:
        """Return True if toggle is on, False if toggle is off."""
        button = self.get_lights_toggle()
        if not button:  # None check but the finder throws so should never be hit
            return False
        # get the status of the toggle
        return button.get_attribute("aria-checked").lower() == "true"

    def set_lights(self, on: bool) -> bool:
        """Set the lights toggle.  Return a bool of the condition: final light state == the desired state."""
        toggled_on = self.get_lights_status()
        if on and toggled_on:  # light is already on
            return True
        if not on and not toggled_on:  # light is already off
            return True
        button = self.get_lights_toggle()
        if (
            not button
        ):  # None check but the finder raises so this *should* be unreachable
            return False
        button.click()
        # get status of the toggle again
        toggled_on = self.get_lights_status()
        return toggled_on == on

    def get_pipettes_and_modules_header_text(self) -> str:
        header: Element = Element(
            (By.ID, "PipettesAndModules_title"), f"header 'Pipettes and Modules'"
        )
        element = self.base.clickable_wrapper(header, 5)
        if not element:
            return ""
        return element.text

    def get_recent_protocol_runs_header_text(self) -> str:
        header: Element = Element(
            (By.ID, "RecentProtocolRuns_title"), f"header 'Recent Protocol Runs'"
        )
        element = self.base.clickable_wrapper(header, 5)
        if not element:
            return ""
        return element.text

    def click_module_actions_button(self, module_serial: str) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='module_card_overflow_btn_{module_serial}']//button",
            ),
            f"Button to open module actions menu.'",
        )
        self.base.click(button)

    def click_mag_engage_height(self, module_serial: str) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='module_card_overflow_menu_{module_serial}']//button",
            ),
            f"Button to open set engage height slideout.'",
        )
        self.base.click(button)

    def enter_mag_engage_height(self, module_serial: str, height: str) -> None:
        input: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='MagneticModuleSlideout_input_field_{module_serial}']//input",
            ),
            f"Input for height on slideout.'",
        )
        element = self.base.clickable_wrapper(input)
        if element:
            element.clear()
            element.send_keys(height)

    def close_mag_slideout(self) -> None:
        close: Element = Element(
            (
                By.XPATH,
                f"//button[@data-testid='Slideout_icon_close_Set Engage Height for Magnetic Module GEN2']",
            ),
            f"Button to close set engage height slideout.'",
        )
        self.base.click(close)

    def mag_engaged(self) -> bool:
        engaged: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='status_label+engaged']",
            ),
            f"Indicator for the mag deck being engaged.'",
        )
        return self.base.present_wrapper(engaged, 5, False) is not None

    def click_mag_disengage(self) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//button[@data-testid='module_setting_magneticModuleV1']",
            ),
            f"Button to disengage height slideout.'",
        )
        self.base.click(button)

    def navigate(self, page_name: PageName) -> None:
        base_url = self.base.driver.current_url.split("#")[0]
        self.base.driver.get(f"{base_url}#/{page_name}")
