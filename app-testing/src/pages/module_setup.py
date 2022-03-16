"""Model for the screen of module setup."""
import logging
from typing import Tuple
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)


class ModuleSetup:
    """All elements and actions for the Module Setup."""

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    proceed_to_module_setup: Tuple[str, str] = (By.ID, "RobotCalStep_proceedButton")

    module_setup_text_locator: Tuple[str, str] = (
        By.ID,
        "CollapsibleStep_Module Setup",
    )

    thermocycler_module: Tuple[str, str] = (
        By.XPATH,
        "//p[text()='Thermocycler Module']",
    )

    magetic_module: Tuple[str, str] = (By.XPATH, "//p[text()='Magnetic Module GEN1']")

    temperature_module: Tuple[str, str] = (
        By.XPATH,
        "//p[text()='Temperature Module GEN1']",
    )

    proceed_to_labware_setup: Tuple[str, str] = (
        By.ID,
        "ModuleSetup_proceedToLabwareSetup",
    )

    @highlight
    def get_proceed_to_module_setup(self) -> WebElement:
        """Locator for proceed to module setup."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.proceed_to_module_setup)
        )

    @highlight
    def get_thermocycler_module(self) -> WebElement:
        """Locator for thermocycler module on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.thermocycler_module)
        )

    @highlight
    def get_temperature_module(self) -> WebElement:
        """Locator for temperature module on deckmap."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.temperature_module)
        )

    @highlight
    def get_module_setup_text_locator(self) -> WebElement:
        """Locator for module setup text."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.module_setup_text_locator)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    @highlight
    def get_magetic_module(self) -> WebElement:
        """Locator for magnetic module on deckmap."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.magetic_module)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    @highlight
    def get_proceed_to_labware_setup(self) -> WebElement:
        """Locator for proceed to labware setup."""
        toggle: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.proceed_to_labware_setup)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_proceed_to_labware_setup(self) -> None:
        self.get_proceed_to_labware_setup().click()

    def click_proceed_to_module_setup(self) -> None:
        self.get_proceed_to_module_setup().click()

    def click_module_setup_text(self) -> None:
        self.get_module_setup_text_locator().click()
