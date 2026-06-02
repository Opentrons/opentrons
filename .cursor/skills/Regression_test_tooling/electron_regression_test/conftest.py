"""Pytest fixtures for Opentrons Electron regression tests."""

from __future__ import annotations

import os
import subprocess
from collections.abc import Generator

import bootstrap  # noqa: F401
import pytest
from playwright.sync_api import Browser, Page, Playwright

import Open_app
from automation.helpers.screenshot_helper import ScreenshotHelper
from pages.device_cards_page import DeviceCardHelper
from setup_usb_or_wifi import DEFAULT_ROBOT_IP, RobotConnection

from check_health import find_opentrons_usb_port

DEFAULT_ROBOT_NAME = os.environ.get("ROBOT_NAME", "QA1Potato")
DEFAULT_PROTOCOL_NAME = os.environ.get(
    "PROTOCOL_NAME",
    "Flex Smoke Test - v2.29 - No LLD/meniscus",
)


def _connect_robot_for_tests() -> RobotConnection:
    usb_port = find_opentrons_usb_port()
    if usb_port is not None:
        connection = RobotConnection(usb_port=usb_port)
        connection("/health")
        return connection

    ip = os.environ.get("ROBOT_IP", DEFAULT_ROBOT_IP).strip()
    connection = RobotConnection(ip=ip)
    connection("/health")
    return connection


@pytest.fixture(scope="session")
def robot_connection() -> RobotConnection:
    """Connect to the robot over USB or Wi-Fi before the app opens the port."""
    return _connect_robot_for_tests()


@pytest.fixture(scope="session")
def run_local_app(robot_connection: RobotConnection) -> Generator[Page, None, None]:
    """Launch (or attach to) the Opentrons desktop app and yield the Playwright page."""
    del robot_connection

    process: subprocess.Popen | None = None
    playwright: Playwright | None = None
    browser: Browser | None = None

    if Open_app.should_attach_only():
        playwright, browser, page = Open_app.connect_playwright()
    else:
        process, playwright, browser, page = Open_app.launch_and_connect()

    Open_app.prepare_app_page(page)
    yield page

    if browser is not None:
        try:
            browser.close()
        except Exception:
            pass
    if playwright is not None:
        playwright.stop()
    if process is not None:
        process.terminate()
        try:
            process.wait(timeout=5)
        except Exception:
            process.kill()


@pytest.fixture(scope="session")
def robot_name() -> str:
    return DEFAULT_ROBOT_NAME


@pytest.fixture(scope="session")
def protocol_name() -> str:
    return DEFAULT_PROTOCOL_NAME


@pytest.fixture(scope="session")
def screenshot_helper(run_local_app: Page) -> ScreenshotHelper:
    return ScreenshotHelper(run_local_app)


@pytest.fixture(scope="session")
def device_cards(run_local_app: Page) -> DeviceCardHelper:
    return DeviceCardHelper(run_local_app)


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "smoke: navigation tests under tests/nav/")
    config.addinivalue_line(
        "markers",
        "device_cards: tests under tests/device_cards/ (robot detail hardware UI)",
    )
