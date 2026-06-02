"""Device card tests start on the robot detail page."""

from __future__ import annotations

from collections.abc import Generator

import pytest
from playwright.sync_api import Page

from pages.devices_page import DevicesPage

pytestmark = pytest.mark.device_cards


@pytest.fixture(scope="session", autouse=True)
def on_robot_devices_page(run_local_app: Page, robot_name: str) -> Generator[None, None, None]:
    DevicesPage(run_local_app, robot_name=robot_name).navigate()
    yield
