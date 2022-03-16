"""Model for the Robot page that displays info and settings for the robot."""
import logging
from typing import Optional, Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight, highlight_element
from src.driver.wait import wait_until

logger = logging.getLogger(__name__)


class RobotPage:
    """Elements and actions for the robot detail page."""

    experimental_protocol_engine_toggle_locator: Tuple[str, str] = (
        By.CSS_SELECTOR,
        "button[aria-label='Enable experimental protocol engine']",
    )

    calibrate_deck_button_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='calibrate deck']",
    )

    recalibrate_deck_button_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='recalibrate deck']",
    )

    calibrate_deck_header: Tuple[str, str] = (
        By.XPATH,
        "//h4[text()='calibrate deck']",
    )

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def header(self, name: str) -> WebElement:
        """Get the header of the page by robot name."""
        header: WebElement = WebDriverWait(self.driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, f"//h1[text()='{name}']"))
        )
        return header

    @highlight
    def experimental_protocol_engine_toggle(self) -> WebElement:
        """Toggle button element for the experimental protocol engine."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                RobotPage.experimental_protocol_engine_toggle_locator
            )
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    @highlight
    def calibrate_robot_button(self) -> WebElement:
        """Button to open deck calibrition."""
        toggle: WebElement = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable(RobotPage.calibrate_deck_button_locator)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    @highlight
    def recalibrate_robot_button(self) -> WebElement:
        """Button to open deck calibrition."""
        button: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(RobotPage.recalibrate_deck_button_locator)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(button).perform()
        return button

    @highlight
    def deck_last_calibrated(self) -> Optional[WebElement]:
        """Text in Calibrate Deck section stating date."""
        calibrate_deck = self.driver.find_element(*RobotPage.calibrate_deck_header)
        highlight_element(calibrate_deck)
        elements = calibrate_deck.find_elements(
            By.XPATH,
            "//h4[text()='calibrate deck']/following-sibling::p[contains(text(),'Last calibrated')]",
        )
        if len(elements) == 1:
            logger.info(f"Text about last calibration: {elements[0].text}")
            return elements[0]
        return None

    def is_calibrated(self) -> bool:
        """Is the robot showing that the deck is calibrated."""
        if self.deck_last_calibrated() is not None:
            return True
        return False

    def start_calibration(self) -> None:
        """Regardless of calibration state start the calibration process."""
        if self.is_calibrated():
            self.recalibrate_robot_button().click()
        else:
            self.calibrate_robot_button().click()

    def wait_for_deck_to_show_calibrated(self) -> bool:
        """Wait for the text to show up that says 'Last calibrated'."""
        return wait_until(self.is_calibrated, 15)
