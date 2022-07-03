"""Test the Labware Landing of the page."""
import os
from pathlib import Path
from typing import Dict, List

import pytest
from rich.console import Console
from rich.style import Style
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from src.driver.drag_drop import drag_and_drop_file
from src.menus.left_menu import LeftMenu
from src.pages.labware_landing import LabwareLanding
from src.resources.ot_application import OtApplication
from src.resources.robot_data import RobotDataType

style = Style(color="#ac0505", bgcolor="yellow", bold=True)


def test_labware_landing(
    chrome_options: Options,
    console: Console,
    test_labwares: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Validate some of the functionality of the labware page."""
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    # app should look on localhost for robots
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
    # Start chromedriver with our options and use the
    # context manager to ensure it quits.
    with webdriver.Chrome(options=chrome_options) as driver:  # type: ignore
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

        assert (
            labware_landing.get_open_labware_creator().get_attribute("href")
            == "https://labware.opentrons.com/create/"
        )

        labware_landing.click_import_button()
        assert (
            labware_landing.get_import_custom_labware_definition_header().is_displayed()
        )
        assert labware_landing.get_choose_file_button().is_displayed()
        console.print(f"uploading labware: {test_labwares['validlabware'].resolve()}")
        drag_and_drop_file(
            labware_landing.get_drag_drop_file_button(), test_labwares["validlabware"]
        )
        assert labware_landing.get_success_toast_message().is_displayed()

        # uploading an invalid labware and verifying the error toast

        labware_landing.click_import_button()
        assert (
            labware_landing.get_import_custom_labware_definition_header().is_displayed()
        )
        assert labware_landing.get_choose_file_button().is_displayed()
        console.print(f"uploading labware: {test_labwares['invalidlabware'].resolve()}")
        drag_and_drop_file(
            labware_landing.get_drag_drop_file_button(), test_labwares["invalidlabware"]
        )
        assert labware_landing.get_error_toast_message().is_displayed()

        # uploading a duplicate labware and verifying the duplicate error toast

        labware_landing.click_import_button()
        assert (
            labware_landing.get_import_custom_labware_definition_header().is_displayed()
        )
        assert labware_landing.get_choose_file_button().is_displayed()
        console.print(f"uploading labware: {test_labwares['validlabware'].resolve()}")
        drag_and_drop_file(
            labware_landing.get_drag_drop_file_button(), test_labwares["validlabware"]
        )
        assert labware_landing.get_duplicate_error_toast_message().is_displayed()
