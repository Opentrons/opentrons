"""Robot Settings tab exercises on the robot detail page.

Runs after ``test_devices_nav`` and before device-card smoke tests. Covers
T69745–T69756 plus Analytics in plan order.

TODO(T69745/T69746): Handle non-connectable robots that redirect Calibration → Networking.
TODO(T69751): Pause protocol when robot door opens — OT-2 only; not exercised on Flex.
"""

from __future__ import annotations

from collections.abc import Generator

import pytest
from playwright.sync_api import Page

from automation.app_helpers.test_progress import log_done, log_step
from automation.app_pages import RobotSettingsPage


@pytest.fixture(scope="session")
def robot_settings(run_local_app: Page, robot_name: str) -> Generator[RobotSettingsPage, None, None]:
    """Navigate once to Robot Settings for the configured robot."""
    log_step(f"Open Robot Settings for '{robot_name}'")
    page = RobotSettingsPage(run_local_app, robot_name=robot_name)
    page.navigate()
    log_done(f"Robot Settings loaded ({robot_name})")
    yield page


def test_calibration_about_calibration(robot_settings: RobotSettingsPage) -> None:
    """T69745: Robot Settings > Calibration > About Calibration."""
    log_step("Validate About Calibration section")
    robot_settings.validate_calibration_about()
    log_done("About Calibration OK")


def test_calibration_pipette_calibrations(robot_settings: RobotSettingsPage) -> None:
    """T69746: Robot Settings > Calibration > Pipette Calibrations."""
    log_step("Validate Pipette Calibrations section")
    robot_settings.validate_calibration_pipettes()
    log_done("Pipette Calibrations OK")


def test_networking(robot_settings: RobotSettingsPage) -> None:
    """T69747: Robot Settings > Networking."""
    log_step("Validate Networking tab")
    robot_settings.validate_networking()
    log_done("Networking OK")


def test_privacy(robot_settings: RobotSettingsPage) -> None:
    """T69748: Robot Settings > Privacy (Camera tab usage controls)."""
    log_step("Validate Camera privacy/usage controls")
    robot_settings.validate_privacy()
    log_done("Privacy OK")


def test_advanced_robot_name(robot_settings: RobotSettingsPage) -> None:
    """T69749: Robot Settings > Advanced > Robot Name."""
    log_step("Validate Robot Name and rename slideout")
    robot_settings.validate_advanced_robot_name()
    log_done("Robot Name OK")


def test_advanced_robot_server_version(robot_settings: RobotSettingsPage) -> None:
    """T69750: Robot Settings > Advanced > Robot server Version."""
    log_step("Validate Robot Server Version")
    robot_settings.validate_advanced_robot_server_version()
    log_done("Robot Server Version OK")


@pytest.mark.skip(reason="TODO(T69751): OT-2 only — pause on door open not exercised on Flex")
def test_advanced_pause_on_door_open(robot_settings: RobotSettingsPage) -> None:
    """T69751: Robot Settings > Advanced > Pause protocol when robot door opens."""
    log_step("Validate pause-on-door-open toggle when present")
    robot_settings.validate_advanced_pause_on_door_open()
    log_done("Pause on door open OK")


def test_advanced_gantry_homing(robot_settings: RobotSettingsPage) -> None:
    """T69752: Robot Settings > Advanced > Disable homing the gantry when restarting robot."""
    log_step("Validate gantry homing toggle")
    robot_settings.validate_advanced_gantry_homing()
    log_done("Gantry homing OK")


def test_advanced_jupyter_notebook(robot_settings: RobotSettingsPage) -> None:
    """T69753: Robot settings > Advanced > Jupyter Notebook."""
    log_step("Validate Jupyter Notebook section")
    robot_settings.validate_advanced_jupyter_notebook()
    log_done("Jupyter Notebook OK")


def test_advanced_update_robot_software(robot_settings: RobotSettingsPage) -> None:
    """T69754: Robot Settings > Advanced > Update robot software."""
    log_step("Validate Update Robot Software section")
    robot_settings.validate_advanced_update_robot_software()
    log_done("Update robot software OK")


def test_advanced_device_reset(robot_settings: RobotSettingsPage) -> None:
    """T69755: Robot settings > Advanced > Device Reset."""
    log_step("Validate Device Reset slideout")
    robot_settings.validate_advanced_device_reset()
    log_done("Device Reset OK")


def test_advanced_robot_server_reinstall(robot_settings: RobotSettingsPage) -> None:
    """T69756: Robot settings > Advanced > Robot Server Reinstall."""
    log_step("Validate Robot Server reinstall controls")
    robot_settings.validate_advanced_robot_server_reinstall()
    log_done("Robot Server Reinstall OK")


def test_analytics(robot_settings: RobotSettingsPage) -> None:
    """Analytics: Camera usage settings on Robot Settings > Camera."""
    log_step("Validate Camera usage/analytics controls")
    robot_settings.validate_analytics()
    log_done("Analytics OK")
