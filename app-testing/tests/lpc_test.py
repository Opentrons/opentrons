"""todo these tests for refactoring"""
# flake8: noqa
import time
from pathlib import Path
from typing import Dict, List

import pytest
from pytest import FixtureRequest
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver

from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
from automation.pages.labware_position_check import LabwarePositionCheck
from automation.pages.labware_setup import LabwareSetup
from automation.pages.protocol_landing import ProtocolLanding
from automation.resources.ot_robot import OtRobot
from automation.resources.robot_data import Dev, RobotDataType


@pytest.mark.skip("Need to fix.")
def test_LPC_flow(
    driver: WebDriver,
    console: Console,
    test_protocols: Dict[str, Path],
    robots: List[RobotDataType],
    request: FixtureRequest,
) -> None:
    """Upload a protocol."""
    # this test is against only the dev robot
    robot = next(robot for robot in robots if robot.display_name == Dev.display_name)
    ot_robot = OtRobot(console, robot)
    console.print(f"Testing against robot {ot_robot.data.display_name}", style="white on blue")
    assert ot_robot.is_alive(), "is the robot available?"

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
    time.sleep(5)  # todo need dynamic wait here

    protocol_landing.click_overflow_menu()
    protocol_landing.click_run_on_protocol_landing()
    protocol_landing.click_proceed_to_setup_on_protocol_detail()
    time.sleep(8)  # todo need dynamic wait here
    labware_setup: LabwareSetup = LabwareSetup(driver, console, request.node.nodeid)
    labware_setup.click_labware_setup_text()

    labware_position_check: LabwarePositionCheck = LabwarePositionCheck(driver, console, request.node.nodeid)

    if labware_position_check.get_ignored_stored_data():
        labware_position_check.click_ignored_stored_data()

    labware_position_check.click_labware_position_button()
    assert labware_position_check.get_introScreen_labware_position_check_overview().is_displayed()
    labware_position_check.click_begin_labware_position_check_button()
    assert labware_position_check.get_how_to_tell_pipette_is_centered_link().is_displayed()
    labware_position_check.click_how_to_tell_pipette_is_centered_link()
    labware_setup.click_close_button()
    labware_position_check.click_reveal_all_jog_controls()
    labware_position_check.click_back_jog_button()
    labware_position_check.click_down_jog_button()
    labware_position_check.click_right_jog_button()
    labware_position_check.click_forward_jog_button()
    labware_position_check.click_confirm_position_button_pickup_tip()
    labware_position_check.click_confirm_position_moveto_slot_5()
    assert labware_position_check.get_how_to_tell_pipette_is_centered_link().is_displayed()
    labware_position_check.click_reveal_all_jog_controls()
    labware_position_check.click_back_jog_button()
    labware_position_check.click_down_jog_button()
    labware_position_check.click_right_jog_button()
    labware_position_check.click_forward_jog_button()
    labware_position_check.click_confirm_position_moveto_slot_6()
    assert labware_position_check.get_how_to_tell_pipette_is_centered_link().is_displayed()
    labware_position_check.click_reveal_all_jog_controls()
    labware_position_check.click_back_jog_button()
    labware_position_check.click_down_jog_button()
    labware_position_check.click_right_jog_button()
    labware_position_check.click_forward_jog_button()
    labware_position_check.click_confirm_position_returntip_slot_home()
    assert labware_position_check.get_labware_position_check_complete().is_displayed()
    assert labware_position_check.get_deckmap_labware_check_complete().is_displayed()
    assert labware_position_check.get_section_list_step0().is_displayed()
    assert labware_position_check.get_section_list_step1().is_displayed()
    assert labware_position_check.get_section_list_step2().is_displayed()
    assert labware_position_check.get_close_and_apply_labware_offset_data_button().is_displayed()
    labware_position_check.click_get_close_and_apply_labware_offset_data_button()
    # assert labware_position_check.get_labware_success_toast().is_displayed()
    assert labware_position_check.get_labware_display_name_slot_4().text == "Opentrons 96 Tip Rack 300 µL"
    assert labware_position_check.get_labware_offsetbox_slot_4().is_displayed()
    assert labware_position_check.get_labware_slot_4_offset_x_text().is_displayed()
    assert labware_position_check.get_labware_slot_4_offset_x_value().text == "0.1"
    assert labware_position_check.get_labware_slot_4_offset_y_text().is_displayed()
    assert labware_position_check.get_labware_slot_4_offset_y_value().text == "0.0"
    assert labware_position_check.get_labware_slot_4_offset_z_text().is_displayed()
    assert labware_position_check.get_labware_slot_4_offset_z_value().text == "-0.1"
    assert labware_position_check.get_labware_display_name_slot_5().text == "A1"
    assert labware_position_check.get_labware_slot_5_offset_x_text().is_displayed()
    assert labware_position_check.get_labware_slot_5_offset_x_value().text == "0.1"
    assert labware_position_check.get_labware_slot_5_offset_y_text().is_displayed()
    assert labware_position_check.get_labware_slot_5_offset_y_value().text == "0.0"
    assert labware_position_check.get_labware_slot_5_offset_z_text().is_displayed()
    assert labware_position_check.get_labware_slot_5_offset_z_value().text == "-0.1"
    assert labware_position_check.get_labware_display_name_slot_2().text == "Opentrons 96 Tip Rack 10 µL"
    assert labware_position_check.get_labware_slot_2_offset_x_text().is_displayed()
    assert labware_position_check.get_labware_slot_2_offset_x_value().text == "0.1"
    assert labware_position_check.get_labware_slot_2_offset_y_text().is_displayed()
    assert labware_position_check.get_labware_slot_2_offset_y_value().text == "0.0"
    assert labware_position_check.get_labware_slot_2_offset_z_text().is_displayed()
    assert labware_position_check.get_labware_slot_2_offset_z_value().text == "-0.1"
