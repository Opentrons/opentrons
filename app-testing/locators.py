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
    importlib.reload(automation.resources.ot_robot)
    importlib.reload(automation.resources.robot_data)
    # page objects
    importlib.reload(automation.menus.left_menu)
    importlib.reload(automation.pages.device_landing)
    importlib.reload(automation.pages.app_settings)
    importlib.reload(automation.pages.protocol_landing)
    importlib.reload(automation.pages.labware_position_check)


# variables
base = None
kansas = None
dev = None
emulated_alpha = None
device_landing = None
app_settings = None
left_menu = None
protocol_landing = None
labware_landing = None
labware_position_check = None
# These variables should reflect the variables used in tests so steps may ba copy pasta.
variables = [
    "base",
    "kansas",
    "dev",
    "emulated_alpha",
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
    global kansas
    kansas = automation.resources.ot_robot.OtRobot(console, automation.resources.robot_data.Kansas())
    global dev
    dev = automation.resources.ot_robot.OtRobot(console, automation.resources.robot_data.Dev())
    global emulated_alpha
    emulated_alpha = automation.resources.ot_robot.OtRobot(console, automation.resources.robot_data.EmulatedAlpha())
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
os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
os.environ["OT_APP_ANALYTICS__OPTED_IN"] = "true"
os.environ["OT_APP_ANALYTICS__APP_ID"] = "6dcc8733-c3e6-4ac4-b14f-638ede114ac5"
os.environ["OT_APP_ANALYTICS__USER_ID"] = "b806c211-3b21-4c5e-8b06-aedc58887cce"
os.environ["OT_APP_UPDATE__CHANNEL"] = "alpha"  # latest beta alpha
os.environ["OT_APP_LOG__LEVEL__CONSOLE"] = "error"
os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
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
