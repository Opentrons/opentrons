"""Model for the screen of Labware Setup."""
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


class LabwareSetup:
    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    labware_setup_text_locator: tuple = (By.ID, "RunSetupCard_labware_setup_step")
    securing_labware_to_magnetic_module_link: tuple = (
        By.ID,
        "ExtraAttentionWarning_magnetic_module_link",
    )
    securing_labware_to_thermocycler_link: tuple = (
        By.ID,
        "ExtraAttentionWarning_thermocycler_link",
    )
    magnetic_module_modal: tuple = (
        By.XPATH,
        "//h3[text()='Securing Labware to the Magnetic Module']",
    )
    thermocycler_module_modal: tuple = (
        By.XPATH,
        "//h3[text()='Securing Labware to the Thermocycler']",
    )
    close_button: tuple = (
        By.XPATH,
        '//div[contains(normalize-space(@class), "modals")]//button[text()="close"]',
    )
    proceed_to_run_button: tuple = (By.ID, "LabwareSetup_proceedToRunButton")

    @highlight
    def get_labware_setup_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwareSetup.labware_setup_text_locator)
        )

    @highlight
    def get_magnetic_module_link(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwareSetup.securing_labware_to_magnetic_module_link
            )
        )

    def click_magnetic_module_link(self) -> None:
        self.get_magnetic_module_link().click()

    @highlight
    def get_thermocycler_link(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(
                LabwareSetup.securing_labware_to_thermocycler_link
            )
        )

    def click_thermocycler_module_link(self) -> None:
        self.get_thermocycler_link().click()

    @highlight
    def get_magnetic_module_modal_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwareSetup.magnetic_module_modal)
        )

    @highlight
    def get_thermocycler_module_modal_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwareSetup.thermocycler_module_modal)
        )

    @highlight
    def get_close_button(self) -> WebElement:
        scroll: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwareSetup.close_button)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    def click_close_button(self) -> None:
        self.get_close_button().click()

    @highlight
    def get_proceed_to_run_button(self) -> WebElement:
        scroll: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(LabwareSetup.proceed_to_run_button)
        )
        actions = ActionChains(self.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    def click_proceed_to_run_button(self) -> None:
        self.get_proceed_to_run_button().click()
