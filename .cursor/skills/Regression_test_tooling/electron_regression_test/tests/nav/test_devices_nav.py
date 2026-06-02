"""Devices list to robot detail navigation."""

from __future__ import annotations

from playwright.sync_api import Page

from pages.devices_page import DevicesPage


def test_robot_detail_from_devices_list(run_local_app: Page, robot_name: str) -> None:
    DevicesPage(run_local_app, robot_name=robot_name).navigate()
