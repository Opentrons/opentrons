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
    os.environ["OT_APP_DEV_INTERNAL__hierarchyReorganization"] = "false"
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

        ## General tab verification
        left_menu.click_gear_button()
        assert app_settings.get_app_settings_header().text == "App Settings"
        assert (
            app_settings.get_app_software_version_text().text == "App Software Version"
        )
        assert app_settings.get_app_software_version_value().is_displayed()

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
        assert app_settings.get_software_update_alert_header().is_displayed()
        assert app_settings.get_software_update_alert_toggle().is_displayed()
        app_settings.click_software_update_alert_toggle()

        assert app_settings.get_connect_robot_via_IP_header().is_displayed()
        assert app_settings.get_connect_to_robot_via_IP_address_button().is_displayed()
        app_settings.click_connect_to_robot_via_IP_address_button()
        assert (
            app_settings.get_connect_to_robot_via_IP_address_slideout_header().is_displayed()
        )
        assert (
            app_settings.get_link_learn_more_about_connecting_a_robot_manually().is_displayed()
        )
        assert app_settings.get_textbox_to_enter_the_ip().is_displayed()
        app_settings.click_add_ip_or_hostname()
        assert app_settings.get_try_again_link().is_displayed()
        app_settings.enter_hostname(["AKNA"])
        assert app_settings.get_add_button().is_displayed()
        app_settings.click_add_button()
        assert app_settings.get_done_button().is_displayed()
        app_settings.click_done_button()

        ## Privacy Tab verification
        app_settings.click_privacy_tab()
        assert app_settings.get_robot_app_analytics().is_displayed()
        assert app_settings.get_robot_app_analytics_toggle().is_displayed()
        app_settings.click_robot_app_analytics()

        ## Advanced Tab Verification
        app_settings.click_advanced_tab()
        assert app_settings.get_advanced_tab().is_displayed()
        assert app_settings.get_update_channel().is_displayed()
        assert app_settings.get_update_channel_latest_stable().is_displayed()
        assert app_settings.get_additional_custom_labware_source_folder().is_displayed()
        assert app_settings.get_change_labware_source_folder_button().is_displayed()
        assert app_settings.get_additional_source_folder().is_displayed()

        assert app_settings.get_tip_length_calibration_method().is_displayed()
        assert app_settings.get_tip_calibration_block_to_calibrate().is_displayed()
        app_settings.click_tip_calibration_block_to_calibrate()
        assert app_settings.get_tip_calaibration_trash_bin().is_displayed()
        app_settings.click_tip_calaibration_trash_bin()
        assert app_settings.get_tip_calibration_prompt_choose().is_displayed()
        app_settings.click_tip_calibration_prompt_choose()

        assert app_settings.get_display_unavailable_robots_header().is_displayed()
        assert app_settings.get_display_unavailable_robots_toggle().is_displayed()
        app_settings.click_unavailable_robot_toggle()

        assert app_settings.get_clear_unavailable_robots_header().is_displayed()
        assert app_settings.get_clear_unavailable_robots_list_button().is_displayed()
        app_settings.click_clear_unavailable_robot_button()

        assert app_settings.get_enable_developer_tool_header().is_displayed()
        assert app_settings.get_enable_developer_tools_toggle().is_displayed()
        app_settings.click_enable_developer_tools_toggle()

        app_settings.click_feature_flag_tab()
        assert app_settings.get_feature_flag_tab().is_displayed()
