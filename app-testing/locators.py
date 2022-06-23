"""Interactively test locators in the app.

pipenv run python -i locators.py
This launches the installed app.
"""
import os
import importlib
import rich
from dotenv import find_dotenv, load_dotenv
from rich.console import Console
from rich import inspect, pretty, traceback
from rich.table import Table
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By

import src.driver.base
import src.resources.robot_data
import src.resources.ot_robot5dot1
import src.menus.left_menu_v5dot1
import src.pages.device_landing
import src.pages.app_settings

from conftest import _chrome_options

# to make printing pretty
console = Console()
pretty.install(console=console)
traceback.install(console=console)


def reimport() -> None:
    """Reimport so that changes in teh files show up."""
    # tools
    importlib.reload(src.driver.base)
    importlib.reload(src.resources.ot_robot5dot1)
    importlib.reload(src.resources.robot_data)
    # page objects
    importlib.reload(src.menus.left_menu_v5dot1)
    importlib.reload(src.pages.device_landing)
    importlib.reload(src.pages.app_settings)


# variables
base = None
kansas = None
dev = None
emulated_alpha = None
device_landing = None
app_settings = None
left_menu5dot1 = None
variables = [
    "base",
    "kansas",
    "dev",
    "emulated_alpha",
    "device_landing",
    "left_menu5dot1",
    "app_settings",
]


def instantiate(driver, console) -> None:
    """Tie the imported or reimported packages to variables."""
    global base
    base = src.driver.base.Base(driver, console, "REPL")
    global kansas
    kansas = src.resources.ot_robot5dot1.OtRobot(
        console, src.resources.robot_data.Kansas()
    )
    global dev
    dev = src.resources.ot_robot5dot1.OtRobot(console, src.resources.robot_data.Dev())
    global emulated_alpha
    dev = src.resources.ot_robot5dot1.OtRobot(
        console, src.resources.robot_data.EmulatedAlpha()
    )
    global device_landing
    device_landing = src.pages.device_landing.DeviceLanding(driver, console, "REPL")
    global left_menu5dot1
    left_menu5dot1 = src.menus.left_menu_v5dot1.LeftMenu(driver, console, "REPL")
    global app_settings
    app_settings = src.pages.app_settings.AppSettings(driver, console, "REPL")


# Check to see if we have a dotenv file and use it
if find_dotenv():
    load_dotenv(find_dotenv())
# use env variable to prevent the analytics pop up
os.environ["OT_APP_ANALYTICS__SEEN_OPT_IN"] = "true"
# app should look on localhost for robots
os.environ["OT_APP_DISCOVERY__CANDIDATES"] = "localhost"
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
console.print(table)


def reload() -> None:
    """Run when you update a file."""
    reimport()
    instantiate(driver, console)
    console.print(table)


def clean_exit() -> None:
    """Run to exit chromedriver and the REPL cleanly.

    If you do not use this method orphan chromedriver and app instances might be left open
    pkill -x chromedriver
    If you do forget to use it."""
    # Close the app/chromedriver
    driver.quit()
    # Exit the REPL
    exit()
