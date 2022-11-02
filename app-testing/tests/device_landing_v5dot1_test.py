"""Test the Device Landing Page of Unified App."""
import os
from pathlib import Path
import time
from typing import Generic, List, Union
import pytest
import logging
from typing import Dict

from rich.console import Console
from rich.style import Style
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


from src.resources.ot_robot5dot1 import OtRobot
from src.menus.left_menu_v5dot1 import LeftMenu
from src.menus.protocol_file import ProtocolFile
from src.driver.drag_drop import drag_and_drop_file
from src.resources.ot_application import OtApplication
from src.pages.device_landing import DeviceLanding
from src.pages.robot_calibration import RobotCalibration
from src.pages.module_setup import ModuleSetup
from src.pages.labware_setup import LabwareSetup
from src.resources.robot_data import Dev, Kansas, RobotDataType

style = Style(color="#ac0505", bgcolor="yellow", bold=True)

logger = logging.getLogger(__name__)


@pytest.mark.v5dot1
def test_device_landing_v5dot1(
    chrome_options: Options,
    console: Console,
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

        # Instantiate the page object for the RobotsList.
        device_landing: DeviceLanding = DeviceLanding(
            driver, console, request.node.nodeid
        )
        left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
        left_menu.click_devices_button()
        assert device_landing.get_device_header().is_displayed()
        assert device_landing.get_how_to_setup_a_robot().is_displayed()
        device_landing.click_how_to_setup_a_robot()
        assert device_landing.get_setup_a_robot_header().is_displayed()
        assert device_landing.get_link_to_setting_up_a_new_robot().is_displayed()
        device_landing.click_close_button()
        for robot in robots:
            ot_robot = OtRobot(console, robot)
            console.print(
                f"Testing against robot {ot_robot.data.display_name}", style=style
            )
            assert ot_robot.is_alive(), "is the robot available?"

            # Is the robot connected?
            device_landing.robot_banner(robot_name=ot_robot.data.display_name)
            assert device_landing.get_robot_image().is_displayed()
            assert device_landing.get_left_mount_pipette().is_displayed()
            assert device_landing.get_right_mount_pipette().is_displayed()
            assert device_landing.get_overflow_button_on_device_landing().is_displayed()
            device_landing.base.click(
                device_landing.expander(ot_robot.data.display_name)
            )
            assert device_landing.get_image_robot_overview().is_displayed()
            assert device_landing.get_robot_name_device_detail().is_displayed()
            assert (
                device_landing.get_pipettes_and_modules_header_text()
                == "Instruments and Modules"
            )
            assert (
                device_landing.get_recent_protocol_runs_header_text()
                == "Recent Protocol Runs"
            )
            assert device_landing.get_left_mount_pipette_device_detail().is_displayed()
            assert device_landing.get_right_mount_pipette_device_detail().is_displayed()
            assert device_landing.get_mag_deck_image().is_displayed()
            assert device_landing.get_mag_module_name().is_displayed()
            assert device_landing.get_thermocycler_deck_image().is_displayed()
            assert device_landing.get_thermocycler_module_name().is_displayed()
            assert device_landing.get_tem_deck_image().is_displayed()
            assert device_landing.get_tem_module_name().is_displayed()


@pytest.mark.v5dot1
def test_run_protocol_robot_detail_page_v5dot1(
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
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])
        time.sleep(3)  # waiting for protocol to analyze
        device_landing: DeviceLanding = DeviceLanding(
            driver, console, request.node.nodeid
        )
        left_menu.click_devices_button()
        for robot in robots:
            ot_robot = OtRobot(console, robot)
            console.print(
                f"Testing against robot {ot_robot.data.display_name}", style=style
            )
            assert ot_robot.is_alive(), "is the robot available?"
            device_landing.base.click(
                device_landing.expander(ot_robot.data.display_name)
            )
            device_landing.click_run_a_protocol_button_device_landing()
            assert (
                device_landing.get_protocol_name_device_detail_slideout().is_displayed()
            )
            device_landing.click_proceed_to_setup_button_device_landing_page()
            time.sleep(2)

            # Verify the Setup for run page
            robot_calibrate = RobotCalibration(driver)
            assert robot_calibrate.get_robot_calibration().text == "Robot Calibration"
            robot_calibrate.click_robot_calibration()
            assert robot_calibrate.get_deck_calibration().text == "Deck Calibration"
            assert robot_calibrate.get_required_pipettes().text == "Required Pipettes"
            assert (
                robot_calibrate.get_calibration_ready_locator().text
                == "Calibration Ready"
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
            assert (
                module_setup.get_temperature_module().text == "Temperature Module GEN1"
            )
            assert module_setup.get_proceed_to_labware_setup().is_displayed()
            module_setup.click_proceed_to_labware_setup()
            labware_setup = LabwareSetup(driver)
            assert labware_setup.get_labware_setup_text().is_displayed()
            labware_setup.click_proceed_to_run_button()
            device_landing.click_start_run_button()
            assert device_landing.get_run_button().is_displayed()
            assert device_landing.get_success_banner_run_page().is_displayed()

            # TC2 : Running the protocol from run page by clciking on Run again button
            device_landing.click_start_run_button()
            assert device_landing.get_run_button().is_displayed()
            device_landing.click_start_run_button()  # clicking on start run after clicking run again on  Run page
            assert device_landing.get_run_button().is_displayed()
            assert device_landing.get_success_banner_run_page().is_displayed()


@pytest.mark.v5dot1
def test_run_protocol_robot_landing_page_v5dot1(
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
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])
        time.sleep(3)  # waiting for protocol to analyze
        device_landing: DeviceLanding = DeviceLanding(
            driver, console, request.node.nodeid
        )
        left_menu.click_devices_button()
        for robot in robots:
            ot_robot = OtRobot(console, robot)
            console.print(
                f"Testing against robot {ot_robot.data.display_name}", style=style
            )
            assert ot_robot.is_alive(), "is the robot available?"
            device_landing.base.click(
                device_landing.expander(ot_robot.data.display_name)
            )
            left_menu.click_devices_button()
            assert device_landing.get_overflow_button_on_device_landing().is_displayed()
            device_landing.click_run_protocol_robot_landing_overflow_button()  # clicking on run protocol from overflow menu on robot landing page
            device_landing.click_start_run_button()
            assert device_landing.get_run_button().is_displayed()
            device_landing.click_start_run_button()
            assert device_landing.get_run_button().is_displayed()
            assert device_landing.get_success_banner_run_page().is_displayed()
            device_landing.click_on_jump_to_current_step()
            assert device_landing.get_current_step_text().is_displayed()
