"""Test the initial state the application with various setups."""
import os
from pathlib import Path
import time
from typing import Generic, List, Union
import pytest

from rich.console import Console
from rich.style import Style
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


from src.resources.ot_robot5dot1 import OtRobot
from src.resources.ot_application import OtApplication
from src.pages.app_settings import AppSettings
from src.menus.left_menu_v5dot1 import LeftMenu
from src.resources.robot_data import Dev, Kansas, RobotDataType

style = Style(color="#ac0505", bgcolor="yellow", bold=True)


@pytest.mark.v5dot1
def test_app_settings_v5dot1(
    chrome_options: Options,
    console: Console,
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Test the initial load of the app with a docker or dev mode emulated robot."""
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app should look on localhost for robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    # app should use the __DEV__ Hierarchy Reorganization
    os.environ["OT_APP_DEV_INTERNAL__hierarchyReorganization"] = "true"
    # Start chromedriver with our options and use the
    # context manager to ensure it quits.
    with webdriver.Chrome(options=chrome_options) as driver:
        console.print("Driver Capabilities.")
        console.print(driver.capabilities)
        # Each chromedriver instance will have its own user data store.
        # Instantiate the model of the application with the path to the
        # config.json
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        # Add the value to the config to ignore app updates.
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()

        # Instantiate the page object for the App settings.
        app_settings: AppSettings = AppSettings(driver, console, request.node.nodeid)
        left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)

        left_menu.click_gear_button()
        assert app_settings.get_app_settings_header().text == "App Settings"
        assert (
            app_settings.get_app_software_version_text().text == "App Software Version"
        )
        assert app_settings.get_app_software_version_value().text == "5.0.2"

        assert app_settings.get_link_restore_previous_version().is_displayed()
        app_settings.click_link_restore_previous_version()
        assert app_settings.get_how_to_restore_software_version_modal().is_displayed()
        assert (
            app_settings.get_learn_more_about_uninstalling_opentrons_app().is_displayed()
        )
        assert app_settings.get_link_to_previous_releases().is_displayed()
        app_settings.get_close_previous_software_modal()
        app_settings.click_close_previous_software_modal()

        assert app_settings.get_link_app_robot_sync().is_displayed()
        assert app_settings.get_software_update_alert_toggle().is_displayed()
        app_settings.click_software_update_alert_toggle()

        assert app_settings.get_connect_to_robot_via_IP_address_button().is_displayed()
        app_settings.click_connect_to_robot_via_IP_address_button()
