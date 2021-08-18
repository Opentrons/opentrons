"""Middle Menu after clicking more on the bottom left."""
from enum import Enum
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait

from src.driver.highlight import highlight


class MenuItems(Enum):
    """Menu item links as an enum."""

    APP = "app"
    CUSTOM_LABWARE = "custom-labware"
    NETWORK_AND_SYSTEM = "network-and-system"
    RESOURCES = "resources"


def get_menu_locator(link: MenuItems) -> tuple:
    """Construct the locator for the more menu items."""
    return (By.XPATH, f'//a[contains(@href,"#/more/{link.value}")]')


class MoreMenu:
    """Locators and actions for the more menu."""

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    @highlight
    def get_menu_link(self, link: MenuItems) -> WebElement:
        """Search for the More menu button by link."""
        return WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(get_menu_locator(link))
        )

    def click_menu_link(self, link: MenuItems) -> None:
        """Click on the more menu by link."""
        self.get_menu_link(link).click()
