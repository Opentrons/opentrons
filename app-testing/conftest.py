"""Pytest setup."""
import os
from typing import Generator, List, Optional

import pytest
from automation.menus.left_menu import LeftMenu
from automation.pages.app_settings import AppSettings
from automation.resources.robot_data import ROBOT_MAPPING, RobotDataType
from dotenv import find_dotenv, load_dotenv
from rich import pretty, traceback
from rich.console import Console
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.webdriver import WebDriver

collect_ignore_glob = ["files/**/*.py"]

_console = Console(color_system="auto")
pretty.install(console=_console)
traceback.install(console=_console)


# My setting overrides to false we give preference to System Environment Variables
# This is important for CI
if find_dotenv():
    load_dotenv(find_dotenv(), override=False)
elif find_dotenv(filename="example.env"): # example.env has our defaults
    load_dotenv(find_dotenv(filename="example.env"), override=False)
else:
    raise AssertionError("No .env or example.env file found.")



def pytest_collection_modifyitems(items):  # type: ignore # noqa: ANN201,ANN001
    """Order tests."""
    # When running all tests calibrate the robot first.
    # Most other tests require this.
    MODULE_ORDER = ["tests.calibrate_test"]
    module_mapping = {item: item.module.__name__ for item in items}
    sorted_items = items.copy()
    # Iteratively move tests of each module to the end of the test queue
    for module in MODULE_ORDER:
        sorted_items = [it for it in sorted_items if module_mapping[it] == module] + [
            it for it in sorted_items if module_mapping[it] != module
        ]
    items[:] = sorted_items


def _chrome_options() -> Options:
    """Chrome options for setup."""
    options = Options()
    executable_path = os.getenv("EXECUTABLE_PATH")
    assert executable_path is not None, "EXECUTABLE_PATH environment variable must be set"
    _console.print(f"EXECUTABLE_PATH is {executable_path}", style="white on blue")
    options.binary_location = executable_path
    options.add_argument("whitelisted-ips=''")  # type: ignore
    options.add_argument("disable-xss-auditor")  # type: ignore
    options.add_argument("disable-web-security")  # type: ignore
    options.add_argument("allow-running-insecure-content")  # type: ignore
    options.add_argument("no-sandbox")  # type: ignore
    options.add_argument("disable-setuid-sandbox")  # type: ignore
    options.add_argument("disable-popup-blocking")  # type: ignore
    options.add_argument("allow-elevated-browser")  # type: ignore
    return options


def add_localhost(driver: WebDriver, request: pytest.FixtureRequest) -> None:
    """Add localhost using the app UI."""
    # This was necessary because
    # os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost" was broken
    # now preserving in case we want to use in the future
    # how to call this method
    # use .env to set LOCALHOST
    # localhost: Optional[str] = os.getenv("LOCALHOST")
    # if localhost:
    #     if localhost.lower() == "true":
    #         add_localhost(driver=driver, request=request)
    app_settings: AppSettings = AppSettings(driver, _console, request.node.nodeid)
    left_menu: LeftMenu = LeftMenu(driver, _console, request.node.nodeid)
    left_menu.navigate("app-settings")
    assert app_settings.get_app_settings_header().text == "App Settings"
    assert app_settings.get_connect_robot_via_IP_header().is_displayed()
    assert app_settings.get_connect_to_robot_via_IP_address_button().is_displayed()
    app_settings.click_connect_to_robot_via_IP_address_button()
    assert app_settings.get_textbox_to_enter_the_ip().is_displayed()
    app_settings.click_add_ip_or_hostname()
    app_settings.enter_hostname("localhost")
    assert app_settings.get_add_button().is_displayed()
    app_settings.click_add_button()
    assert app_settings.get_done_button().is_displayed()
    app_settings.click_done_button()


@pytest.fixture(scope="session")
def driver(request: pytest.FixtureRequest) -> Generator[WebDriver, None, None]:
    """Pass standard Chrome options to a test."""
    update_channel = os.getenv("UPDATE_CHANNEL")
    assert update_channel is not None, "UPDATE_CHANNEL environment variable must be set"
    options = _chrome_options()
    os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
    os.environ["OT_APP_ANALYTICS__OPTED_IN"] = "true"
    os.environ["OT_APP_ANALYTICS__APP_ID"] = "6dcc8733-c3e6-4ac4-b14f-638ede114ac5"
    os.environ["OT_APP_ANALYTICS__USER_ID"] = "b806c211-3b21-4c5e-8b06-aedc58887cce"
    os.environ["OT_APP_UPDATE__CHANNEL"] = update_channel
    os.environ["OT_APP_LOG__LEVEL__CONSOLE"] = "error"
    os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"  # fixed in 6.2
    with webdriver.Chrome(options=options) as driver:
        _console.print("Driver Capabilities.", style="bright_yellow on blue")
        _console.print(driver.capabilities)
        localhost: Optional[str] = os.getenv("LOCALHOST")
        if localhost:
            if localhost.lower() == "true":
                add_localhost(driver=driver, request=request)
        yield driver


@pytest.fixture(scope="session")
def console() -> Console:
    """Rich console for output."""
    return _console


@pytest.fixture(scope="session")
def robots() -> List[RobotDataType]:
    """Robot data."""
    # provide all robot data to the tests
    robots = ["dev", "kansas", "emulated_alpha"]
    result = []
    for robot in robots:
        robot_type = ROBOT_MAPPING[robot]
        result.append(robot_type)
    return result
