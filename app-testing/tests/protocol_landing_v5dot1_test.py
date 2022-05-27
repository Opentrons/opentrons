"""Test the Protocol Landing of the page."""
from distutils.command.config import LANG_EXT
import logging
import os
from pathlib import Path
import time
from turtle import left
from typing import Dict
from typing import Generic, List, Union
import pytest

from rich.console import Console
from rich.style import Style
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


from src.resources.ot_robot5dot1 import OtRobot
from src.resources.ot_application import OtApplication
from src.pages.protocol_landing_v5dot1 import ProtocolLanding
from src.pages.robot_calibration import RobotCalibration
from src.pages.module_setup import ModuleSetup
from src.pages.device_landing import DeviceLanding
from src.pages.labware_setup import LabwareSetup
from src.menus.left_menu_v5dot1 import LeftMenu
from src.resources.robot_data import Dev, Kansas, RobotDataType
from src.menus.protocol_file import ProtocolFile
from src.driver.drag_drop import drag_and_drop_file

style = Style(color="#ac0505", bgcolor="yellow", bold=True)
logger = logging.getLogger(__name__)


@pytest.mark.v5dot1
def test_protocol_detail_v5dot1(
    chrome_options: Options,
    console: Console,
    test_protocols: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Test the initial load of the app with a docker or dev mode emulated robot."""
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app should look on localhost for robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
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
        left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
        left_menu.click_protocols_button()

        # Verifying elements on the protocol page
        protocol_landing: ProtocolLanding = ProtocolLanding(
            driver, console, request.node.nodeid
        )
        assert protocol_landing.get_choose_file_button().is_displayed()
        assert protocol_landing.get_drag_drop_file_button().is_displayed()
        assert protocol_landing.get_protocol_designer_link().is_displayed()
        assert protocol_landing.get_protocol_library_link().is_displayed()
        assert protocol_landing.get_python_api_link().is_displayed()

        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])

        # Verifying elements on Protocol Landing Page
        assert protocol_landing.get_import_button_protocol_landing().is_displayed()
        assert protocol_landing.get_deckMap_protocol_landing().is_displayed()
        assert (
            protocol_landing.get_protocol_name_text_protocol_landing()
            == "script_pur_sample_1"
        )
        assert protocol_landing.get_left_mount_text_protocol_landing() == "LEFT MOUNT"
        assert (
            protocol_landing.get_left_mount_value_protocol_landing()
            == "P10 Single-Channel GEN1"
        )
        assert protocol_landing.get_right_mount_text_protocol_landing() == "RIGHT MOUNT"
        assert (
            protocol_landing.get_right_mount_value_protocol_landing()
            == "P300 Single-Channel GEN1"
        )
        assert protocol_landing.get_mag_module_protocol_landing().is_displayed()
        assert protocol_landing.get_temp_module_protocol_landing().is_displayed()
        assert (
            protocol_landing.get_thermocycler_module_protocol_landing().is_displayed()
        )
        assert protocol_landing.get_updated_timestamp_protocol_landing().is_displayed()
        protocol_landing.click_protocol_card()

        # Verifying elements on Protocol Detail Page
        assert (
            protocol_landing.get_creation_method_text_protocol_detail()
            == "CREATION METHOD"
        )
        assert (
            protocol_landing.get_creation_method_value_protocol_detail()
            == "Protocol Designer 4.0"
        )
        assert (
            protocol_landing.get_last_updated_text_protocol_detail() == "LAST UPDATED"
        )
        assert protocol_landing.get_last_updated_value_protocol_detail().is_displayed()
        assert (
            protocol_landing.get_last_analyzed_text_protocol_detail() == "LAST ANALYZED"
        )
        assert protocol_landing.get_last_analyzed_value_protocol_detail().is_displayed()
        assert protocol_landing.get_author_text_protocol_detail() == "ORG/AUTHOR"
        assert protocol_landing.get_author_value_protocol_detail() == "NN MM"
        assert protocol_landing.get_description_text_protocol_detail().is_displayed()
        assert protocol_landing.get_deckmap_protocol_detail().is_displayed()

        # Verifying Robot Configuration
        assert (
            protocol_landing.get_robot_configuration_protocol_detail()
            == "Robot Configuration"
        )
        assert protocol_landing.get_left_mount_protocol_detail().is_displayed()
        assert protocol_landing.get_right_mount_protocol_detail().is_displayed()
        assert protocol_landing.get_mag_mod_protocol_detail().is_displayed()
        assert protocol_landing.get_temp_mod_protocol_detail().is_displayed()
        assert protocol_landing.get_thermocycler_mod_protocol_detail().is_displayed()

        protocol_landing.click_run_protocol_on_protocol_detail()

        # Verify the robot slideout from protocol detail page
        assert protocol_landing.get_slideout_header_on_protocol_detail().is_displayed()
        protocol_landing.click_robot_on_protocol_detail()
        protocol_landing.click_proceed_to_setup_on_protocol_detail()

        robot_calibrate = RobotCalibration(driver)
        assert robot_calibrate.get_robot_calibration().text == "Robot Calibration"
        robot_calibrate.click_robot_calibration()
        assert robot_calibrate.get_deck_calibration().text == "Deck Calibration"
        assert robot_calibrate.get_required_pipettes().text == "Required Pipettes"
        assert (
            robot_calibrate.get_calibration_ready_locator().text == "Calibration Ready"
        )
        assert (
            robot_calibrate.get_required_tip_length_calibration().text
            == "Required Tip Length Calibrations"
        )
        module_setup = ModuleSetup(driver)
        assert module_setup.get_proceed_to_module_setup().is_displayed()
        module_setup.click_proceed_to_module_setup()
        assert module_setup.get_module_setup_text_locator().text == "Module Setup"
        assert module_setup.get_thermocycler_module().text == "Thermocycler Module"
        assert module_setup.get_magetic_module().text == "Magnetic Module GEN1"
        assert module_setup.get_temperature_module().text == "Temperature Module GEN1"
        assert module_setup.get_proceed_to_labware_setup().is_displayed()
        module_setup.click_proceed_to_labware_setup()
        labware_setup = LabwareSetup(driver)
        assert labware_setup.get_labware_setup_text().is_displayed()
        labware_setup.click_proceed_to_run_button()
        device_landing: DeviceLanding = DeviceLanding(
            driver, console, request.node.nodeid
        )
        # Verify the componenets on run page
        device_landing.click_start_run_button()
        assert device_landing.get_run_button().is_displayed()
        assert device_landing.get_success_banner_run_page().is_displayed()

        # Uncurrent the run from the robot
        assert protocol_landing.get_close_button_uncurrent_run().is_displayed()
        protocol_landing.click_close_button_uncurrent_run()


@pytest.mark.v5dot1
def test_protocol_landing_v5dot1(
    chrome_options: Options,
    console: Console,
    test_protocols: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Test the initial load of the app with a docker or dev mode emulated robot."""
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app should look on localhost for robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
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
        left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
        left_menu.click_protocols_button()

        # Verifying elements on the protocol page
        protocol_landing: ProtocolLanding = ProtocolLanding(
            driver, console, request.node.nodeid
        )
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])

        # Verifying elements on Protocol Landing Page
        assert protocol_landing.get_import_button_protocol_landing().is_displayed()
        assert protocol_landing.get_deckMap_protocol_landing(
            protocol_name="script_pur_sample_1"
        ).is_displayed()
        assert (
            protocol_landing.get_protocol_name_text_protocol_landing(
                protocol_name="script_pur_sample_1"
            )
            == "script_pur_sample_1"
        )
        protocol_landing.click_overflow_menu()
        assert protocol_landing.get_show_in_folder().is_displayed()
        assert protocol_landing.get_run_protocol().is_displayed()
        assert protocol_landing.get_delete_protocol().is_displayed()
        protocol_landing.click_run_on_protocol_landing()
        # Verify the robot slideout from protocol detail page
        assert protocol_landing.get_slideout_header_on_protocol_detail().is_displayed()
        protocol_landing.click_robot_on_protocol_detail()
        protocol_landing.click_proceed_to_setup_on_protocol_detail()

        robot_calibrate = RobotCalibration(driver)
        assert robot_calibrate.get_robot_calibration().text == "Robot Calibration"
        robot_calibrate.click_robot_calibration()
        assert robot_calibrate.get_deck_calibration().text == "Deck Calibration"
        assert robot_calibrate.get_required_pipettes().text == "Required Pipettes"
        assert (
            robot_calibrate.get_calibration_ready_locator().text == "Calibration Ready"
        )
        assert (
            robot_calibrate.get_required_tip_length_calibration().text
            == "Required Tip Length Calibrations"
        )
        module_setup = ModuleSetup(driver)
        assert module_setup.get_proceed_to_module_setup().is_displayed()
        module_setup.click_proceed_to_module_setup()
        assert module_setup.get_module_setup_text_locator().text == "Module Setup"
        assert module_setup.get_thermocycler_module().text == "Thermocycler Module"
        assert module_setup.get_magetic_module().text == "Magnetic Module GEN1"
        assert module_setup.get_temperature_module().text == "Temperature Module GEN1"
        assert module_setup.get_proceed_to_labware_setup().is_displayed()
        module_setup.click_proceed_to_labware_setup()
        labware_setup = LabwareSetup(driver)
        assert labware_setup.get_labware_setup_text().is_displayed()
        labware_setup.click_proceed_to_run_button()
        device_landing: DeviceLanding = DeviceLanding(
            driver, console, request.node.nodeid
        )
        # Verify the componenets on run page
        device_landing.click_start_run_button()
        assert device_landing.get_run_button().is_displayed()
        assert device_landing.get_success_banner_run_page().is_displayed()

        # Uncurrent the run from the robot
        assert protocol_landing.get_close_button_uncurrent_run().is_displayed()
        protocol_landing.click_close_button_uncurrent_run()
