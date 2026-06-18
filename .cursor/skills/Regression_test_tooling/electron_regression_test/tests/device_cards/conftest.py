"""Device card tests start on the robot detail page."""

from __future__ import annotations

from collections.abc import Generator

import pytest
from playwright.sync_api import Page

from automation.helpers.app_readiness import dismiss_blocking_ui
from automation.helpers.test_progress import log_banner, log_done, log_step
from pages.device_cards_page import DeviceCardHelper
from pages.devices_page import DevicesPage

pytestmark = pytest.mark.device_cards


def pytest_runtest_logstart(nodeid: str, location: tuple[str, int, str]) -> None:
    log_banner("device_cards", location[2])


@pytest.fixture(scope="session")
def device_cards(run_local_app: Page, robot_name: str) -> Generator[DeviceCardHelper, None, None]:
    """Shared helper: navigate once, cache module inventory for all tests in this session."""
    log_step(f"Navigating to robot detail for '{robot_name}'")
    helper = DeviceCardHelper(run_local_app)
    DevicesPage(run_local_app, robot_name=robot_name).navigate()
    dismiss_blocking_ui(run_local_app)
    log_done(f"On robot detail page ({robot_name})")
    log_step("Wait for module cards to finish loading")
    try:
        helper.wait_for_module_cards()
        log_done("Module cards ready")
    except TimeoutError:
        log_step("No enabled module cards detected — continuing")
    log_step("Read module serial numbers and firmware versions")
    helper.print_module_inventory()
    log_done("Module inventory printed")
    yield helper
