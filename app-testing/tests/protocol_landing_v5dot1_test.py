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
from src.menus.left_menu_v5dot1 import LeftMenu
from src.resources.robot_data import Dev, Kansas, RobotDataType
from src.menus.protocol_file import ProtocolFile
from src.driver.drag_drop import drag_and_drop_file

style = Style(color="#ac0505", bgcolor="yellow", bold=True)
logger = logging.getLogger(__name__)

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
        protocol_file = ProtocolFile(driver)
        logger.info(
            f"uploading protocol: {test_protocols['protocoluploadjson'].resolve()}"
        )
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_protocols["protocoluploadjson"])
        time.sleep(3)  # waiting for protocol to analyze
        protocol_landing: ProtocolLanding = ProtocolLanding(
            driver, console, request.node.nodeid
        )
        left_menu.click_devices_button()
        for robot in robots:
            ot_robot = OtRobot(console, robot)
            console.print(
                f"Testing against robot {ot_robot.data.display_name}", style=style
            )
            assert ot_robot.is_alive(), "is the robot available?"
            