"""Devices list to robot detail navigation."""

from __future__ import annotations

from playwright.sync_api import Page

from automation.helpers.test_progress import log_done, log_step
from pages.devices_page import DevicesPage


def test_robot_detail_from_devices_list(run_local_app: Page, robot_name: str) -> None:
    """Navigate from Devices landing to the configured robot detail page."""
    log_step(f"Open Devices and select robot '{robot_name}'")
    DevicesPage(run_local_app, robot_name=robot_name).navigate()
    log_done(f"Robot detail page loaded ({robot_name})")
