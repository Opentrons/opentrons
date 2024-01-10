"""Model for the screen of robot calibration."""

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element

""" Class for Setup For Run Page."""


class SetupCalibration:
    """Setup for run calibration section."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    setup_for_run_text_locator: Element = Element(
        (
            By.ID,
            "RunSetupCard_setupForRun",
        ),
        "Setup for run text",
    )

    robot_calibration_text_locator: Element = Element(
        (
            By.ID,
            "CollapsibleStep_Robot Calibration",
        ),
        "Robot Calibration text.",
    )

    deck_calibration_text_locator: Element = Element(
        (
            By.ID,
            "DeckCalibration_deckCalibrationTitle",
        ),
        "Deck calibration text.",
    )

    required_pipettes_text_locator: Element = Element(
        (
            By.ID,
            "PipetteCalibration_requiredPipettesTitle",
        ),
        "required pipettes text",
    )

    required_tip_length_calibration_text_locator: Element = Element(
        (
            By.ID,
            "TipRackCalibration_requiredTipLengthTitle",
        ),
        "tip length calibration text",
    )

    calibration_helper_icon_text_locator: Element = Element(
        (
            By.ID,
            "RunSetupCard_calibrationText",
        ),
        "calibration helper icon text",
    )

    robot_calibration_help_link_locator: Element = Element(
        (
            By.ID,
            "DeckCalibration_robotCalibrationHelpLink",
        ),
        "calibration help link locator",
    )

    robot_calibration_help_model_text: Element = Element(
        (
            By.XPATH,
            "//p[text()='See How Robot Calibration Works']",
        ),
        "calibration help modal text",
    )
    close_robot_calibration_button: Element = Element(
        (
            By.ID,
            "RobotCalModal_closeButton",
        ),
        "close robot calibration button",
    )

    proceed_to_module_setup_cta: Element = Element((By.ID, "RobotCalStep_proceedButton"), "proceed to module setup button")

    def get_setup_for_run(self) -> WebElement:
        """Search for the setup for run text."""
        return self.base.clickable_wrapper(SetupCalibration.setup_for_run_text_locator)

    def get_robot_calibration(self) -> WebElement:
        """Search for the robot calibration text."""
        return self.base.clickable_wrapper(SetupCalibration.robot_calibration_text_locator)

    def get_deck_calibration(self) -> WebElement:
        """Search for the deck calibration text."""
        return self.base.clickable_wrapper(SetupCalibration.deck_calibration_text_locator)

    def get_required_pipettes(self) -> WebElement:
        """Search for the required pipette calibration."""
        return self.base.clickable_wrapper(SetupCalibration.required_pipettes_text_locator)

    def click_robot_calibration(self) -> None:
        """Click robot calibration."""
        self.base.click(SetupCalibration.robot_calibration_text_locator)

    def get_calibration_ready_locator(self) -> WebElement:
        """Calibration helper icon text."""
        return self.base.clickable_wrapper(SetupCalibration.calibration_helper_icon_text_locator)

    def get_robot_calibration_help_locator(self) -> WebElement:
        """Robot calibration help link."""
        return self.base.clickable_wrapper(SetupCalibration.robot_calibration_help_link_locator)

    def get_robot_calibration_help_modal_text(self) -> WebElement:
        """Robot calibration help modal."""
        return self.base.clickable_wrapper(SetupCalibration.robot_calibration_help_model_text)

    def get_robot_calibration_close_button(self) -> WebElement:
        """Robot claibration close button."""
        close: WebElement = self.base.clickable_wrapper(SetupCalibration.close_robot_calibration_button)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(close).perform()
        return close

    def click_robot_calibration_help_link(self) -> None:
        """Robot calibration help link."""
        self.base.click(SetupCalibration.robot_calibration_help_link_locator)

    def click_robot_calibration_close_button(self) -> None:
        """Click robot calibration close."""
        close: WebElement = self.base.clickable_wrapper(SetupCalibration.close_robot_calibration_button)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(close).perform()
        self.base.click(SetupCalibration.close_robot_calibration_button)

    def get_required_tip_length_calibration(self) -> WebElement:
        """Tip length calibration."""
        return self.base.clickable_wrapper(SetupCalibration.required_tip_length_calibration_text_locator)
