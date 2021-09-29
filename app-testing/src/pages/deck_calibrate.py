"""Model for the screens of deck calibration."""
from enum import Enum
import logging
from typing import Optional
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)


class DeckCalibrationButtonText(Enum):
    """All the buttons in the deck calibration sequence.

    In order by declaration here.
    """

    START = "start deck calibration"
    CONFIRM = "Confirm placement and continue"
    PICK_UP = "Pick up tip"
    SLOT_5 = "Yes, move to slot 5"
    REMEMBER = "remember z-axis and move to slot 1"
    SLOT_3 = "save calibration and move to slot 3"
    SLOT_7 = "save calibration and move to slot 7"
    SAVE = "save calibration"
    EXIT = "Return tip to tip rack and exit"


class DeckCalibration:
    """Elements and actions for deck calibration."""

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def get_calibration_button(self, text: DeckCalibrationButtonText) -> WebElement:
        """Get a calibration button in the sequence by its text."""
        return WebDriverWait(self.driver, 3).until(
            EC.element_to_be_clickable((By.XPATH, f"//button[text()='{text.value}']"))
        )

    def calibrate_deck(self) -> None:
        """Click the buttons in order to complete calibration."""
        for button_text in DeckCalibrationButtonText:
            logger.info(f"Looking for {button_text.name},{button_text.value}")
            self.get_calibration_button(button_text).click()

    @highlight
    def exit_button(self) -> Optional[WebElement]:
        """Find the calibration Exit button or return None."""
        try:
            return WebDriverWait(self.driver, 2).until(
                EC.element_to_be_clickable((By.XPATH, "//button[text()='exit']"))
            )
        except TimeoutException:
            # The element is not present or clickable.
            return None

    @highlight
    def exit_confirm_button(self) -> Optional[WebElement]:
        """Find the calibration Exit button or return None."""
        try:
            return WebDriverWait(self.driver, 2).until(
                EC.element_to_be_clickable(
                    (By.XPATH, "//button[text()='yes, exit now']")
                )
            )
        except TimeoutException:
            # The element is not present or clickable.
            return None
