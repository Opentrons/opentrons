"""Interactively test locators in the app.

pipenv run python -i locators.py
This launches the installed app.
"""
import rich
from dotenv import find_dotenv, load_dotenv
from rich.console import Console
from rich import pretty, traceback
from selenium.webdriver.chrome.webdriver import WebDriver
from selenium.webdriver.common.by import By

from conftest import _chrome_options
from src.driver.base import Base, Element
from src.driver.drag_drop import drag_and_drop_file
from src.menus.left_menu import LeftMenu
from src.menus.more_menu import MenuItems, MoreMenu
from src.menus.protocol_file import ProtocolFile
from src.menus.robots_list import RobotsList
from src.pages.deck_calibrate import DeckCalibration
from src.pages.gen1_pipette_pur import Gen1PipettePur
from src.pages.labware_setup import LabwareSetup
from src.pages.moam_pur import MoamPur
from src.pages.module_setup import ModuleSetup
from src.pages.overview import Overview
from src.pages.protocol_upload import ProtocolUpload
from src.pages.robot_calibration import RobotCalibration
from src.pages.robot_page import RobotPage
from src.resources.ot_application import OtApplication
from src.resources.ot_robot import OtRobot

console = Console()
pretty.install(console=console)
traceback.install(console=console)
# Check to see if we have a dotenv file and use it
if find_dotenv():
    load_dotenv(find_dotenv())
driver: WebDriver = WebDriver(options=_chrome_options())
base = Base(driver, console, "REPL")
element: Element = Element(
    (By.XPATH, "//button"), "The first button element on the DOM"
)
found = base.clickable_wrapper(element, 5, False)
