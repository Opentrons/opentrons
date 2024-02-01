"""Model for the screen of module setup."""


from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement

from automation.driver.base import Base, Element


class ModuleSetup:
    """All elements and actions for the Module Setup."""

    def __init__(self, driver: WebDriver, console: Console, execution_id: str) -> None:
        """Initialize with driver."""
        self.base: Base = Base(driver, console, execution_id)
        self.console: Console = console

    proceed_to_module_setup: Element = Element((By.ID, "RobotCalStep_proceedButton"), "proceed to module setup button")

    module_setup_text_locator: Element = Element(
        (
            By.ID,
            "CollapsibleStep_Module Setup",
        ),
        "setup text",
    )

    thermocycler_module: Element = Element(
        (
            By.XPATH,
            "//p[text()='Thermocycler Module GEN1']",
        ),
        "",
    )

    magnetic_module: Element = Element((By.XPATH, "//p[text()='Magnetic Module GEN2']"), "")

    temperature_module: Element = Element(
        (
            By.XPATH,
            "//p[text()='Temperature Module GEN2']",
        ),
        "",
    )

    proceed_to_labware_setup: Element = Element(
        (
            By.ID,
            "ModuleSetup_proceedToLabwareSetup",
        ),
        "",
    )

    def get_proceed_to_module_setup(self) -> WebElement:
        """Locator for proceed to module setup."""
        return self.base.clickable_wrapper(ModuleSetup.proceed_to_module_setup)

    def get_thermocycler_module(self) -> WebElement:
        """Locator for thermocycler module on deckmap."""
        return self.base.clickable_wrapper(ModuleSetup.thermocycler_module)

    def get_temperature_module(self) -> WebElement:
        """Locator for temperature module on deckmap."""
        return self.base.clickable_wrapper(ModuleSetup.temperature_module)

    def get_module_setup_text_locator(self) -> WebElement:
        """Locator for module setup text."""
        toggle: WebElement = self.base.clickable_wrapper(ModuleSetup.module_setup_text_locator)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def get_magnetic_module(self) -> WebElement:
        """Locator for magnetic module on deckmap."""
        toggle: WebElement = self.base.clickable_wrapper(ModuleSetup.magnetic_module)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def get_proceed_to_labware_setup(self) -> WebElement:
        """Locator for proceed to labware setup."""
        toggle: WebElement = self.base.clickable_wrapper(ModuleSetup.proceed_to_labware_setup)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        return toggle

    def click_proceed_to_labware_setup(self) -> None:
        """Proceed to labware setup."""
        toggle: WebElement = self.base.clickable_wrapper(ModuleSetup.proceed_to_labware_setup)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        self.base.click(ModuleSetup.proceed_to_labware_setup)

    def click_proceed_to_module_setup(self) -> None:
        """Click proceed to labware setup."""
        self.base.click(ModuleSetup.proceed_to_module_setup)

    def click_module_setup_text(self) -> None:
        """Click module setup text."""
        toggle: WebElement = self.base.clickable_wrapper(ModuleSetup.module_setup_text_locator)
        actions = ActionChains(self.base.driver)
        actions.move_to_element(toggle).perform()
        self.base.click(ModuleSetup.module_setup_text_locator)
