"""Test the initial state the application with various setups."""
import time
from typing import List

import pytest
from automation.menus.left_menu import LeftMenu
from automation.pages.deck_calibrate import DeckCalibration
from automation.pages.device_landing import DeviceLanding
from automation.resources.ot_robot import OtRobot
from automation.resources.robot_data import EmulatedAlpha, RobotDataType
from pytest import FixtureRequest
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver


@pytest.mark.skip("Need to fix.")
def test_deck_calibrate(
    driver: WebDriver,
    console: Console,
    robots: List[RobotDataType],
    request: FixtureRequest,
) -> None:
    """Deck Calibrate."""
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    device_landing: DeviceLanding = DeviceLanding(driver, console, request.node.nodeid)
    left_menu.navigate("devices")
    # this test is against only the EmulatedAlpha robot
    robot = next(robot for robot in robots if robot.name == EmulatedAlpha.name)
    ot_robot = OtRobot(console, robot)
    console.print(f"Testing against robot {ot_robot.data.display_name}", style="white on blue")
    assert ot_robot.is_alive(), "is the robot available?"

    # calibrate

    device_landing.click_overflow_menu_button_on_device_landing(ot_robot.data.display_name)
    device_landing.click_overflow_robot_settings(ot_robot.data.display_name)

    # Now we are on Robot Settings > calibration tab
    calibrate = DeckCalibration(driver, console, request.node.nodeid)

    if not device_landing.is_deck_calibrated():
        console.print("Calibrating deck.", style="bold blue")
        # open calibration again
        device_landing.open_calibration()
        calibrate.calibrate_deck()
    else:
        console.print("Deck is calibrated.", style="bold blue")


def calibrate_pipette(device_landing: DeviceLanding) -> None:
    """Do the steps of calibration for a pipette."""
    device_landing.click_continue_with_calibration_block()
    device_landing.click_start_tip_length()
    device_landing.click_confirm_placement()
    device_landing.click_down()
    device_landing.click_down()
    device_landing.click_down()
    device_landing.click_save_nozzle_z()
    device_landing.click_back()
    device_landing.click_back()
    device_landing.click_pickup_tip()
    device_landing.click_yes_move_to_measure()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.click_save_the_tip_length()
    device_landing.click_continue_to_pipette_offset()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.shift_down_arrow_key()
    device_landing.click_save_calibration_move_to_slot_1()
    device_landing.up_arrow_key()
    device_landing.up_arrow_key()
    device_landing.click_save_calibration()
    device_landing.click_return_tip_exit()


def test_calibrate_pipettes(
    driver: WebDriver,
    console: Console,
    robots: List[RobotDataType],
    request: FixtureRequest,
) -> None:
    """Deck Calibrate the dev robot."""
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
    device_landing: DeviceLanding = DeviceLanding(driver, console, request.node.nodeid)

    # this test is against only the EmulatedAlpha robot
    robot = next(robot for robot in robots if robot.name == EmulatedAlpha.name)
    ot_robot: OtRobot = OtRobot(console, robot)
    console.print(f"Testing against robot {ot_robot.data.display_name}", style="white on blue")
    assert ot_robot.is_alive(), "is the robot available?"

    assert ot_robot.deck_calibrated() is True, "Stopping test, deck must be calibrated to calibrate pipettes."

    # calibrate the left pipette
    # devices > robot detail

    left_menu.navigate("devices")
    device_landing.click_robot_banner(ot_robot.data.display_name)
    # click calibrate now banner
    # left should be the first in the DOM tried to be exact with locators but had issues on Windows.
    device_landing.click_calibrate_now()
    calibrate_pipette(device_landing)

    # done calibrating left pipette now do right
    # devices > robot detail
    time.sleep(6)  # when spinner up, click will error # todo wait for spinner gone
    left_menu.navigate("devices")  # when spinner up, click will error
    device_landing.click_robot_banner(ot_robot.data.display_name)
    device_landing.click_calibrate_now()
    calibrate_pipette(device_landing)

    time.sleep(6)  # when spinner up, click will error # todo wait for spinner gone
    left_menu.navigate("devices")
    device_landing.click_overflow_menu_button_on_device_landing(ot_robot.data.display_name)
    device_landing.click_overflow_robot_settings(ot_robot.data.display_name)
    # Now we are on Robot Settings > calibration tab
    banner = device_landing.invisible_pipette_offset_missing_banner_safely()
    # This is the last calibration to run so the banner should go away
    # pipettes and tip lengths for both
    assert banner is None
    assert ot_robot.pipettes_calibrated()
    assert ot_robot.tip_length_calibrated()


def test_all_calibrated_api(
    console: Console,
    robots: List[RobotDataType],
) -> None:
    """Test that all calibrations are valid at API level."""
    # this test is against only the EmulatedAlpha robot
    robot = next(robot for robot in robots if robot.name == EmulatedAlpha.name)
    ot_robot: OtRobot = OtRobot(console, robot)
    console.print(f"Testing against robot {ot_robot.data.name}", style="white on blue")
    assert ot_robot.is_alive(), "is the robot available?"
    assert ot_robot.deck_calibrated() is True, "Stopping test, deck must be calibrated to calibrate pipettes."
    assert ot_robot.pipettes_calibrated()
    assert ot_robot.tip_length_calibrated()
