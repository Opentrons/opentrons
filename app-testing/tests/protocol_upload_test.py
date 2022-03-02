"""Test the initial state the application with various setups."""
import logging
import os
from pathlib import Path
import time
from typing import Dict
from selenium import webdriver
from pytest import FixtureRequest
from selenium.webdriver.chrome.options import Options

from src.menus.left_menu import LeftMenu
from src.pages.protocol_upload import ProtocolUpload
from src.resources.ot_application import OtApplication
from src.resources.ot_robot import OtRobot
from src.pages.robot_page import RobotPage
from src.pages.robot_calibration import RobotCalibration
from src.pages.deck_calibrate import DeckCalibration
from src.pages.module_setup import ModuleSetup
from src.pages.labware_setup import LabwareSetup
from src.menus.robots_list import RobotsList
from src.pages.moam_pur import MoamPur
from src.pages.gen1_pipette_pur import Gen1PipettePur
from src.pages.labware_position_check import LabwarePositionCheck
from src.menus.protocol_file import ProtocolFile
from src.driver.drag_drop import drag_and_drop_file

logger = logging.getLogger(__name__)

"""Happy path for PUR - protocol upload revamp."""


def test_protocol_upload(
    chrome_options: Options,
    test_protocols: Dict[str, Path],
    request: FixtureRequest,
) -> None:

    robot = OtRobot()
    # expecting docker emulated robot
    assert robot.is_alive(), "is a robot available?"
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
        protocol_upload = ProtocolUpload(driver)
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
        if not robot_page.is_calibrated():
            robot_page.start_calibration()
            calibrate.calibrate_deck()
            assert robot_page.wait_for_deck_to_show_calibrated()
        left_menu.click_protocol_upload_button()
        labware_setup = LabwareSetup(driver)
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])
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
            == "See How Robot Calibration Works"
        )
        robot_calibrate.click_robot_calibration_help_link()
        assert (
            robot_calibrate.get_robot_calibration_help_modal_text().text
            == "See How Robot Calibration Works"
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
        assert module_setup.get_magetic_module().text == "Magnetic Module GEN1"
        assert module_setup.get_temperature_module().text == "Temperature Module GEN1"
        assert module_setup.get_proceed_to_labware_setup().is_displayed()
        module_setup.click_proceed_to_labware_setup()
        assert labware_setup.get_labware_setup_text().is_displayed()
        assert labware_setup.get_magnetic_module_link().is_displayed()
        assert labware_setup.get_thermocycler_link().is_displayed()
        labware_setup.click_magnetic_module_link()
        assert labware_setup.get_magnetic_module_modal_text().is_displayed()
        labware_setup.click_close_button()
        assert labware_setup.get_thermocycler_link().is_displayed()
        labware_setup.click_thermocycler_module_link()
        assert labware_setup.get_thermocycler_module_modal_text().is_displayed()
        labware_setup = LabwareSetup(driver)
        labware_setup.click_close_button()
        labware_setup.click_proceed_to_run_button()
        labware_setup.click_start_run_button()
        assert labware_setup.get_protocol_complete_banner().is_displayed()
        assert labware_setup.get_run_again_button().is_displayed
        labware_setup.click_protocol_close_button()
        labware_setup.click_confirmation_close_button()


def test_moam_pur(
    chrome_options: Options,
    test_protocols: Dict[str, Path],
    request: FixtureRequest,
) -> None:
    """Upload a protocol."""
    robot = OtRobot()
    # expecting docker emulated robot
    assert robot.is_alive(), "is a robot available?"
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
        # Instantiate the page object for the RobotsList.
        robots_list = RobotsList(driver)
        # toggle the DEV robot
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        left_menu.click_protocol_upload_button()
        protocol_file = ProtocolFile(driver)
        logger.info(f"uploading protocol: {test_protocols['moamjson'].resolve()}")
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["moamjson"])
        robot_calibrate = RobotCalibration(driver)
        robot_calibrate.click_robot_calibration()
        moam_pur = MoamPur(driver)
        assert (
            moam_pur.get_organization_author_text().text == "Organization/Author\nAA BB"
        )
        assert moam_pur.get_description_text().text == "Description\nModule - PUR"
        # Verify that the Pipette missing text is available
        module_setup = ModuleSetup(driver)
        module_setup.click_module_setup_text()
        assert moam_pur.get_moam_link().is_displayed()
        moam_pur.click_moam_link()
        assert moam_pur.get_moam_modal_text().is_displayed()
        labware_setup = LabwareSetup(driver)
        labware_setup.click_close_button()
        moam_pur.click_protocol_close_button()
        moam_pur.click_confirmation_close_button()


def test_LPC_flow(
    chrome_options: Options,
    test_protocols: Dict[str, Path],
    request: FixtureRequest,
) -> None:
    """Upload a protocol."""
    robot = OtRobot()
    # expecting docker emulated robot
    assert robot.is_alive(), "is a robot available?"
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    with webdriver.Chrome(options=chrome_options) as driver:
        logger.debug(f"driver capabilities {driver.capabilities}")
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        # ignore updates.
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()
        robots_list = RobotsList(driver)
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        left_menu = LeftMenu(driver)
        # Instantiate the page object for the RobotsList.
        robots_list = RobotsList(driver)
        # toggle the DEV robot
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        left_menu.click_protocol_upload_button()
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])
        robot_calibrate = RobotCalibration(driver)
        labware_setup = LabwareSetup(driver)
        labware_setup.click_labware_setup_text()
        labware_position_check = LabwarePositionCheck(driver)
        labware_position_check.click_labware_position_button()
        assert (
            labware_position_check.get_introScreen_labware_position_check_overview().is_displayed()
        )
        labware_position_check.click_begin_labware_position_check_button()
        assert (
            labware_position_check.get_how_to_tell_pipette_is_centered_link().is_displayed()
        )
        labware_position_check.click_how_to_tell_pipette_is_centered_link()
        labware_setup.click_close_button()
        labware_position_check.click_reveal_all_jog_controls()
        labware_position_check.click_back_jog_button()
        labware_position_check.click_down_jog_button()
        labware_position_check.click_right_jog_button()
        labware_position_check.click_forward_jog_button()
        labware_position_check.click_confirm_position_button_pickup_tip()
        labware_position_check.click_confirm_position_moveto_slot_5()
        assert (
            labware_position_check.get_how_to_tell_pipette_is_centered_link().is_displayed()
        )
        labware_position_check.click_reveal_all_jog_controls()
        labware_position_check.click_back_jog_button()
        labware_position_check.click_down_jog_button()
        labware_position_check.click_right_jog_button()
        labware_position_check.click_forward_jog_button()
        labware_position_check.click_confirm_position_moveto_slot_6()
        assert (
            labware_position_check.get_how_to_tell_pipette_is_centered_link().is_displayed()
        )
        labware_position_check.click_reveal_all_jog_controls()
        labware_position_check.click_back_jog_button()
        labware_position_check.click_down_jog_button()
        labware_position_check.click_right_jog_button()
        labware_position_check.click_forward_jog_button()
        labware_position_check.click_confirm_position_returntip_slot_home()
        assert (
            labware_position_check.get_labware_position_check_complete().is_displayed()
        )
        assert (
            labware_position_check.get_deckmap_labware_check_complete().is_displayed()
        )
        assert labware_position_check.get_section_list_step0().is_displayed()
        assert labware_position_check.get_section_list_step1().is_displayed()
        assert labware_position_check.get_section_list_step2().is_displayed()
        assert (
            labware_position_check.get_close_and_apply_labware_offset_data_button().is_displayed()
        )
        labware_position_check.click_get_close_and_apply_labware_offset_data_button()
        assert labware_position_check.get_labware_success_toast().is_displayed()
        assert (
            labware_position_check.get_labwareName_on_deckmap().text
            == "Opentrons 96 Tip Rack 10 µL"
        )
        assert labware_position_check.get_x_offset_text_on_deckmap().is_displayed()
        assert labware_position_check.get_x_offset_value_on_deckmap().text == "1.0"
        assert labware_position_check.get_y_offset_text_on_deckmap().is_displayed()
        assert labware_position_check.get_y_offset_value_on_deckmap().text == "1.0"
        assert labware_position_check.get_z_offset_text_on_deckmap().is_displayed()
        assert labware_position_check.get_z_offset_value_on_deckmap().text == "1.0"


def test_gen1_pipette(
    chrome_options: Options,
    test_protocols: Dict[str, Path],
    request: FixtureRequest,
) -> None:
    """Upload a protocol."""
    robot = OtRobot()
    # expecting docker emulated robot
    assert robot.is_alive(), "is a robot available?"
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
        # Instantiate the page object for the RobotsList.
        robots_list = RobotsList(driver)
        # toggle the DEV robot
        if not robots_list.is_robot_toggle_active(RobotsList.DEV):
            robots_list.get_robot_toggle(RobotsList.DEV).click()
        left_menu.click_protocol_upload_button()
        protocol_file = ProtocolFile(driver)
        logger.info(f"uploading protocol: {test_protocols['gen1pipette'].resolve()}")
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["gen1pipette"])
        robot_calibrate = RobotCalibration(driver)
        robot_calibrate.click_robot_calibration()
        gen1_pipette = Gen1PipettePur(driver)
        assert gen1_pipette.get_gen1_pipette_mismatch_text().is_displayed()
        assert gen1_pipette.get_link_pipette_compatibility().is_displayed()
        # Assert that no modules are available and step2 is labware setup
        assert gen1_pipette.get_step2_text_locator().is_displayed()
        gen1_pipette.click_on_step2()
        labware_setup = LabwareSetup(driver)
        assert labware_setup.get_labware_setup_text().is_displayed()
