"""Pipette, gripper, module, and lights cards on the robot detail page.

Runs on the robot detail page after ``test_devices_nav``. Device-card smoke
tests below are separate from the Robot Settings plan (T69745–T69756); none of
those cases are covered here yet.
"""

from __future__ import annotations

import pytest

from automation.app_helpers.test_progress import log_done, log_step
from automation.app_pages import DeviceCardsPage
from automation.app_pages.device_cards_page import HEATER_SHAKER, TEMPERATURE, THERMOCYCLER


def test_left_pipette_card(device_cards: DeviceCardsPage) -> None:
    """Exercise the left or combined left+right pipette card when present.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    if device_cards.has_dual_mount_pipette_card():
        log_step("Check 96-channel pipette card (left+right mounts)")
        log_step("Exercise left+right pipette card controls")
        device_cards.exercise_pipette_card(mount="left+right")
        log_done("Left+right pipette card OK")
        return

    log_step("Check left pipette card")
    if not device_cards.has_instrument_card("left Mount"):
        log_step("Left pipette card not found or disabled — skipping")
        pytest.skip("Left pipette card not found or disabled.")
    log_step("Exercise left pipette card controls")
    device_cards.exercise_pipette_card(mount="left")
    log_done("Left pipette card OK")


def test_right_pipette_card(device_cards: DeviceCardsPage) -> None:
    """Exercise the right pipette card when a separate right mount exists.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    if device_cards.has_dual_mount_pipette_card():
        log_step("96-channel pipette uses a combined left+right card — skipping")
        pytest.skip("96-channel pipette covered by test_left_pipette_card.")

    log_step("Check right pipette card")
    if not device_cards.has_instrument_card("right Mount"):
        log_step("Right pipette card not found or disabled — skipping")
        pytest.skip("Right pipette card not found or disabled.")
    log_step("Exercise right pipette card controls")
    device_cards.exercise_pipette_card(mount="right")
    log_done("Right pipette card OK")


def test_gripper_card(device_cards: DeviceCardsPage) -> None:
    """Exercise the Flex gripper card when the extension mount is present.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    log_step("Check gripper (extension mount) card")
    if not device_cards.has_instrument_card("extension mount"):
        log_step("Gripper card not found or disabled — skipping")
        pytest.skip("Gripper card not found or disabled.")
    log_step("Exercise gripper card controls")
    device_cards.exercise_gripper_card()
    log_done("Gripper card OK")


def test_thermocycler_module_card(device_cards: DeviceCardsPage) -> None:
    """Exercise thermocycler controls when a matching module card is present.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    prefix = DeviceCardsPage.module_prefix(THERMOCYCLER)
    log_step(f"Check thermocycler module card (prefix '{prefix}')")
    if not device_cards.has_module_card(prefix):
        log_step(f"Thermocycler card with prefix '{prefix}' not found or disabled — skipping")
        pytest.skip(f"Thermocycler card with prefix '{prefix}' not found or disabled.")
    log_step("Exercise thermocycler module card controls")
    device_cards.exercise_thermocycler_card(prefix=prefix)
    log_done("Thermocycler card OK")


def test_heater_shaker_module_card(device_cards: DeviceCardsPage) -> None:
    """Exercise heater-shaker controls when a matching module card is present.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    prefix = DeviceCardsPage.module_prefix(HEATER_SHAKER)
    log_step(f"Check heater-shaker module card (prefix '{prefix}')")
    if not device_cards.has_module_card(prefix):
        log_step(f"Heater-Shaker card with prefix '{prefix}' not found or disabled — skipping")
        pytest.skip(f"Heater-Shaker card with prefix '{prefix}' not found or disabled.")
    log_step("Exercise heater-shaker module card controls")
    device_cards.exercise_heater_shaker_card(prefix=prefix)
    log_done("Heater-Shaker card OK")


def test_temperature_module_card(device_cards: DeviceCardsPage) -> None:
    """Exercise temperature module controls when a matching module card is present.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    prefix = DeviceCardsPage.module_prefix(TEMPERATURE)
    log_step(f"Check temperature module card (prefix '{prefix}')")
    if not device_cards.has_module_card(prefix):
        log_step(f"Temperature module card with prefix '{prefix}' not found or disabled — skipping")
        pytest.skip(f"Temperature module card with prefix '{prefix}' not found or disabled.")
    log_step("Exercise temperature module card controls")
    device_cards.exercise_temperature_module_card(prefix=prefix)
    log_done("Temperature module card OK")


def test_robot_lights(device_cards: DeviceCardsPage) -> None:
    """Toggle robot lights from the robot overview page.

    Not mapped to a Robot Settings T case (T69745–T69756).
    """
    log_step("Toggle robot lights")
    device_cards.exercise_lights()
    log_done("Robot lights OK")
