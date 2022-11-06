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
from src.pages.device_landing import DeviceLanding
from src.resources.robot_data import Dev, Kansas, RobotDataType

style = Style(color="#ac0505", bgcolor="yellow", bold=True)


@pytest.mark.v5dot1
def test_initial_load_robot_available_v5dot1(
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

        for robot in robots:
            ot_robot = OtRobot(console, robot)
            console.print(
                f"Testing against robot {ot_robot.data.display_name}", style=style
            )
            assert ot_robot.is_alive(), "is the robot available?"

            # Is the robot connected?
            device_landing.robot_banner(robot_name=ot_robot.data.display_name)
            device_landing.base.click(
                device_landing.expander(ot_robot.data.display_name)
            )
            assert (
                device_landing.get_pipettes_and_modules_header_text()
                == "Instruments and Modules"
            )
            assert (
                device_landing.get_recent_protocol_runs_header_text()
                == "Recent Protocol Runs"
            )
            assert (
                device_landing.set_lights(True) == True
            ), "Lights toggle was not set to on."

            for serial in [
                module.serial
                for module in ot_robot.modules
                if module.type in ["magneticModuleV2", "magneticModuleV1"]
            ]:

                if not device_landing.mag_engaged():
                    device_landing.click_module_actions_button(serial)
                    device_landing.click_mag_engage_height(serial)
                    device_landing.enter_mag_engage_height(serial, "10")
                    device_landing.close_mag_slideout()
                else:
                    device_landing.click_module_actions_button(serial)
                    device_landing.click_mag_disengage()
            device_landing.navigate("devices")
