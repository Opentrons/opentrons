"""Test the Labware Landing of the page."""
from pathlib import Path
from typing import Dict, List

import pytest
from automation.driver.drag_drop import drag_and_drop_file
from automation.menus.left_menu import LeftMenu
from automation.pages.labware_landing import LabwareLanding
from automation.resources.robot_data import RobotDataType
from rich.console import Console
from selenium.webdriver.chrome.webdriver import WebDriver


@pytest.mark.skip("Need to fix.")
def test_labware_landing(
    driver: WebDriver,
    console: Console,
    test_labwares: Dict[str, Path],
    robots: List[RobotDataType],
    request: pytest.FixtureRequest,
) -> None:
    """Validate some of the functionality of the labware page."""
    # Instantiate the page object for the App settings.
    labware_landing: LabwareLanding = LabwareLanding(driver, console, request.node.nodeid)
    left_menu: LeftMenu = LeftMenu(driver, console, request.node.nodeid)

    # Labware Landing Page
    left_menu.navigate("labware")
    assert labware_landing.get_labware_header().text == "Labware"
    assert labware_landing.get_labware_image().is_displayed()
    assert labware_landing.get_labware_name().is_displayed()
    assert labware_landing.get_api_name().is_displayed()
    assert labware_landing.get_import_button().is_displayed()

    assert labware_landing.get_open_labware_creator().get_attribute("href") == "https://labware.opentrons.com/create/"

    labware_landing.click_import_button()
    assert labware_landing.get_import_custom_labware_definition_header().is_displayed()
    assert labware_landing.get_choose_file_button().is_displayed()
    console.print(
        f"uploading labware: {test_labwares['validlabware'].resolve()}",
        style="white on blue",
    )
    drag_and_drop_file(labware_landing.get_drag_drop_file_button(), test_labwares["validlabware"])
    toast = labware_landing.get_success_toast_message()
    if toast:
        assert toast.is_displayed()
    else:
        labware_landing.base.take_screenshot("Labware upload success toast?")
        raise AssertionError("No labware upload success toast.")

    # uploading an invalid labware and verifying the error toast

    labware_landing.click_import_button()
    assert labware_landing.get_import_custom_labware_definition_header().is_displayed()
    assert labware_landing.get_choose_file_button().is_displayed()
    console.print(
        f"uploading labware: {test_labwares['invalidlabware'].resolve()}",
        style="white on blue",
    )
    drag_and_drop_file(labware_landing.get_drag_drop_file_button(), test_labwares["invalidlabware"])
    assert labware_landing.get_error_toast_message().is_displayed()

    # uploading a duplicate labware and verifying the duplicate error toast

    labware_landing.click_import_button()
    assert labware_landing.get_import_custom_labware_definition_header().is_displayed()
    assert labware_landing.get_choose_file_button().is_displayed()
    console.print(
        f"uploading labware: {test_labwares['validlabware'].resolve()}",
        style="white on blue",
    )
    drag_and_drop_file(labware_landing.get_drag_drop_file_button(), test_labwares["validlabware"])
    toast = labware_landing.get_duplicate_error_toast_message()
    if toast:
        assert toast.is_displayed()
    else:
        labware_landing.base.take_screenshot("Labware upload duplicate toast?")
        raise AssertionError("No labware upload duplicate toast.")
