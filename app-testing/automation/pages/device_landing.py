"""Model for the App page that displays info and settings for the app."""
import time
from typing import List, Optional

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element


class DeviceLanding:
    """Elements and actions for the Page that loads when the app is opened."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    header: Element = Element((By.ID, "DevicesLanding_title"), "Header that is 'Devices'")

    def get_go_to_run_safe(self, robot_name: str) -> Optional[WebElement]:
        """Look if a robot has a run by name. Return WebElement or None if not."""
        return self.base.present_wrapper_safe(
            self.go_to_run(robot_name),
            5,
        )

    def go_to_run(self, robot_name: str) -> Element:
        """If a robot name has a run go to it."""
        return Element(
            (By.XPATH, f"//div[@data-testid='RobotCard_{robot_name}_overflowMenu']"),
            f"Expander for robot name = {robot_name}",
        )

    def robot_banner(self, robot_name: str) -> Element:
        """Robot banner."""
        return Element(
            (By.ID, f"RobotStatusBanner_{robot_name}_robotName"),
            f"Banner with robot name = {robot_name}",
        )

    def get_robot_banner_safe(self, robot_name: str) -> Optional[WebElement]:
        """Look for a robot to be present by name. Return WebElement or None if not."""
        return self.base.present_wrapper_safe(
            self.robot_banner(robot_name),
            5,
        )

    def click_robot_banner(self, robot_name: str) -> None:
        """Click robot banner by name."""
        self.base.click(self.robot_banner(robot_name))

    def overflow_menu(self, robot_name: str) -> Element:
        """Get the ... overflow menu in the top right of the robot card by Robot name."""
        return Element(
            (By.XPATH, f"//div[@data-testid='RobotCard_{robot_name}_overflowMenu']"),
            f"Expander for robot name = {robot_name}",
        )

    def get_lights_toggle(self) -> WebElement:
        """Get the lights toggle button."""
        lights: Element = Element((By.ID, "RobotOverview_lightsToggle"), "Lights toggle button.")
        return self.base.clickable_wrapper(lights, 5)

    def get_robot_image(self, robot_name: str) -> WebElement:
        """Get the robot_image."""
        image: Element = Element((By.ID, f"RobotCard_{robot_name}_robotImage"), "Robot image.")
        return self.base.clickable_wrapper(image, 5)

    def get_robot_name_device_detail(self, robot_name: str) -> WebElement:
        """Get the robot name on device detail page."""
        lights: Element = Element(
            (By.ID, "RobotStatusHeader_opentrons-dev_robotName"),
            "the robot name on device detail page.",
        )
        return self.base.clickable_wrapper(lights, 5)

    def get_left_mount_pipette(self, robot_name: str) -> WebElement:
        """Get the left mount pipette."""
        text: Element = Element((By.ID, f"RobotCard_{robot_name}_leftMountPipette"), "Left mount pipette.")
        return self.base.clickable_wrapper(text, 5)

    def get_right_mount_pipette(self, robot_name: str) -> WebElement:
        """Get the right mount pipette."""
        text: Element = Element(
            (By.ID, f"RobotCard_{robot_name}_rightMountPipette"),
            "Right mount pipette.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_overflow_button_on_device_landing(self, robot_name: str) -> WebElement:
        """Get the overflow button on device landing page."""
        overflow: Element = self.overflow_menu(robot_name)
        return self.base.clickable_wrapper(overflow, 5)

    def click_overflow_menu_button_on_device_landing(self, robot_name: str) -> None:
        """Click on overflow menu on device landing page."""
        button: WebElement = self.get_overflow_button_on_device_landing(robot_name)
        if button:
            button.click()

    def get_device_header(self) -> WebElement:
        """Get the device header."""
        header: Element = Element((By.ID, "DevicesLanding_title"), "Device header.")
        return self.base.clickable_wrapper(header, 5)

    def get_how_to_setup_a_robot(self) -> WebElement:
        """Get the how to setup a robot."""
        header: Element = Element(
            (By.XPATH, '//a[text()="See how to set up a new robot"]'),
            "See how to set up a new robot.",
        )
        return self.base.clickable_wrapper(header, 5)

    def get_setup_a_robot_header(self) -> WebElement:
        """Get the how to setup a robot."""
        header: Element = Element(
            (By.XPATH, '//h3[text()="How to setup a new robot"]'),
            "How to set up a new robot.",
        )
        return self.base.clickable_wrapper(header, 15)

    def get_link_to_setting_up_a_new_robot(self) -> WebElement:
        """Get link for the how to setup a robot."""
        header: Element = Element(
            (
                By.XPATH,
                '//a[contains(@href,"https://support.opentrons.com/s/ot2-get-started")]',
            ),
            "link for how to set up a new robot.",
        )
        return self.base.clickable_wrapper(header, 5)

    def click_how_to_setup_a_robot(self) -> None:
        """Click on the how to setup a robot."""
        button: WebElement = self.get_how_to_setup_a_robot()
        if button:
            button.click()

    def get_close_button(self) -> WebElement:
        """Get the close button."""
        button: Element = Element(
            (
                By.XPATH,
                '//button[text()="close"]',
            ),
            "Get the close button.",
        )
        return self.base.clickable_wrapper(button, 5)

    def click_close_button(self) -> None:
        """Click on the close button."""
        button: WebElement = self.get_close_button()
        if button:
            button.click()

    def get_lights_status(self) -> bool:
        """Return True if toggle is on, False if toggle is off."""
        button = self.get_lights_toggle()
        if not button:  # None check but the finder throws so should never be hit
            return False
        # get the status of the toggle
        aria: str | None = button.get_attribute("aria-checked")
        if not aria:  # None check but the finder throws so *should* never be hit
            return False
        return aria.lower() == "true"

    def set_lights(self, on: bool) -> bool:
        """Set the lights toggle.  Return a bool of the condition: final light state == the desired state."""
        toggled_on = self.get_lights_status()
        if on and toggled_on:  # light is already on
            return True
        if not on and not toggled_on:  # light is already off
            return True
        button = self.get_lights_toggle()
        if not button:  # None check but the finder raises so this *should* be unreachable
            return False
        button.click()
        # get status of the toggle again
        time.sleep(2)  # clunky behavior of this toggle
        toggled_on = self.get_lights_status()
        return toggled_on == on

    def get_pipettes_and_modules_header_text(self) -> str:
        """Pipettes and modules header."""
        header: Element = Element((By.ID, "InstrumentsAndModules_title"), "header 'Instruments and Modules'")
        element = self.base.clickable_wrapper(header, 5)
        if not element:
            return ""
        return element.text

    def get_image_robot_overview(self) -> WebElement:
        """Get the robot image on device detail page."""
        image: Element = Element(
            (By.ID, "RobotOverview_robotImage"),
            "the robot image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_recent_protocol_runs_header_text(self) -> str:
        """Recent runs header."""
        header: Element = Element((By.ID, "RecentProtocolRuns_title"), "header 'Recent Protocol Runs'")
        element = self.base.clickable_wrapper(header, 5)
        if not element:
            return ""
        return element.text

    def get_mag_deck_image(self) -> WebElement:
        """Get the mag deck image on device detail page."""
        image: Element = Element(
            (By.XPATH, "//img[@alt='magneticModuleV2']"),
            "the mag deck image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_thermocycler_gen1_deck_image(self) -> WebElement:
        """Get the thermocycler deck image on device detail page."""
        image: Element = Element(
            (By.XPATH, "//img[@alt='thermocyclerModuleV1']"),
            "the thermocycler deck image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_thermocycler_gen2_deck_image(self) -> WebElement:
        """Get the thermocycler deck image on device detail page."""
        image: Element = Element(
            (By.XPATH, "//img[@alt='thermocyclerModuleV2']"),
            "the thermocycler deck image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_heater_shaker_deck_image(self) -> WebElement:
        """Get the thermocycler deck image on device detail page."""
        image: Element = Element(
            (By.XPATH, "//img[@alt='heaterShakerModuleV1']"),
            "the thermocycler deck image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_tem_deck_image(self) -> WebElement:
        """Get the temp deck image on device detail page."""
        image: Element = Element(
            (By.XPATH, "//img[@alt='temperatureModuleV2']"),
            "the temp deck image on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_left_mount_pipette_device_detail(self, pipette: str) -> WebElement:
        """Get the left mount pipette on device detail page."""
        text: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='PipetteCard_display_name_{pipette}']",
            ),
            "the left mount pipette on device detail page.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_protocol_name_device_detail_slideout(self) -> WebElement:
        """Get the protocol name on device detail page slide out."""
        text: Element = Element(
            (
                By.XPATH,
                "//div[@data-testid='Slideout_body_Choose protocol to Run on opentrons-dev']//div",
            ),
            "the protocol name on device detail page slide out.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_right_mount_pipette_device_detail(self, pippette: str) -> WebElement:
        """Get the right mount pipette on device detail page."""
        text: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='PipetteCard_display_name_{pippette}']",
            ),
            "the right mount pipette on device detail page.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_mag_module_name(self) -> WebElement:
        """Get the mag module name on device detail page."""
        image: Element = Element(
            (By.XPATH, "//p[text()='Magnetic Module GEN2']"),
            "the mag module name on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_thermocycler_gen1_module_name(self) -> WebElement:
        """Get the thermocycler module name on device detail page."""
        image: Element = Element(
            (By.XPATH, "//p[text()='Thermocycler Module']"),
            "the mag module name on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_thermocycler_gen2_module_name(self) -> WebElement:
        """Get the thermocycler gen2 module name on device detail page."""
        image: Element = Element(
            (By.XPATH, "//p[text()='Thermocycler Module GEN2']"),
            "the mag module name on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_heater_shaker_module_name(self) -> WebElement:
        """Get the heater shaker module name on device detail page."""
        image: Element = Element(
            (By.XPATH, "//p[text()='Heater-Shaker Module GEN1']"),
            "the mag module name on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_tem_module_name(self) -> WebElement:
        """Get the mag module name on device detail page."""
        image: Element = Element(
            (By.XPATH, "//p[text()='Temperature Module GEN2']"),
            "the mag module name on device detail page.",
        )
        return self.base.clickable_wrapper(image, 5)

    def get_current_step_text(self) -> WebElement:
        """Get the current step text on run log."""
        text: Element = Element(
            (By.XPATH, "//p[text()='Current Step']"),
            "the current step text on run log.",
        )
        return self.base.clickable_wrapper(text, 5)

    def get_clear_button_run_page(self) -> WebElement:
        """Get the clear button on run page."""
        button: Element = Element(
            (By.ID, "ProtocolRunHeader_closeRunButton"),
            "Get the clear button on run page.",
        )
        return self.base.clickable_wrapper(button, 10)

    def get_run_button(self) -> WebElement:
        """Get the run button on run page."""
        button: Element = Element(
            (By.ID, "ProtocolRunHeader_runControlButton"),
            "Get the run button on run page.",
        )
        return self.base.clickable_wrapper(button, 5)

    def get_success_banner_run_page(self) -> WebElement:
        """Get the success banner on run page."""
        banner: Element = Element(
            (By.XPATH, "//div[@data-testid='Banner_success']"),
            "Get the success banner on run page.",
        )
        return self.base.clickable_wrapper(banner, 15)

    def click_module_actions_button(self, module_serial: str) -> None:
        """Click module overflow button."""
        button: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='module_card_overflow_btn_{module_serial}']//button",
            ),
            "Button to open module actions menu.",
        )
        self.base.click(button)

    def click_on_jump_to_current_step(self) -> None:
        """Click jump to current step."""
        button: Element = Element(
            (
                By.ID,
                "RunLog_jumpToCurrentStep",
            ),
            "Clicking on jump to current step.'",
        )
        self.base.click(button)

    def run_a_protocol_on_overflow_button(self, robot_name: str) -> Element:
        """Get the overflow button on device landing page."""
        return Element(
            (
                By.XPATH,
                f"//button[@data-testid='RobotOverflowMenu_{robot_name}_runProtocol']",
            ),
            "Button to go to setup for run page.",
        )

    def get_run_a_protocol_on_overflow(self, robot_name: str) -> Optional[WebElement]:
        """Get the overflow button on device landing page."""
        return self.base.clickable_wrapper_safe(
            self.run_a_protocol_on_overflow_button(robot_name),
            3,
        )

    def click_run_a_protocol_on_overflow(self, robot_name: str) -> None:
        """Click run a protocol on overflow."""
        self.base.click(self.run_a_protocol_on_overflow_button(robot_name))

    def click_proceed_to_setup_button_device_landing_page(self) -> None:
        """Click proceed to setup on device landing."""
        button: Element = Element(
            (
                By.XPATH,
                "//button[text()='Proceed to setup']",
            ),
            "Button to Proceed to setup for set up run page.'",
        )
        self.base.click(button)

    def click_clear_protocol_button(self) -> None:
        """Click clear protocol."""
        button: Element = Element(
            (
                By.ID,
                "ProtocolRunHeader_closeRunButton",
            ),
            "Button to clear the protocol from set up run page.'",
        )
        self.base.clickable_wrapper(button, 5)

    def click_mag_engage_height(self, module_serial: str) -> None:
        """Click engage height."""
        button: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='module_card_overflow_menu_{module_serial}']//button",
            ),
            "Button to open set engage height slide out.",
        )
        self.base.click(button)

    def enter_mag_engage_height(self, module_serial: str, height: str) -> None:
        """Enter magnetic module engage height."""
        input: Element = Element(
            (
                By.XPATH,
                f"//div[@data-testid='MagneticModuleSlideout_input_field_{module_serial}']//input",
            ),
            "Input for height on slideout.'",
        )
        element = self.base.clickable_wrapper(input)
        if element:
            element.clear()
            element.send_keys(height)

    def click_engage_height_button(self) -> None:
        """Click engage height."""
        close: Element = Element(
            (
                By.XPATH,
                "//button[@data-testid='MagneticModuleSlideout_btn_fatal-attraction']",
            ),
            "Button to set engage height slideout.'",
        )
        self.base.click(close)

    def click_start_run_button(self) -> None:
        """Click start run."""
        close: Element = Element(
            (
                By.ID,
                "ProtocolRunHeader_runControlButton",
            ),
            "Button to start the run on run page.'",
        )
        self.base.click(close)

    def close_mag_slideout(self) -> None:
        """Close the mag module slideout."""
        close: Element = Element(
            (
                By.XPATH,
                "//button[@data-testid='Slideout_icon_close_Set Engage Height for Magnetic Module GEN2']",
            ),
            "Button to close set engage height slideout.'",
        )
        self.base.click(close)

    device_detail_run_a_protocol_button_element: Element = Element(
        (By.XPATH, '//button[text()="Run a protocol"]'),
        "Run a protocol button.",
    )

    def click_device_detail_run_a_protocol_button(self) -> None:
        """Click run a protocol button."""
        self.base.click(self.device_detail_run_a_protocol_button_element)

    def overflow_robot_settings(self, robot_name: str) -> Element:
        """Element for robot settings overflow menu item."""
        return Element(
            (By.ID, f"RobotOverflowMenu_{robot_name}_robotSettings"),
            "Robot Settings button.",
        )

    def click_overflow_robot_settings(self, robot_name: str) -> None:
        """Click robot settings overflow menu item."""
        self.base.click(self.overflow_robot_settings(robot_name))

    recalibrate_deck_button: Element = Element(
        (By.XPATH, '//button[text()="Recalibrate deck"]'),
        "Recalibrate button.",
    )

    def get_recalibrate_button_safe(self) -> Optional[WebElement]:
        """Safely get recalibrate button."""
        return self.base.clickable_wrapper_safe(self.recalibrate_deck_button, 3)

    def click_recalibrate_button(self) -> None:
        """Click the recalibrate button."""
        self.base.click(self.recalibrate_deck_button)

    calibrate_deck_button: Element = Element(
        (By.XPATH, '//button[text()="Calibrate deck"]'),
        "Calibrate button.",
    )

    def click_calibrate_button(self) -> None:
        """Click the calibrate button."""
        self.base.click(self.calibrate_deck_button)

    def open_calibration(self) -> None:
        """Open calibration regardless of state."""
        recalibrate_button = self.get_recalibrate_button_safe()
        if recalibrate_button is not None:
            self.console.print("Robot is already calibrated.", style="white on blue")
            self.click_recalibrate_button()
        else:
            self.console.print("Robot is not calibrated.", style="white on blue")
            self.click_calibrate_button()

    def is_deck_calibrated(self) -> bool:
        """Is the deck calibrated?."""
        if self.get_recalibrate_button_safe() is not None:
            return True
        return False

    pipette_calibration_overflow_1: Element = Element(
        (By.XPATH, '(//button[@aria-label="CalibrationOverflowMenu_button"])[1]'),
        "First three dot menu menu button for pipette calibrations.",
    )

    def get_pipette_calibration_overflow_1(self) -> WebElement:
        """Get the first pipette three dot menu button."""
        scroll: WebElement = self.base.clickable_wrapper(self.pipette_calibration_overflow_1, 3)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    def click_pipette_calibration_overflow_1(self) -> None:
        """Click the pipette calibration overflow button."""
        self.base.click(self.pipette_calibration_overflow_1)

    pipette_calibration_overflow_2: Element = Element(
        (By.XPATH, '(//button[@aria-label="CalibrationOverflowMenu_button"])[2]'),
        "Second three dot menu menu button for pipette calibrations.",
    )

    def get_pipette_calibration_overflow_2(self) -> WebElement:
        """Get the first pipette three dot menu button."""
        scroll: WebElement = self.base.clickable_wrapper(self.pipette_calibration_overflow_2, 3)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    def click_pipette_calibration_overflow_2(self) -> None:
        """Click the pipette calibration overflow button one down."""
        # TODO add locators
        self.base.click(self.pipette_calibration_overflow_2)

    calibrate_pipette_offset_button: Element = Element(
        (By.XPATH, '//button[text()="Calibrate Pipette Offset"]'),
        "Calibrate pipette offset button on the three dot menu.",
    )

    def click_pipette_offset_calibrate_button(self) -> None:
        """Click the calibrate button."""
        scroll: WebElement = self.base.clickable_wrapper(self.calibrate_pipette_offset_button, 3)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(scroll).perform()
        self.base.click(self.calibrate_pipette_offset_button)

    # pipette calibration

    start_tip_length: Element = Element(
        (By.XPATH, '//button[text()="start tip length calibration"]'),
        "Start tip length calibration button.",
    )

    def click_start_tip_length(self) -> None:
        """Click the start tip length calibration button."""
        self.base.click(self.start_tip_length)

    confirm_placement: Element = Element(
        (By.XPATH, '//button[text()="Confirm placement and continue"]'),
        "Confirm placement and continue button.",
    )

    def click_confirm_placement(self) -> None:
        """Click the Confirm placement and continue button."""
        self.base.click(self.confirm_placement)

    down_button: Element = Element(
        (By.XPATH, '//button[@title="down"]'),
        "down button.",
    )

    def click_down(self) -> None:
        """Click the down button."""
        self.base.click(self.down_button)

    back_button: Element = Element(
        (By.XPATH, '//button[@title="back"]'),
        "back button.",
    )

    def click_back(self) -> None:
        """Click the back button."""
        self.base.click(self.back_button)

    save_nozzle_z: Element = Element(
        (By.XPATH, '//button[text()="Save nozzle z-axis and move to pick up tip"]'),
        "Save nozzle z button.",
    )

    def click_save_nozzle_z(self) -> None:
        """Click the save nozzle z axis button."""
        self.base.click(self.save_nozzle_z)

    pickup_tip: Element = Element(
        (By.XPATH, '//button[text()="Pick up tip"]'),
        "Pickup tip button.",
    )

    def click_pickup_tip(self) -> None:
        """Click pickup_tip button."""
        self.base.click(self.pickup_tip)

    yes_move_to_measure: Element = Element(
        (By.XPATH, '//button[text()="Yes, move to measure tip length"]'),
        "Yes_move_to_measure button.",
    )

    def click_yes_move_to_measure(self) -> None:
        """Click yes move to measure button."""
        self.base.click(self.yes_move_to_measure)

    save_the_tip_length: Element = Element(
        (By.XPATH, '//button[text()="Save the tip length"]'),
        "Save the tip length button.",
    )

    def click_save_the_tip_length(self) -> None:
        """Click Save the tip length button."""
        self.base.click(self.save_the_tip_length)

    continue_to_pipette_offset: Element = Element(
        (By.XPATH, '//button[text()="continue to Pipette Offset Calibration"]'),
        "Continue to pipette offset button.",
    )

    def click_continue_to_pipette_offset(self) -> None:
        """Click Continue to pipette offset button."""
        # there can be 2 of these, seems UI bug, click the second one if there are 2
        self.base.clickable_wrapper(self.continue_to_pipette_offset, 3)
        buttons: List[WebElement] = self.base.finds_wrapper(self.continue_to_pipette_offset)
        self.base.click_webelement(buttons[-1])

    def shift_down_arrow_key(self) -> None:
        """Send the keystroke shift + down arrow key."""
        actions = ActionChains(self.base.driver)
        actions.send_keys(Keys.LEFT_SHIFT + Keys.ARROW_DOWN)
        actions.perform()

    save_calibration_move_to_slot_1: Element = Element(
        (By.XPATH, '//button[text()="save calibration and move to slot 1"]'),
        "Save_calibration_move_to_slot_1 button.",
    )

    def click_save_calibration_move_to_slot_1(self) -> None:
        """Save_calibration_move_to_slot_1 button."""
        # there can be 2 of these, seems UI bug, click the second one if there are 2
        self.base.clickable_wrapper(self.save_calibration_move_to_slot_1, 3)
        buttons: List[WebElement] = self.base.finds_wrapper(self.save_calibration_move_to_slot_1)
        self.base.click_webelement(buttons[-1])

    def up_arrow_key(self) -> None:
        """Send the keystroke arrow up key."""
        actions = ActionChains(self.base.driver)
        actions.send_keys(Keys.ARROW_UP)
        actions.perform()

    save_calibration: Element = Element(
        (By.XPATH, '//button[text()="save calibration"]'),
        "Save_calibration button.",
    )

    def click_save_calibration(self) -> None:
        """Save_calibration button."""
        # there can be 2 of these, seems UI bug, click the second one if there are 2
        self.base.clickable_wrapper(self.save_calibration, 3)
        buttons: List[WebElement] = self.base.finds_wrapper(self.save_calibration)
        self.base.click_webelement(buttons[-1])

    return_tip_exit: Element = Element(
        (By.XPATH, '//button[text()="Return tip to tip rack and exit"]'),
        "Return_tip_exit button.",
    )

    def click_return_tip_exit(self) -> None:
        """Return_tip_exit button."""
        # there can be 2 of these, seems UI bug, click the second one if there are 2
        self.base.clickable_wrapper(self.return_tip_exit, 3)
        buttons: List[WebElement] = self.base.finds_wrapper(self.return_tip_exit)
        self.base.click_webelement(buttons[-1])

    pipette_offset_missing_banner: Element = Element(
        (By.XPATH, '//div[text()="Pipette Offset calibration missing"]'),
        "Return_tip_exit button.",
    )

    def invisible_pipette_offset_missing_banner_safely(self) -> Optional[WebElement]:
        """Safely wait for Pipette Offset calibration missing banner to not be present or visible."""
        return self.base.invisible_wrapper_safe(self.pipette_offset_missing_banner, 15)

    calibrate_now = Element(
        (
            By.XPATH,
            "//button[text()='Calibrate now']",
        ),
        "Calibrate now buttons.",
    )
    # tried this and on Windows was not found, present or clickable
    # f"//div[@data-testid='PipetteCard_{pipette}']//button[text()='Calibrate now']"

    def wait_for_calibrate_now_present(self) -> None:
        """Wait calibrate now button clickable."""
        self.base.clickable_wrapper(self.calibrate_now)

    def click_calibrate_now(self) -> None:
        """Click the first calibrate now button on the screen."""
        self.base.click(self.calibrate_now)

    continue_with_calibration_block: Element = Element(
        (By.XPATH, '//button[text()="Use Calibration Block"]'),
        "Continue with calibration block button.",
    )

    def click_continue_with_calibration_block(self) -> None:
        """Return_tip_exit button."""
        with_block = self.get_with_calibration_block_safe()
        if with_block:
            with_block.click()

    def get_with_calibration_block_safe(self) -> Optional[WebElement]:
        """Look if a robot has a run by name. Return WebElement or None if not."""
        return self.base.clickable_wrapper_safe(self.continue_with_calibration_block, 4)
