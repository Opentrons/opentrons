"""Pytest fixtures for Opentrons Electron regression tests."""

from __future__ import annotations

import os
from collections.abc import Generator

import bootstrap  # noqa: F401
import pytest
from playwright.sync_api import Page

import Open_app
from App_layout.app_structure.Device_card_helper import DeviceCardHelper
from App_layout.app_structure.devices_page import DevicesPage
from setup_usb_or_wifi import RobotConnection

from check_health import find_opentrons_usb_port

DEFAULT_ROBOT_NAME = os.environ.get("ROBOT_NAME", "QA1Potato")
DEFAULT_THERMOCYCLER_PREFIX = os.environ.get("THERMOCYCLER_PREFIX", "TC2")
DEFAULT_HEATER_SHAKER_PREFIX = os.environ.get("HEATER_SHAKER_PREFIX", "HSV0")
DEFAULT_TEMPERATURE_MODULE_PREFIX = os.environ.get("TEMPERATURE_MODULE_PREFIX", "TD2")


def _connect_robot_for_tests() -> RobotConnection:
    usb_port = find_opentrons_usb_port()
    if usb_port is not None:
        connection = RobotConnection(usb_port=usb_port)
        connection("/health")
        return connection

    ip = os.environ.get("ROBOT_IP")
    if ip:
        connection = RobotConnection(ip=ip.strip())
        connection("/health")
        return connection

    pytest.skip("No robot on USB and ROBOT_IP env var is not set.")


@pytest.fixture(scope="session")
def robot_connection() -> RobotConnection:
    """Connect to the robot over USB or ROBOT_IP before the app opens the port."""
    return _connect_robot_for_tests()


@pytest.fixture(scope="session")
def app_page(robot_connection: RobotConnection) -> Generator[Page, None, None]:
    """Launch Opentrons and attach Playwright to the app window."""
    del robot_connection
    page = Open_app.init()
    yield page


@pytest.fixture(scope="session")
def robot_name() -> str:
    return DEFAULT_ROBOT_NAME


@pytest.fixture(scope="session")
def device_cards(app_page: Page) -> DeviceCardHelper:
    return DeviceCardHelper(app_page)


@pytest.fixture(scope="session")
def on_robot_devices_page(app_page: Page, robot_name: str) -> Generator[None, None, None]:
    """Navigate once to the robot detail view on the Devices page."""
    DevicesPage(app_page, robot_name=robot_name).navigate()
    yield
