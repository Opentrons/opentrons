"""Model for the screen of module setup"""
from enum import Enum
import logging
from typing import Optional
import time
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)


class ModuleSetup:
    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    proceed_to_module_setup: tuple = (By.ID, "RobotCalStep_proceedButton")

    module_setup_text_locator: tuple = (By.ID, "RunSetupCard_module_setup_step")

    thermocycler_module: tuple = (By.XPATH, "//p[text()='Thermocycler Module']")

    magetic_module: tuple = (By.XPATH, "//p[text()='Magnetic Module GEN2']")

    temperature_module: tuple = (By.XPATH, "//p[text()='Temperature Module GEN2']")

    proceed_to_labware_setup: tuple = (By.ID, "ModuleSetup_proceedToLabwareSetup")

    @highlight
    def get_proceed_to_module_setup(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.proceed_to_module_setup)
        )

    @highlight
    def get_thermocycler_module(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.thermocycler_module)
        )

    @highlight
    def get_temperature_module(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.temperature_module)
        )

    @highlight
    def get_module_setup_text_locator(self) -> WebElement:
        scroll: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.module_setup_text_locator)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    @highlight
    def get_magetic_module(self) -> WebElement:
        scroll: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.magetic_module)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    @highlight
    def get_proceed_to_labware_setup(self) -> WebElement:
        scroll: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(ModuleSetup.proceed_to_labware_setup)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    def click_proceed_to_labware_setup(self) -> None:
        self.get_proceed_to_labware_setup().click()

    def click_proceed_to_module_setup(self) -> None:
        self.get_proceed_to_module_setup.click()
