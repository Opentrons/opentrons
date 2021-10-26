"""Model for the screen of Edge cases."""
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

"""Class for Moam Setup flow."""


class MoamPur:
    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    organization_author_text_locator: Tuple[str, str] = (
        By.ID,
        "MetadataCard_protocolOrganizationAuthor",
    )
    description_text_locator: Tuple[str, str] = (
        By.ID,
        "MetadataCard_protocolDescription",
    )
    attach_pipette_button: Tuple[str, str] = (
        By.ID,
        "PipetteCalibration_attachPipetteButton",
    )
    moam_link: Tuple[str, str] = (
        By.XPATH,
        "//a[text()='Multiple Modules Help']",
    )
    moam_modal_text_locator: Tuple[str, str] = (
        By.XPATH,
        "//h3[text()='Multiple Modules Help']",
    )
    close_protocol_text_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Yes, close now']",
    )
    yes_close_now_text_locator: Tuple[str, str] = (
        By.XPATH,
        "//button[text()='Yes, close now']",
    )

    @highlight
    def get_organization_author_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(MoamPur.organization_author_text_locator)
        )

    @highlight
    def get_description_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(MoamPur.description_text_locator)
        )

    @highlight
    def get_attach_pipette_button(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(MoamPur.attach_pipette_button)
        )

    @highlight
    def get_moam_link(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(MoamPur.moam_link)
        )

    @highlight
    def get_moam_modal_text(self) -> WebElement:
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(MoamPur.moam_modal_text_locator)
        )

    def click_moam_link(self) -> None:
        self.get_moam_link().click()
