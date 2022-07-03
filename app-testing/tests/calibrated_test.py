"""Test the initial state the application with various setups."""
import os
from pathlib import Path
from typing import List

from pytest import FixtureRequest
from rich.console import Console
from rich.style import Style
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from src.menus.left_menu import LeftMenu
from src.pages.deck_calibrate import DeckCalibration
from src.pages.device_landing import DeviceLanding
from src.resources.ot_application import OtApplication
from src.resources.ot_robot import OtRobot
from src.resources.robot_data import Dev, RobotDataType

style = Style(color="#ac0505", bgcolor="yellow", bold=True)


def test_calibrate(
    chrome_options: Options,
    console: Console,
    robots: List[RobotDataType],
    request: FixtureRequest,
) -> None:
    """Deck Calibrate the dev robot."""
    # use variable to prevent the popup
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app can see docker robot
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    with webdriver.Chrome(options=chrome_options) as driver:  # type: ignore
        console.print(f"driver capabilities {driver.capabilities}")
        ot_application = OtApplication(
            Path(f"{driver.capabilities['chrome']['userDataDir']}/config.json")
        )
        console.print(ot_application.config)
        # ignore updates
        ot_application.config["alerts"]["ignored"] = ["appUpdateAvailable"]
        ot_application.write_config()
        left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)
        device_landing: DeviceLanding = DeviceLanding(
            driver, console, request.node.nodeid
        )
        left_menu.click_devices_button()
        # this test is against only the dev robot
        robot = next(
            robot for robot in robots if robot.display_name == Dev.display_name
        )
        ot_robot = OtRobot(console, robot)
        console.print(
            f"Testing against robot {ot_robot.data.display_name}", style=style
        )
        assert ot_robot.is_alive(), "is the robot available?"

        # calibrate

        device_landing.click_overflow_menu_button_on_device_landing(
            ot_robot.data.display_name
        )
        device_landing.click_overflow_robot_settings(ot_robot.data.display_name)
        device_landing.open_calibration()

        calibrate = DeckCalibration(driver, console, request.node.nodeid)

        # test the exit from calibration button
        exit_button = calibrate.get_exit_button_safe()
        if exit_button:
            exit_button.click()
            confirm = calibrate.get_exit_confirm_button()
            if confirm:
                confirm.click()

        if not device_landing.is_deck_calibrated:
            console.print("Calibrating deck.", style="bold blue")
            # open calibration again
            device_landing.open_calibration()
            calibrate.calibrate_deck()
        else:
            console.print("Deck is calibrated.", style="bold blue")
