"""Model for the screen of Labware Setup."""
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element


class LabwareSetup:
    """Labware setup on setup for run."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    labware_setup_text_locator: Element = Element(
        (
            By.ID,
            "CollapsibleStep_Labware Setup",
        ),
        "todo description",
    )
    securing_labware_to_magnetic_module_link: Element = Element(
        (
            By.ID,
            "ExtraAttentionWarning_magnetic_module_link",
        ),
        "todo description",
    )
    securing_labware_to_thermocycler_link: Element = Element(
        (
            By.ID,
            "ExtraAttentionWarning_thermocycler_link",
        ),
        "todo description",
    )
    magnetic_module_modal: Element = Element(
        (
            By.XPATH,
            "//h3[text()='How To Secure Labware to the Magnetic Module']",
        ),
        "todo description",
    )
    thermocycler_module_modal: Element = Element(
        (
            By.XPATH,
            "//h3[text()='How To Secure Labware to the Thermocycler']",
        ),
        "todo description",
    )
    close_button: Element = Element(
        (
            By.XPATH,
            '//div[contains(normalize-space(@class), "modals")]//button[text()="close"]',
        ),
        "todo description",
    )
    proceed_to_run_button: Element = Element(
        (By.ID, "LabwareSetup_proceedToRunButton"),
        "todo description",
    )

    start_run_button: Element = Element(
        (
            By.XPATH,
            "//p[text()='Start Run']",
        ),
        "todo description",
    )

    run_again_button: Element = Element(
        (
            By.XPATH,
            "//p[text()='Run Again']",
        ),
        "todo description",
    )

    protocol_complete_banner: Element = Element(
        (
            By.XPATH,
            "//span[text()='Protocol run complete']",
        ),
        "todo description",
    )

    close_protocol_text_locator: Element = Element(
        (
            By.XPATH,
            "//button[text()='close']",
        ),
        "todo description",
    )
    yes_close_now_text_locator: Element = Element(
        (
            By.XPATH,
            "//button[text()='Yes, close now']",
        ),
        "todo description",
    )

    def get_labware_setup_text(self) -> WebElement:
        """Locator for labware setup text."""
        return self.base.clickable_wrapper(LabwareSetup.labware_setup_text_locator)

    def get_magnetic_module_link(self) -> WebElement:
        """Locator for securing labware to magentic module link."""
        return self.base.clickable_wrapper(LabwareSetup.securing_labware_to_magnetic_module_link)

    def click_magnetic_module_link(self) -> None:
        """Click magnetic module link."""
        self.base.click(LabwareSetup.securing_labware_to_magnetic_module_link)

    def get_thermocycler_link(self) -> WebElement:
        """Locator for securing labware to thermocycler module link."""
        return self.base.clickable_wrapper(LabwareSetup.securing_labware_to_thermocycler_link)

    def click_thermocycler_module_link(self) -> None:
        """Click thermocycler module link."""
        self.base.click(LabwareSetup.securing_labware_to_thermocycler_link)

    def get_magnetic_module_modal_text(self) -> WebElement:
        """Locator for magnetic module modal."""
        return self.base.clickable_wrapper(LabwareSetup.magnetic_module_modal)

    def get_thermocycler_module_modal_text(self) -> WebElement:
        """Locator for thermocycler module modal."""
        return self.base.clickable_wrapper(LabwareSetup.thermocycler_module_modal)

    def get_close_button(self) -> WebElement:
        """Locator for close button."""
        toggle: WebElement = self.base.clickable_wrapper(LabwareSetup.close_button)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_close_button(self) -> None:
        """Click close button."""
        toggle: WebElement = self.base.clickable_wrapper(LabwareSetup.close_button)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        self.base.click(LabwareSetup.close_button)

    def get_proceed_to_run_button(self) -> WebElement:
        """Locator for proceed to run button."""
        scroll: WebElement = self.base.clickable_wrapper(LabwareSetup.proceed_to_run_button)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(scroll).perform()
        return scroll

    def click_proceed_to_run_button(self) -> None:
        """Click proceed to run."""
        scroll: WebElement = self.base.clickable_wrapper(LabwareSetup.proceed_to_run_button)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(scroll).perform()
        self.base.click(LabwareSetup.proceed_to_run_button)

    def get_start_run_button(self) -> WebElement:
        """Locator for start run button."""
        return self.base.clickable_wrapper(LabwareSetup.start_run_button)

    def click_start_run_button(self) -> None:
        """Click start run."""
        self.base.click(LabwareSetup.start_run_button)

    def get_run_again_button(self) -> WebElement:
        """Locator for run again button."""
        return self.base.clickable_wrapper(LabwareSetup.run_again_button)

    def get_protocol_complete_banner(self) -> WebElement:
        """Locator for protocol complete banner."""
        return self.base.clickable_wrapper(LabwareSetup.protocol_complete_banner)

    def get_protocol_close_button(self) -> WebElement:
        """Locator for protocol close button."""
        return self.base.clickable_wrapper(LabwareSetup.close_protocol_text_locator)

    def get_confirmation_close_button(self) -> WebElement:
        """Locator for yes close now button."""
        return self.base.clickable_wrapper(LabwareSetup.yes_close_now_text_locator)

    def click_protocol_close_button(self) -> None:
        """Click protocol close."""
        self.base.click(LabwareSetup.close_protocol_text_locator)

    def click_confirmation_close_button(self) -> None:
        """Click confirmation close."""
        self.base.click(LabwareSetup.yes_close_now_text_locator)

    def click_labware_setup_text(self) -> None:
        """Click labware setup text."""
        self.base.click(LabwareSetup.labware_setup_text_locator)
