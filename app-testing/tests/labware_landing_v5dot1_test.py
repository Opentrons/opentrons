"""Test the Labware Landing of the page."""
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
from src.pages.labware_landing import LabwareLanding
from src.menus.left_menu_v5dot1 import LeftMenu
from src.resources.robot_data import Dev, Kansas, RobotDataType
from src.menus.protocol_file import ProtocolFile
from src.driver.drag_drop import drag_and_drop_file

style = Style(color="#ac0505", bgcolor="yellow", bold=True)
logger = logging.getLogger(__name__)


@pytest.mark.v5dot1
def test_labware_landing_v5dot1(
    chrome_options: Options,
    console: Console,
    test_labwares: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Test the initial load of the app with a docker or dev mode emulated robot."""
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app should look on localhost for robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    # app should use the __DEV__ Hierarchy Reorganization
    os.environ["OT_APP_DEV_INTERNAL__hierarchyReorganization"] = "false"
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

        # Instantiate the page object for the App settings.
        labware_landing: LabwareLanding = LabwareLanding(
            driver, console, request.node.nodeid
        )
        left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)

        # Labware Landing Page
        left_menu.click_labware_button()
        assert left_menu.get_labware_button().is_displayed()
        assert labware_landing.get_labware_header().text == "Labware"
        assert labware_landing.get_labware_image().is_displayed()
        assert labware_landing.get_labware_name().is_displayed()
        assert labware_landing.get_api_name().is_displayed()
        assert labware_landing.get_import_button().is_displayed()

        labware_landing.click_import_button()
        assert (
            labware_landing.get_import_custom_labware_definition_header().is_displayed()
        )
        assert labware_landing.get_choose_file_button().is_displayed()
        protocol_file = ProtocolFile(driver)
        logger.info(f"uploading labware: {test_labwares['validlabware'].resolve()}")
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_labwares["validlabware"])
        assert labware_landing.get_success_toast_message().is_displayed()

        ## uploading an invalid labware
        labware_landing.click_import_button()
        assert (
            labware_landing.get_import_custom_labware_definition_header().is_displayed()
        )
        assert labware_landing.get_choose_file_button().is_displayed()
        protocol_file = ProtocolFile(driver)
        logger.info(f"uploading labware: {test_labwares['invalidlabware'].resolve()}")
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_labwares["invalidlabware"])
        assert labware_landing.get_error_toast_message().is_displayed()

        ## uploading a duplicate labware and verifying the error toast
        labware_landing.click_import_button()
        assert (
            labware_landing.get_import_custom_labware_definition_header().is_displayed()
        )
        assert labware_landing.get_choose_file_button().is_displayed()
        protocol_file = ProtocolFile(driver)
        logger.info(f"uploading labware: {test_labwares['validlabware'].resolve()}")
        input = protocol_file.get_drag_json_protocol()
        drag_and_drop_file(input, test_labwares["validlabware"])
        assert labware_landing.get_dublicate_error_toast_message().is_displayed()
