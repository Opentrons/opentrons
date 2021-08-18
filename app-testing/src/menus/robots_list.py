"""Model for the list of robots."""
import logging
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from src.driver.highlight import highlight

logger = logging.getLogger(__name__)


def get_robot_toggle_selector(name: str) -> tuple:
    """Get the locator tuple for a robot's toggle by name of the robot."""
    return (By.XPATH, f"//a[contains(@href,{name})]//button")


def get_robot_pipette_link_selector(name: str) -> tuple:
    """Get the locator tuple for a robot's pipette link by name of the robot."""
    return (
        By.XPATH,
        f'//ol//a[contains(@href,"#/robots/opentrons-{name}/instruments")]',
    )


def get_robot_modules_link_selector(name: str) -> tuple:
    """Get the locator tuple for a robot's modules link by name of the robot."""
    return (
        By.XPATH,
        f'//ol//a[contains(@href,"#/robots/opentrons-{name}/modules")]',
    )


class RobotsList:
    """All elements and actions for the Robots List."""

    DEV = "dev"
    spinner: tuple = (By.CSS_SELECTOR, "svg[class*=spin]")
    header: tuple = (By.XPATH, '//h2[text()="Robots"]')
    refresh_list: tuple = (By.XPATH, '//button[text()="refresh list"]')
    no_robots_found: tuple = (By.XPATH, '//h3[text()="No robots found!"]')
    try_again_button: tuple = (By.XPATH, '//button[text()="try again"]')

    def __init__(self, driver: WebDriver) -> None:
        """Initialize with driver."""
        self.driver: WebDriver = driver

    def is_robot_toggle_active(self, name: str) -> bool:
        """Is a toggle for a robot 'on' using the name of the robot."""
        return self.get_robot_toggle(name).get_attribute("class").find("_on_") != -1

    @highlight
    def get_robot_toggle(self, name: str) -> WebElement:
        """Retrieve the Webelement toggle buttone for a robot by name."""
        toggle_locator: tuple = get_robot_toggle_selector(name)
        toggle: WebElement = WebDriverWait(self.driver, 5).until(
            EC.element_to_be_clickable(toggle_locator)
        )
        return toggle

    @highlight
    def get_robot_pipettes_link(self, name: str) -> WebElement:
        """Retrieve the pipettes link for a robot by name."""
        link_locator: tuple = get_robot_pipette_link_selector(name)
        link: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(link_locator)
        )
        return link

    @highlight
    def get_robot_modules_link(self, name: str) -> WebElement:
        """Retrieve the modules link for a robot by name."""
        link_locator: tuple = get_robot_modules_link_selector(name)
        link: WebElement = WebDriverWait(self.driver, 2).until(
            EC.element_to_be_clickable(link_locator)
        )
        return link

    def wait_for_spinner_invisible(self) -> None:
        """Wait for spinner to become invisible.  This should take 30 seconds."""
        WebDriverWait(self.driver, 31).until(
            EC.invisibility_of_element_located(RobotsList.spinner)
        )

    def wait_for_spinner_visible(self) -> None:
        """Wait for spinner to become visible.  This should take ~1 seconds."""
        WebDriverWait(self.driver, 2).until(
            EC.visibility_of_element_located(RobotsList.spinner)
        )

    @highlight
    def get_no_robots_found(self) -> WebElement:
        """Find with no waiting the h3 No robots found!"""
        return self.driver.find_element(*RobotsList.no_robots_found)

    @highlight
    def get_try_again_button(self) -> WebElement:
        """Find with no waiting the TRY AGAIN button."""
        return self.driver.find_element(*RobotsList.try_again_button)

    def get_robot_count(self) -> int:
        """Get the number of robot links."""
        try:
            # wait 6 seconds to see if any robot links become visible
            WebDriverWait(self.driver, 6).until(
                EC.presence_of_element_located(
                    (By.CSS_SELECTOR, "a[class*=robot_link]")
                )
            )
        except TimeoutException:
            return 0
        return len(self.driver.find_elements(By.CSS_SELECTOR, "a[class*=robot_link]"))
