"""Test the initial state the application with various setups."""
import logging
import os
from pathlib import Path
import platform
import time
import pytest
from typing import Dict
from selenium import webdriver
from pytest import FixtureRequest
from selenium.webdriver.chrome.options import Options

from src.menus.left_menu import LeftMenu
from src.pages.protocol_upload import ProtocolUpload
from src.pages.deck_calibrate import DeckCalibration
from src.resources.ot_application import OtApplication
from src.pages.overview import Overview
from src.pages.robot_page import RobotPage
from src.pages.robot_calibration import RobotCalibration
from src.pages.module_setup import ModuleSetup
from src.pages.labware_setup import LabwareSetup
from src.menus.robots_list import RobotsList
from src.menus.protocol_file import ProtocolFile
from src.driver.drag_drop import drag_and_drop_file

logger = logging.getLogger(__name__)


def test_protocol_upload(
    chrome_options: Options,
    test_json_protocols: Dict[str, Path],
    request: FixtureRequest,
) -> None:
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    with webdriver.Chrome(options=chrome_options) as driver:
        logger.debug(f"driver capabilities {driver.capabilities}")
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        # ignore updates
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()
        robots_list = RobotsList(driver)
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        left_menu = LeftMenu(driver)
        left_menu.click_more_button()
        protocol_upload = ProtocolUpload(driver)
        protocol_upload.click_app_left_panel()
        protocol_upload.click_enable_developer_toggle()
        protocol_upload.click_enable_pur_feature()
        protocol_upload.goto_robots_page()
        # Instantiate the page object for the RobotsList.
        robots_list = RobotsList(driver)
        # toggle the DEV robot
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        # calibrate
        robot_page = RobotPage(driver)
        # Check if calibration state. If calibration is started
        # but not finished, exit and start over
        calibrate = DeckCalibration(driver)
        exit_button = calibrate.exit_button()
        if exit_button:
            exit_button.click()
            calibrate.exit_confirm_button().click()
        driver.save_screenshot(
            f"results/{request.node.originalname}.before_start_calibration.png"
        )
        robot_page.start_calibration()
        calibrate.calibrate_deck()
        assert robot_page.wait_for_deck_to_show_calibrated()
        left_menu = LeftMenu(driver)
        left_menu.click_protocol_upload_button()
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_json_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_json_protocols["protocoluploadjson"])
        robot_calibrate = RobotCalibration(driver)
        assert robot_calibrate.get_setup_for_run().text == "Setup for Run"
        assert robot_calibrate.get_robot_calibration().text == "Robot Calibration"
        robot_calibrate.click_robot_calibration()
        assert robot_calibrate.get_deck_calibration().text == "Deck Calibration"
        assert robot_calibrate.get_required_pipettes().text == "Required Pipettes"
        assert (
            robot_calibrate.get_calibration_ready_locator().text == "Calibration ready"
        )
        assert (
            robot_calibrate.get_robot_calibration_help_locator().text
            == "Robot Calibration Help"
        )
        robot_calibrate.click_robot_calibration_help_link()
        assert (
            robot_calibrate.get_robot_calibration_help_modal_text().text
            == "Robot Calibration Help"
        )
        assert robot_calibrate.get_robot_calibration_close_button().is_displayed()
        robot_calibrate.click_robot_calibration_close_button()
        assert (
            robot_calibrate.get_required_tip_length_calibration().text
            == "Required Tip Length Calibrations"
        )
        module_setup = ModuleSetup(driver)
        assert module_setup.get_proceed_to_module_setup().is_displayed()
        module_setup.click_proceed_to_module_setup()
        assert module_setup.get_module_setup_text_locator().text == "Module Setup"
        assert module_setup.get_thermocycler_module().text == "Thermocycler Module"
        assert module_setup.get_magetic_module().text == "Magnetic Module GEN2"
        assert module_setup.get_temperature_module().text == "Temperature Module GEN2"
        assert module_setup.get_proceed_to_labware_setup().is_displayed()
        module_setup.click_proceed_to_labware_setup()
        labware_setup = LabwareSetup(driver)
        assert labware_setup.get_labware_setup_text().is_displayed()
        assert labware_setup.get_magnetic_module_link().is_displayed()
        assert labware_setup.get_thermocycler_link().is_displayed()
        labware_setup.click_magnetic_module_link()
        assert labware_setup.get_magnetic_module_modal_text().is_displayed()
        labware_setup.click_close_button()
        assert labware_setup.get_thermocycler_link().is_displayed()
        labware_setup.click_thermocycler_module_link()
        assert labware_setup.get_thermocycler_module_modal_text().is_displayed()
        labware_setup.click_close_button()
        labware_setup.click_proceed_to_run_button()
        time.sleep(2)
