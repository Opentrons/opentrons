"""Pipette, gripper, module, and lights cards on the robot detail page."""

from __future__ import annotations

import os

import pytest

from pages.device_cards_page import DeviceCardHelper

THERMOCYCLER_PREFIX = os.environ.get("THERMOCYCLER_PREFIX", "TC2")
HEATER_SHAKER_PREFIX = os.environ.get("HEATER_SHAKER_PREFIX", "HSV0")
TEMPERATURE_MODULE_PREFIX = os.environ.get("TEMPERATURE_MODULE_PREFIX", "TD2")


def test_left_pipette_card(device_cards: DeviceCardHelper) -> None:
    if not device_cards.has_instrument_card("left Mount"):
        pytest.skip("Left pipette card not found or disabled.")
    device_cards.exercise_pipette_card(mount="left")


def test_right_pipette_card(device_cards: DeviceCardHelper) -> None:
    if not device_cards.has_instrument_card("right Mount"):
        pytest.skip("Right pipette card not found or disabled.")
    device_cards.exercise_pipette_card(mount="right")


def test_gripper_card(device_cards: DeviceCardHelper) -> None:
    if not device_cards.has_instrument_card("extension mount"):
        pytest.skip("Gripper card not found or disabled.")
    device_cards.exercise_gripper_card()


def test_thermocycler_module_card(device_cards: DeviceCardHelper) -> None:
    if not device_cards.has_module_card(THERMOCYCLER_PREFIX):
        pytest.skip(
            f"Thermocycler card with prefix '{THERMOCYCLER_PREFIX}' not found or disabled."
        )
    device_cards.exercise_thermocycler_card(prefix=THERMOCYCLER_PREFIX)


def test_heater_shaker_module_card(device_cards: DeviceCardHelper) -> None:
    if not device_cards.has_module_card(HEATER_SHAKER_PREFIX):
        pytest.skip(
            f"Heater-Shaker card with prefix '{HEATER_SHAKER_PREFIX}' not found or disabled."
        )
    device_cards.exercise_heater_shaker_card(prefix=HEATER_SHAKER_PREFIX)


def test_temperature_module_card(device_cards: DeviceCardHelper) -> None:
    if not device_cards.has_module_card(TEMPERATURE_MODULE_PREFIX):
        pytest.skip(
            f"Temperature module card with prefix '{TEMPERATURE_MODULE_PREFIX}' "
            "not found or disabled."
        )
    device_cards.exercise_temperature_module_card(prefix=TEMPERATURE_MODULE_PREFIX)


def test_robot_lights(device_cards: DeviceCardHelper) -> None:
    device_cards.exercise_lights()
