"""Test the Device Landing Page of Unified App."""

import time
from pathlib import Path
from typing import Dict, List

import pytest
from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
from automation.pages.device_landing import DeviceLanding
from automation.pages.labware_setup import LabwareSetup
from automation.pages.modal import Modal
from automation.pages.module_setup import ModuleSetup
from automation.pages.protocol_landing import ProtocolLanding
from automation.pages.setup_calibration import SetupCalibration
from automation.resources.ot_robot import OtRobot
from automation.resources.robot_data import Dev, EmulatedAlpha, RobotDataType
from rich.console import Console
from selenium.webdriver.chromium.webdriver import WebDriver


@pytest.mark.skip("Need to fix.")
def test_device_landing(
    driver: WebDriver,
    console: Console,
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Test some of the functionality and data displayed on the device landing page."""
    modal: Modal = Modal(driver, console, request.node.nodeid)
    not_now_button = modal.get_not_now()
    if not_now_button is not None:
        modal.base.click(modal.not_now)

    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    left_menu.navigate("devices")

    device_landing: DeviceLanding = DeviceLanding(driver, console, request.node.nodeid)
    assert device_landing.get_device_header().is_displayed()
    assert device_landing.get_how_to_setup_a_robot().is_displayed()
    device_landing.click_how_to_setup_a_robot()
    assert device_landing.get_setup_a_robot_header().is_displayed()
    assert device_landing.get_link_to_setting_up_a_new_robot().is_displayed()
    device_landing.click_close_button()
    # just testing on the emulated_alpha robot
    robot = next(robot for robot in robots if robot.name == EmulatedAlpha.name)
    ot_robot = OtRobot(console, robot)

    if ot_robot.is_alive():
        console.print(f"Testing against robot {ot_robot.data.name}", style="white on blue")
    else:
        console.print(f"Robot {ot_robot.data.display_name} not alive.", style="white on blue")
        raise AssertionError("Fail Fast robot not alive.")

    # Is the robot connected?
    device_landing.robot_banner(robot_name=ot_robot.data.display_name)
    assert device_landing.get_robot_image(robot_name=ot_robot.data.display_name).is_displayed()
    assert device_landing.get_left_mount_pipette(robot_name=ot_robot.data.display_name).is_displayed()
    assert device_landing.get_right_mount_pipette(robot_name=ot_robot.data.display_name).is_displayed()
    assert device_landing.get_overflow_button_on_device_landing(ot_robot.data.display_name).is_displayed()
    # go to the detail page
    device_landing.get_robot_image(robot_name=ot_robot.data.display_name).click()
    assert device_landing.get_image_robot_overview().is_displayed()
    assert device_landing.get_robot_name_device_detail(robot_name=ot_robot.data.display_name).is_displayed()
    assert device_landing.get_pipettes_and_modules_header_text() == "Pipettes and Modules"
    assert device_landing.get_recent_protocol_runs_header_text() == f"{ot_robot.data.display_name}'s Protocol Runs"
    assert device_landing.set_lights(True) is True, "Lights toggle was not set to on."

    assert device_landing.get_left_mount_pipette_device_detail(ot_robot.data.left_pipette_model).is_displayed()
    assert device_landing.get_right_mount_pipette_device_detail(ot_robot.data.right_pipette_model).is_displayed()
    # assert device_landing.get_mag_deck_image().is_displayed()
    # assert device_landing.get_mag_module_name().is_displayed()
    assert device_landing.get_thermocycler_gen2_deck_image().is_displayed()
    assert device_landing.get_thermocycler_gen2_module_name().is_displayed()
    assert device_landing.get_heater_shaker_deck_image().is_displayed()
    assert device_landing.get_heater_shaker_module_name().is_displayed()
    # assert device_landing.get_tem_deck_image().is_displayed()
    # assert device_landing.get_tem_module_name().is_displayed()


@pytest.mark.skip("Need to fix.")
def test_run_protocol_robot_landing_page(
    driver: WebDriver,
    console: Console,
    test_protocols: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Run a protocol from the device landing page.

    Must have all calibrations done for this to run.
    """
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    left_menu.navigate("protocols")
    protocol_landing = ProtocolLanding(driver, console, request.node.nodeid)
    console.log(f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}")
    drag_and_drop_file(
        protocol_landing.get_drag_drop_file_button(),
        test_protocols["protocoluploadjson"],
    )
    # todo dynamic
    # waiting for protocol to analyze
    time.sleep(3)
    device_landing: DeviceLanding = DeviceLanding(driver, console, request.node.nodeid)
    left_menu.navigate("devices")
    # this test is against only the emulated alpha robot
    robot = next(robot for robot in robots if robot.name == EmulatedAlpha.name)
    ot_robot = OtRobot(console, robot)
    console.print(f"Testing against robot {ot_robot.data.name}", style="white on blue")
    assert ot_robot.is_alive(), "is the robot available?"
    if device_landing.get_robot_banner_safe(ot_robot.data.display_name) is None:
        raise AssertionError(f"Stopping the test, the robot with name {ot_robot.data.display_name} is not found.")
    if device_landing.get_go_to_run_safe(ot_robot.data.display_name) is not None:
        raise AssertionError(f"Stopping the test, the robot with name {ot_robot.data.display_name} has an active run.")
    device_landing.click_overflow_menu_button_on_device_landing(ot_robot.data.display_name)
    device_landing.click_run_a_protocol_on_overflow(ot_robot.data.display_name)
    assert device_landing.get_protocol_name_device_detail_slideout().is_displayed()
    # see that the overflow menu has disappeared (fixed bug)
    assert device_landing.get_run_a_protocol_on_overflow(ot_robot.data.display_name) is None
    device_landing.click_proceed_to_setup_button_device_landing_page()
    time.sleep(5)

    # Verify the Setup for run page
    setup_calibrate = SetupCalibration(driver, console, request.node.nodeid)
    assert setup_calibrate.get_robot_calibration().text == "Robot Calibration"
    setup_calibrate.click_robot_calibration()
    assert setup_calibrate.get_deck_calibration().text == "Deck Calibration"
    assert setup_calibrate.get_required_pipettes().text == "Required Pipettes"
    assert setup_calibrate.get_calibration_ready_locator().text == "Calibration Ready"
    assert setup_calibrate.get_required_tip_length_calibration().text == "Required Tip Length Calibrations"
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
    device_landing.click_start_run_button()
    assert device_landing.get_run_button().is_displayed()
    assert device_landing.get_success_banner_run_page().is_displayed()

    # TC2 : Running the protocol from run page by clicking on Run again button
    device_landing.click_start_run_button()
    assert device_landing.get_run_button().is_displayed()
    device_landing.click_start_run_button()  # clicking on start run after clicking run again on  Run page
    assert device_landing.get_run_button().is_displayed()
    assert device_landing.get_success_banner_run_page().is_displayed()

    # Uncurrent the run from the robot
    assert protocol_landing.get_close_button_uncurrent_run().is_displayed()
    protocol_landing.click_close_button_uncurrent_run()


@pytest.mark.skip("Need to fix.")
def test_run_protocol_robot_detail_page(
    driver: WebDriver,
    console: Console,
    test_protocols: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Test creating and running from the device detail page.

    Must have all calibrations done for this to run.
    """
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    left_menu.navigate("protocols")
    protocol_landing = ProtocolLanding(driver, console, request.node.nodeid)
    console.log(f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}")
    drag_and_drop_file(
        protocol_landing.get_drag_drop_file_button(),
        test_protocols["protocoluploadjson"],
    )
    time.sleep(3)  # waiting for protocol to analyze
    device_landing: DeviceLanding = DeviceLanding(driver, console, request.node.nodeid)
    left_menu.navigate("devices")
    # this test is against only the dev robot
    robot = next(robot for robot in robots if robot.display_name == Dev.display_name)
    ot_robot = OtRobot(console, robot)
    console.print(f"Testing against robot {ot_robot.data.display_name}", style="white on blue")
    assert ot_robot.is_alive(), "is the robot available?"
    if device_landing.get_robot_banner_safe(ot_robot.data.display_name) is None:
        raise AssertionError(f"Stopping the test, the robot with name {ot_robot.data.display_name} is not found.")
    if device_landing.get_go_to_run_safe(ot_robot.data.display_name) is not None:
        raise AssertionError(f"Stopping the test, the robot with name {ot_robot.data.display_name} has an active run.")
    device_landing.click_robot_banner(ot_robot.data.display_name)
    # now we are on the device detail page
    # click Run a protocol button to open the slider
    device_landing.click_device_detail_run_a_protocol_button()
    device_landing.click_proceed_to_setup_button_device_landing_page()
    # todo dynamic
    time.sleep(5)

    # Verify the Setup for run page
    setup_calibrate = SetupCalibration(driver, console, request.node.nodeid)
    assert setup_calibrate.get_robot_calibration().text == "Robot Calibration"
    setup_calibrate.click_robot_calibration()
    assert setup_calibrate.get_deck_calibration().text == "Deck Calibration"
    assert setup_calibrate.get_required_pipettes().text == "Required Pipettes"
    assert setup_calibrate.get_calibration_ready_locator().text == "Calibration Ready"
    assert setup_calibrate.get_required_tip_length_calibration().text == "Required Tip Length Calibrations"
    module_setup = ModuleSetup(driver, console, request.node.nodeid)
    assert module_setup.get_proceed_to_module_setup().is_displayed()
    module_setup.click_proceed_to_module_setup()
    assert module_setup.get_module_setup_text_locator().text == "Module Setup"
    assert module_setup.get_thermocycler_module().text == "Thermocycler Module"
    assert module_setup.get_magnetic_module().text == "Magnetic Module GEN1"
    assert module_setup.get_temperature_module().text == "Temperature Module GEN1"
    assert module_setup.get_proceed_to_labware_setup().is_displayed()
    module_setup.click_proceed_to_labware_setup()
    labware_setup = LabwareSetup(driver, console, request.node.nodeid)
    assert labware_setup.get_labware_setup_text().is_displayed()
    labware_setup.click_proceed_to_run_button()
    device_landing.click_start_run_button()
    assert device_landing.get_run_button().is_displayed()
    assert device_landing.get_success_banner_run_page().is_displayed()

    # Uncurrent the run from the robot
    assert protocol_landing.get_close_button_uncurrent_run().is_displayed()
    protocol_landing.click_close_button_uncurrent_run()
