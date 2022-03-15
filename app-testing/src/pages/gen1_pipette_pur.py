"""Model for the screen of No Modules and Gen1 Pipette."""
import logging
from typing import Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)

"""Class for No Modules and Gen1 Pipette."""


class Gen1PipettePur:
    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    gen1_pipette_mismatch_text: Tuple[str, str] = (
        By.XPATH,
        "//p[text()='Pipette generation mismatch']",
    )

    link_pipette_compatibility: Tuple[str, str] = (
        By.ID,
        "PipetteCalibration_pipetteMismatchHelpLink",
    )
    tip_length_calibrate_now: Tuple[str, str] = (
        By.ID,
        "TipRackCalibration_calibrateTipRackButton",
    )
    step2_text_locator: Tuple[str, str] = (
        By.ID,
        "CollapsibleStep_STEP 2",
    )

    @highlight
    def get_gen1_pipette_mismatch_text(self) -> WebElement:
        """Locator for gen 1 pipette mismatch text."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(Gen1PipettePur.gen1_pipette_mismatch_text)
        )

    @highlight
    def get_link_pipette_compatibility(self) -> WebElement:
        """Locator for pipette compatibility link."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(Gen1PipettePur.link_pipette_compatibility)
        )

    @highlight
    def get_tip_length_calibrate_now(self) -> WebElement:
        """Locator for tip length calibrate now button."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(Gen1PipettePur.tip_length_calibrate_now)
        )

    @highlight
    def get_step2_text_locator(self) -> WebElement:
        """Locator for step 2 text."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(Gen1PipettePur.step2_text_locator)
        )

    def click_on_step2(self) -> None:
        self.get_step2_text_locator().click()
