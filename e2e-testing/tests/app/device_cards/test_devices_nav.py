"""Devices list to robot detail navigation.

Robot Settings test plan (``device_cards`` suite — runs before card exercises):

1. T69745 — Robot Settings > Calibration > About Calibration
2. T69746 — Robot Settings > Calibration > Pipette Calibrations
3. T69747 — Robot Settings > Networking
4. T69748 — Robot Settings > Privacy
5. T69749 — Robot Settings > Advanced > Robot Name
6. T69750 — Robot Settings > Advanced > Robot server Version
7. T69751 — Robot Settings > Advanced > Pause protocol when robot door opens
8. T69752 — Robot Settings > Advanced > Disable homing the gantry when restarting robot
9. T69753 — Robot settings > Advanced > Jupyter Notebook
10. T69754 — Robot Settings > Advanced > Update robot software
11. T69755 — Robot settings > Advanced > Device Reset
12. T69756 — Robot settings > Advanced > Robot Server Reinstall
13. Analytics — Robot and app analytics (robot settings context)
"""

from __future__ import annotations

from playwright.sync_api import Page

from automation.app_helpers.test_progress import log_done, log_step
from automation.app_pages import DevicesPage


def test_robot_detail_from_devices_list(run_local_app: Page, robot_name: str) -> None:
    """Navigate to robot detail — prerequisite for T69745–T69756 (``test_robot_settings``)."""
    log_step(f"Open Devices and select robot '{robot_name}'")
    DevicesPage(run_local_app, robot_name=robot_name).navigate()
    log_done(f"Robot detail page loaded ({robot_name})")
