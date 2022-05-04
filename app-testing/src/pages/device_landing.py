"""Model for the App page that displays info and settings for the app."""
from typing import Literal, Optional
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element

PageName = Literal["devices", "protocols", "labware", "app-settings/general"]


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

    def get_robot_image(self) -> Optional[WebElement]:
        """Get the robot_image."""
        lights: Element = Element(
            (By.ID, "RobotCard_opentrons-dev_robotImage"), f"Robot image."
        )
        return self.base.clickable_wrapper(lights, 5)

    def get_robot_name_device_detail(self) -> Optional[WebElement]:
        """Get the robot name on device detail page."""
        lights: Element = Element(
            (By.ID, "RobotStatusBanner_opentrons-dev_robotName"),
            f"the robot name on device detail page.",
        )
        return self.base.clickable_wrapper(lights, 5)

    def get_left_mount_pipette(self) -> Optional[WebElement]:
        """Get the left mount pipette."""
        text: Element = Element(
            (By.ID, "RobotCard_opentrons-dev_leftMountPipette"), f"Left mount pipette."
        )
        return self.base.clickable_wrapper(text, 5)

    def get_right_mount_pipette(self) -> Optional[WebElement]:
        """Get the right mount pipette."""
        text: Element = Element(
            (By.ID, "RobotCard_opentrons-dev_rightMountPipette"),
            f"Right mount pipette.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_overflow_button_on_device_landing(self) -> Optional[WebElement]:
        """Get the overflow button on device landing page."""
        text: Element = Element(
            (By.XPATH, f"//div[@data-testid='RobotCard_opentrons-dev_overflowMenu']"),
            f"Get the overflow button on device landing page.",
        )
        return self.base.clickable_wrapper(text, 5)

    def click_overflow_menu_button_on_device_landing(self) -> None:
        """Click on overflow menu on device landing page"""
        button: Optional[WebElement] = self.get_overflow_button_on_device_landing()
        if button:
            button.click()

    def get_device_header(self) -> Optional[WebElement]:
        """Get the device header."""
        header: Element = Element((By.ID, "DevicesLanding_title"), f"Device header.")
        return self.base.clickable_wrapper(header, 5)

    def get_how_to_setup_a_robot(self) -> Optional[WebElement]:
        """Get the how to setup a robot."""
        header: Element = Element(
            (By.XPATH, '//a[text()="See how to set up a new robot"]'),
            f"See how to set up a new robot.",
        )
        return self.base.clickable_wrapper(header, 5)

    def get_setup_a_robot_header(self) -> Optional[WebElement]:
        """Get the how to setup a robot."""
        header: Element = Element(
            (By.XPATH, '//h3[text()="How to setup a new robot"]'),
            f"How to set up a new robot.",
        )
        return self.base.clickable_wrapper(header, 15)

    def get_link_to_setting_up_a_new_robot(self) -> Optional[WebElement]:
        """Get link for the how to setup a robot."""
        header: Element = Element(
            (
                By.XPATH,
                '//a[contains(@href,"https://support.opentrons.com/en/collections/1559720-ot-2-get-started")]',
            ),
            f"link for how to set up a new robot.",
        )
        return self.base.clickable_wrapper(header, 5)

    def click_how_to_setup_a_robot(self) -> None:
        """Click on the how to setup a robot"""
        button: Optional[WebElement] = self.get_how_to_setup_a_robot()
        if button:
            button.click()

    def get_close_button(self) -> Optional[WebElement]:
        """Get the close button."""
        button: Element = Element(
            (
                By.XPATH,
                '//button[text()="close"]',
            ),
            f"Get the close button.",
        )
        return self.base.clickable_wrapper(button, 5)

    def click_close_button(self) -> None:
        """Click on the close button"""
        button: Optional[WebElement] = self.get_close_button()
        if button:
            button.click()

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

    def get_image_robot_overview(self) -> Optional[WebElement]:
        """Get the robot image on device detail page."""
        image: Element = Element(
            (By.ID, "RobotOverview_robotImage"),
            f"the robot image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_recent_protocol_runs_header_text(self) -> str:
        header: Element = Element(
            (By.ID, "RecentProtocolRuns_title"), f"header 'Recent Protocol Runs'"
        )
        element = self.base.clickable_wrapper(header, 5)
        if not element:
            return ""
        return element.text

    def get_mag_deck_image(self) -> Optional[WebElement]:
        """Get the mag deck image on device detail page."""
        image: Element = Element(
            (By.XPATH, f"//img[@alt='magneticModuleV1']"),
            f"the mag deck image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_left_mount_pipette_device_detail(self) -> Optional[WebElement]:
        """Get the left mount pipette on device detail page."""
        text: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='PipetteCard_display_name_P10 Single-Channel GEN1']",
            ),
            f"the left mount pipette on device detail page.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_protocol_name_device_detail_slideout(self) -> Optional[WebElement]:
        """Get the protocol name on device detail page slide out."""
        text: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='Slideout_body_Choose protocol to Run on opentrons-dev']//div",
            ),
            f"the protocol name on device detail page slide out.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_right_mount_pipette_device_detail(self) -> Optional[WebElement]:
        """Get the right mount pipette on device detail page."""
        text: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='PipetteCard_display_name_P300 Single-Channel GEN1']",
            ),
            f"the right mount pipette on device detail page.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_mag_module_name(self) -> Optional[WebElement]:
        """Get the mag module name on device detail page."""
        image: Element = Element(
            (By.XPATH, f"//p[text()='Magnetic Module GEN1']"),
            f"the mag module name on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_current_step_text(self) -> Optional[WebElement]:
        """Get the current step text on run log."""
        text: Element = Element(
            (By.XPATH, f"//p[text()='Current Step']"),
            f"the current step text on run log.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_clear_button_run_page(self) -> Optional[WebElement]:
        """Get the clear button on run page."""
        button: Element = Element(
            (By.ID, f"ProtocolRunHeader_closeRunButton"),
            f"Get the clear button on run page.",
        )
        return self.base.clickable_wrapper(button, 10)

    def get_run_button(self) -> Optional[WebElement]:
        """Get the run button on run page."""
        button: Element = Element(
            (By.ID, f"ProtocolRunHeader_runControlButton"),
            f"Get the run button on run page.",
        )
        return self.base.clickable_wrapper(button, 5)

    def get_success_banner_run_page(self) -> Optional[WebElement]:
        """Get the success banner on run page."""
        banner: Element = Element(
            (By.XPATH, f"//div[@data-testid='Banner_success']"),
            f"Get the success banner on run page.",
        )
        return self.base.clickable_wrapper(banner, 5)

    def click_module_actions_button(self, module_serial: str) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='module_card_overflow_btn_{module_serial}']//button",
            ),
            f"Button to open module actions menu.'",
        )
        self.base.click(button)

    def click_on_opentrons_dev_app_device_landing_page(self) -> None:
        button: Element = Element(
            (
                By.ID,
                f"RobotStatusBanner_opentrons-dev_robotName",
            ),
            f"Clicking on dev robot in device landing page.'",
        )
        self.base.click(button)

    def click_on_jump_to_current_step(self) -> None:
        button: Element = Element(
            (
                By.ID,
                f"RunLog_jumpToCurrentStep",
            ),
            f"Clicking on jump to current step.'",
        )
        self.base.click(button)

    def click_run_a_protocol_button_device_landing(self) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//button[text()='Run a Protocol']",
            ),
            f"Button to go to setup for run page.'",
        )
        self.base.click(button)

    def click_proceed_to_setup_button_device_landing_page(self) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//button[text()='Proceed to setup']",
            ),
            f"Button to Proceed to setup for set up run page.'",
        )
        self.base.clickable_wrapper(button, 10)

    def click_clear_protocol_button(self) -> None:
        button: Element = Element(
            (
                By.ID,
                f"ProtocolRunHeader_closeRunButton",
            ),
            f"Button to clear the protocol from set up run page.'",
        )
        self.base.clickable_wrapper(button, 5)

    def click_run_protocol_robot_landing_overflow_button(self) -> None:
        button: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='RobotCard_opentrons-dev_overflowMenu']//div//button",
            ),
            f"Button to select run protocol from robot landing overflow menu.'",
        )
        self.base.clickable_wrapper(button, 5)

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

    def click_engage_height_button(self) -> None:
        close: Element = Element(
            (
                By.XPATH,
                f"//button[@data-testid='MagneticModuleSlideout_btn_fatal-attraction']",
            ),
            f"Button to set engage height slideout.'",
        )
        self.base.click(close)

    def click_start_run_button(self) -> None:
        close: Element = Element(
            (
                By.ID,
                f"ProtocolRunHeader_runControlButton",
            ),
            f"Button to start the run on run page.'",
        )
        self.base.click(close)

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
