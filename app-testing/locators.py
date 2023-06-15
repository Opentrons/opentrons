"""Interactively test locators in the app.

pipenv run python -i locators.py
This launches the installed app.
"""
import importlib
import os

import automation.driver.base
import automation.menus.left_menu
import automation.pages.app_settings
import automation.pages.device_landing
import automation.pages.labware_landing
import automation.pages.labware_position_check
import automation.pages.protocol_landing
import automation.resources.ot_robot
import automation.resources.robot_data
from conftest import _chrome_options
from dotenv import find_dotenv, load_dotenv
from rich import pretty, traceback
from rich.console import Console
from rich.table import Table
from selenium.webdriver.chrome.webdriver import WebDriver

# to make printing pretty
console = Console()
pretty.install(console=console)
traceback.install(console=console)


def reimport() -> None:
    """Reimport so that changes in teh files show up."""
    # tools
    importlib.reload(automation.driver.base)
    # page objects
    importlib.reload(automation.menus.left_menu)
    importlib.reload(automation.pages.device_landing)
    importlib.reload(automation.pages.app_settings)
    importlib.reload(automation.pages.protocol_landing)
    importlib.reload(automation.pages.labware_position_check)


# variables
base = None
device_landing = None
app_settings = None
left_menu = None
protocol_landing = None
labware_landing = None
labware_position_check = None
# These variables should reflect the variables used in tests so steps may ba copy pasta.
variables = [
    "base",
    "device_landing",
    "left_menu",
    "app_settings",
    "protocol_landing",
    "labware_landing",
    "labware_position_check",
]


def instantiate(driver: WebDriver, console: Console) -> None:
    """Tie the imported or reimported packages to variables."""
    global base
    base = automation.driver.base.Base(driver, console, "REPL")
    global device_landing
    device_landing = automation.pages.device_landing.DeviceLanding(driver, console, "REPL")
    global left_menu
    left_menu = automation.menus.left_menu.LeftMenu(driver, console, "REPL")
    global app_settings
    app_settings = automation.pages.app_settings.AppSettings(driver, console, "REPL")
    global protocol_landing
    protocol_landing = automation.pages.protocol_landing.ProtocolLanding(driver, console, "REPL")
    global labware_landing
    labware_landing = automation.pages.labware_landing.LabwareLanding(driver, console, "REPL")
    global labware_position_check
    labware_position_check = automation.pages.labware_position_check.LabwarePositionCheck(driver, console, "REPL")


# Check to see if we have a dotenv file and use it
if find_dotenv():
    load_dotenv(find_dotenv())
# use env variable to prevent the analytics pop up
os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
# app should look on localhost for robots
os.environ["OT_APP_DISCOVERY__CANDIDATES"] = '["localhost"]'
# dev tools open at start
os.environ["OT_APP_DEVTOOLS"] = "true"
driver: WebDriver = WebDriver(options=_chrome_options())

# instantiate the variables for easy use of our
# page objects and resources in the REPL
instantiate(driver, console)


# print the list ov variables in a table
table = Table(title="Instantiated Holders")
table.add_column("variable name", justify="left", style="cyan", no_wrap=True)
for h in variables:
    table.add_row(h)
console.print(table, style="white on blue")


def reload() -> None:
    """Run when you update a file."""
    reimport()
    instantiate(driver, console)
    console.print(table, style="white on blue")


def clean_exit() -> None:
    """Run to exit chromedriver and the REPL cleanly.

    If you do not use this method orphan chromedriver and app instances might be left open
    pkill -x chromedriver
    If you do forget to use it.
    """
    # Close the app/chromedriver
    driver.quit()
    # Exit the REPL
    exit()
