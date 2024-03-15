"""Test the Protocol Landing of the page."""
import time
from pathlib import Path
from typing import Dict

import pytest
from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
from automation.pages.device_landing import DeviceLanding
from automation.pages.labware_setup import LabwareSetup
from automation.pages.module_setup import ModuleSetup
from automation.pages.protocol_landing import ProtocolLanding
from automation.pages.setup_calibration import SetupCalibration
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver


@pytest.mark.skip("Need to fix.")
def test_protocol_landing(
    driver: WebDriver,
    console: Console,
    test_protocols: Dict[str, Path],
    request: pytest.FixtureRequest,
) -> None:
    """Run a protocol from the protocol page.

    Must have all calibrations done for this to run.
    """
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    left_menu.navigate("protocols")

    # Verifying elements on the protocol page
    protocol_landing: ProtocolLanding = ProtocolLanding(driver, console, request.node.nodeid)
    console.print(
        f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}",
        style="white on blue",
    )
    drag_and_drop_file(
        protocol_landing.get_drag_drop_file_button(),
        test_protocols["protocoluploadjson"],
    )

    # Verifying elements on Protocol Landing Page
    assert protocol_landing.get_import_button_protocol_landing().is_displayed()
    assert protocol_landing.get_deckMap_protocol_landing(protocol_name="script_pur_sample_1").is_displayed()
    assert protocol_landing.get_protocol_name_text_protocol_landing(protocol_name="script_pur_sample_1") == "script_pur_sample_1"
    protocol_landing.click_overflow_menu()
    assert protocol_landing.get_show_in_folder().is_displayed()
    assert protocol_landing.get_run_protocol().is_displayed()
    assert protocol_landing.get_delete_protocol().is_displayed()
    protocol_landing.click_run_on_protocol_landing()
    # todo validate overflow menu disappears
    # Verify the robot slideout from protocol detail page
    assert protocol_landing.get_slideout_header_on_protocol_detail().is_displayed()
    # todo bug around when you click if selected it unselects
    # protocol_landing.click_robot_on_protocol_detail()
    protocol_landing.click_proceed_to_setup_on_protocol_detail()
    time.sleep(8)
    # todo need dynamic wait here
    robot_calibrate = SetupCalibration(driver, console, request.node.nodeid)
    assert robot_calibrate.get_robot_calibration().text == "Robot Calibration"
    robot_calibrate.click_robot_calibration()
    assert robot_calibrate.get_deck_calibration().text == "Deck Calibration"
    assert robot_calibrate.get_required_pipettes().text == "Required Pipettes"
    assert robot_calibrate.get_calibration_ready_locator().text == "Calibration Ready"
    assert robot_calibrate.get_required_tip_length_calibration().text == "Required Tip Length Calibrations"
    module_setup = ModuleSetup(driver, console, request.node.nodeid)
    assert module_setup.get_proceed_to_module_setup().is_displayed()
    module_setup.click_proceed_to_module_setup()
    assert module_setup.get_module_setup_text_locator().text == "Module Setup"
    assert module_setup.get_thermocycler_module().text == "Thermocycler Module GEN1"
    assert module_setup.get_magnetic_module().text == "Magnetic Module GEN2"
    assert module_setup.get_temperature_module().text == "Temperature Module GEN2"
    assert module_setup.get_proceed_to_labware_setup().is_displayed()
    module_setup.click_proceed_to_labware_setup()
    labware_setup = LabwareSetup(driver, console, request.node.nodeid)
    assert labware_setup.get_labware_setup_text().is_displayed()
    labware_setup.click_proceed_to_run_button()
    device_landing: DeviceLanding = DeviceLanding(driver, console, request.node.nodeid)
    # Verify the components on run page
    device_landing.click_start_run_button()
    assert device_landing.get_run_button().is_displayed()
    assert device_landing.get_success_banner_run_page().is_displayed()

    # Uncurrent the run from the robot
    assert protocol_landing.get_close_button_uncurrent_run().is_displayed()
    protocol_landing.click_close_button_uncurrent_run()
