"""Test the initial state the application with various setups."""
import logging
import os
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from src.menus.left_menu import LeftMenu
from src.menus.robots_list import RobotsList
from src.menus.more_menu import MoreMenu
from src.menus.more_menu import MenuItems
from src.pages.robot_page import RobotPage
from src.resources.ot_robot import OtRobot
from src.resources.ot_application import OtApplication

logger = logging.getLogger(__name__)


def test_initial_load_robot_available(chrome_options: Options) -> None:
    """Test the initail load of the app with a docker or dev mode emulated robot."""
    robot = OtRobot()
    # expecting robot
    assert robot.is_alive(), "is a robot available?"
    # use env variable to prevent the analytics pop up
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app should look on localhost for robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    # Start chromedriver with our options and use the
    # context manager to ensure it quits.
    with webdriver.Chrome(options=chrome_options) as driver:
        logger.debug(f"driver capabilities {driver.capabilities}")
        # Each chromedriver instance will have its own user data store.
        # Instantiate the model of the application with teh path to the
        # config.json
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        # Add the value to the config to ignore app updates.
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()
        # Instantiate the page object for the RobotsList.
        robots_list = RobotsList(driver)
        # toggle the DEV robot
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        robot_page = RobotPage(driver)
        # find the Robot info header
        robot_page.header(robots_list.DEV)
        # Find the experimental protocol engine toggle.
        # It is at the bottom of the options.
        robot_page.experimental_protocol_engine_toggle()
        # Click on the pipettes link.
        robots_list.get_robot_pipettes_link(RobotsList.DEV).click()
        # Click on the modules link.
        robots_list.get_robot_modules_link(RobotsList.DEV).click()


def test_initial_load_no_robot(chrome_options: Options) -> None:
    """Test the initail load of the app with NO robot.

    Note that this test takes > 30 seconds.  The spinner stops after 30 seconds.
    If the machine has Wi-Fi or USB connected robot(s) this test will fail.
    """
    # app cannot see localhost robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = ""
    # use env variable to prevent the analytics pop up
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    with webdriver.Chrome(options=chrome_options) as driver:
        logger.debug(f"driver capabilities {driver.capabilities}")
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        # Add the value to the config to ignore app updates.
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()
        robots_list = RobotsList(driver)
        logger.info(f"Number of robots connected = {robots_list.get_robot_count()}")
        assert (
            robots_list.get_robot_count() == 0
        ), "Having a robot connected blocks this test."
        robots_list.wait_for_spinner_visible()
        robots_list.wait_for_spinner_invisible()
        robots_list.get_no_robots_found()
        robots_list.get_try_again_button()


def test_more_menu(chrome_options: Options) -> None:
    """Test the more menu."""
    # use variable to prevent the popup
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    with webdriver.Chrome(options=chrome_options) as driver:
        logger.debug(f"driver capabilities {driver.capabilities}")
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        logger.info(ot_application.config)
        # Add the value to the config to ignore app updates.
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()
        left_menu = LeftMenu(driver)
        left_menu.click_more_button()
        more_menu = MoreMenu(driver)
        # Click each more menu link.
        for link in MenuItems.__reversed__():
            more_menu.click_menu_link(link)
