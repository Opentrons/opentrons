"""Device card regression tests for the robot Devices detail page."""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_SCRIPTS_DIR = _PROJECT_ROOT.parent / "scripts"
for _path in (_PROJECT_ROOT, _SCRIPTS_DIR):
    if str(_path) not in sys.path:
        sys.path.insert(0, str(_path))

import os

import pytest
from playwright.sync_api import Page

from App_layout.app_structure.Device_card_helper import DeviceCardHelper
from App_layout.app_structure.devices_page import DevicesPage

ROBOT_NAME = os.environ.get("ROBOT_NAME", "QA1Potato")
THERMOCYCLER_PREFIX = os.environ.get("THERMOCYCLER_PREFIX", "TC2")
HEATER_SHAKER_PREFIX = os.environ.get("HEATER_SHAKER_PREFIX", "HSV0")
TEMPERATURE_MODULE_PREFIX = os.environ.get("TEMPERATURE_MODULE_PREFIX", "TD2")


class DevicesCardTest:
    """Imperative runner used by main_script.py."""

    def __init__(self, page: Page, *, robot_name: str = ROBOT_NAME):
        self.page = page
        self.devices = DevicesPage(page, robot_name=robot_name)
        self.cards = DeviceCardHelper(page)

    def test_all(
        self,
        *,
        thermocycler_prefix: str = THERMOCYCLER_PREFIX,
        heater_shaker_prefix: str = HEATER_SHAKER_PREFIX,
        temperature_module_prefix: str = TEMPERATURE_MODULE_PREFIX,
    ) -> None:
        self.devices.navigate()
        self.cards.exercise_all(
            thermocycler_prefix=thermocycler_prefix,
            heater_shaker_prefix=heater_shaker_prefix,
            temperature_module_prefix=temperature_module_prefix,
        )


@pytest.mark.usefixtures("on_robot_devices_page")
class TestDeviceCards:
    """Pytest suite — one test per card; skips when hardware is not attached."""

    def test_left_pipette_card(self, device_cards: DeviceCardHelper) -> None:
        if not device_cards.has_instrument_card("left Mount"):
            pytest.skip("Left pipette card not found or disabled.")
        device_cards.exercise_pipette_card(mount="left")

    def test_right_pipette_card(self, device_cards: DeviceCardHelper) -> None:
        if not device_cards.has_instrument_card("right Mount"):
            pytest.skip("Right pipette card not found or disabled.")
        device_cards.exercise_pipette_card(mount="right")

    def test_gripper_card(self, device_cards: DeviceCardHelper) -> None:
        if not device_cards.has_instrument_card("extension mount"):
            pytest.skip("Gripper card not found or disabled.")
        device_cards.exercise_gripper_card()

    def test_thermocycler_module_card(self, device_cards: DeviceCardHelper) -> None:
        if not device_cards.has_module_card(THERMOCYCLER_PREFIX):
            pytest.skip(
                f"Thermocycler card with prefix '{THERMOCYCLER_PREFIX}' not found or disabled."
            )
        device_cards.exercise_thermocycler_card(prefix=THERMOCYCLER_PREFIX)

    def test_heater_shaker_module_card(self, device_cards: DeviceCardHelper) -> None:
        if not device_cards.has_module_card(HEATER_SHAKER_PREFIX):
            pytest.skip(
                f"Heater-Shaker card with prefix '{HEATER_SHAKER_PREFIX}' not found or disabled."
            )
        device_cards.exercise_heater_shaker_card(prefix=HEATER_SHAKER_PREFIX)

    def test_temperature_module_card(self, device_cards: DeviceCardHelper) -> None:
        if not device_cards.has_module_card(TEMPERATURE_MODULE_PREFIX):
            pytest.skip(
                f"Temperature module card with prefix '{TEMPERATURE_MODULE_PREFIX}' "
                "not found or disabled."
            )
        device_cards.exercise_temperature_module_card(prefix=TEMPERATURE_MODULE_PREFIX)

    def test_robot_lights(self, device_cards: DeviceCardHelper) -> None:
        device_cards.exercise_lights()


if __name__ == "__main__":
    import Open_app
    from setup_usb_or_wifi import connect_robot

    connect_robot()
    Open_app.init()
    DevicesCardTest(Open_app.page).test_all()
