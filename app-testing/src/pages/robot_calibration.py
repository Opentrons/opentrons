"""Model for the screen of robot calibration."""
import logging
from typing import Optional, Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)

""" Class for Setup For Run Page."""


class RobotCalibration:
    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    setup_for_run_text_locator: Tuple[str, str] = (
        By.ID,
        "RunSetupCard_setupForRun",
    )

    robot_calibration_text_locator: Tuple[str, str] = (
        By.ID,
        "RunSetupCard_robot_calibration_step",
    )

    deck_calibration_text_locator: Tuple[str, str] = (
        By.ID,
        "DeckCalibration_deckCalibrationTitle",
    )

    required_pipettes_text_locator: Tuple[str, str] = (
        By.ID,
        "PipetteCalibration_requiredPipettesTitle",
    )

    required_tip_lengh_calibration_text_locator: Tuple[str, str] = (
        By.ID,
        "TipRackCalibration_requiredTipLengthTitle",
    )
    calibration_helper_icon_text_locator: Tuple[str, str] = (
        By.ID,
        "RunSetupCard_calibrationText",
    )

    robot_calibration_help_link_locator: Tuple[str, str] = (
        By.ID,
        "DeckCalibration_robotCalibrationHelpLink",
    )
    robot_calibration_help_model_text: Tuple[str, str] = (
        By.XPATH,
        "//p[text()='Robot Calibration Help']",
    )
    close_robotcalibration_button: Tuple[str, str] = (
        By.ID,
        "RobotCalModal_closeButton",
    )

    proceed_to_module_setup_cta: Tuple[str, str] = (By.ID, "RobotCalStep_proceedButton")

    @highlight
    def get_setup_for_run(self) -> WebElement:
        """Search for the setup for run text."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(RobotCalibration.setup_for_run_text_locator)
        )

    @highlight
    def get_robot_calibration(self) -> WebElement:
        """Search for the robot calibration text."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(RobotCalibration.robot_calibration_text_locator)
        )

    @highlight
    def get_deck_calibration(self) -> WebElement:
        """Search for the deck calibration text."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(RobotCalibration.deck_calibration_text_locator)
        )

    @highlight
    def get_required_pipettes(self) -> WebElement:
        """Search for the required pipette calibration."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(RobotCalibration.required_pipettes_text_locator)
        )

    def click_robot_calibration(self) -> None:
        self.get_robot_calibration().click()

    @highlight
    def get_calibration_ready_locator(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                RobotCalibration.calibration_helper_icon_text_locator
            )
        )

    @highlight
    def get_robot_calibration_help_locator(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                RobotCalibration.robot_calibration_help_link_locator
            )
        )

    @highlight
    def get_robot_calibration_help_modal_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                RobotCalibration.robot_calibration_help_model_text
            )
        )

    @highlight
    def get_robot_calibration_close_button(self) -> WebElement:
        close: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(RobotCalibration.close_robotcalibration_button)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(close).perform()
        return close

    def click_robot_calibration_help_link(self) -> None:
        self.get_robot_calibration_help_locator().click()

    def click_robot_calibration_close_button(self) -> None:
        self.get_robot_calibration_close_button().click()

    @highlight
    def get_required_tip_length_calibration(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                RobotCalibration.required_tip_lengh_calibration_text_locator
            )
        )
