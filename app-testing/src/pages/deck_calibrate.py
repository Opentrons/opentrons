"""Model for the screens of deck calibration."""
from enum import Enum
from typing import Optional

from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from src.driver.base import Base, Element


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

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    def calibration_button(self, button_text: str) -> Element:
        """Calibration button."""
        return Element(
            (By.XPATH, f"//button[text()='{button_text}']"),
            "button with text {button_text}",
        )

    def click_calibration_button(self, text: DeckCalibrationButtonText) -> None:
        """Get a calibration button in the sequence by its text."""
        self.base.click(self.calibration_button(text.value))

    def calibrate_deck(self) -> None:
        """Click the buttons in order to complete calibration."""
        for button_text in DeckCalibrationButtonText:
            self.console.print(f"Looking for {button_text.name},{button_text.value}")
            self.click_calibration_button(button_text)

    exit_button: Element = Element((By.XPATH, "//button[text()='exit']"), "Exit button")

    def get_exit_button_safe(self) -> Optional[WebElement]:
        """Find the calibration Exit button or return None."""
        return self.base.clickable_wrapper_safe(self.exit_button)

    exit_confirm_button: Element = Element(
        (By.XPATH, "//button[text()='yes, exit now']"), "exit confirm button"
    )

    def get_exit_confirm_button(self) -> Optional[WebElement]:
        """Find the calibration Exit button or return None."""
        return self.base.clickable_wrapper_safe(self.exit_confirm_button)
