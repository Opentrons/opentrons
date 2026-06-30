"""Helpers for local Flex dev robot (robot-server + localhost discovery)."""

from __future__ import annotations

import time

import httpx
from playwright.sync_api import Page, expect

from automation.helpers.app_readiness import click_when_ui_ready, dismiss_blocking_ui
from automation.helpers.left_nav import link

LOCALHOST = "localhost"
ROBOT_SERVER_PORT = 31950
HEALTH_HEADERS = {"Opentrons-Version": "*"}


def wait_for_robot_server(
    *,
    host: str = LOCALHOST,
    port: int = ROBOT_SERVER_PORT,
    timeout: float = 180.0,
) -> None:
    """Poll GET /health until the dev robot-server responds."""
    url = f"http://{host}:{port}/health"
    deadline = time.time() + timeout
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            with httpx.Client(headers=HEALTH_HEADERS, timeout=3.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    return
        except Exception as exc:
            last_error = exc
        time.sleep(1.0)
    raise TimeoutError(
        f"Robot server not ready at {url} after {timeout}s"
        + (f" (last error: {last_error})" if last_error else "")
    )


def ensure_localhost_robot_discovered(
    page: Page,
    *,
    robot_name: str,
    host: str = LOCALHOST,
    timeout: float = 90_000,
) -> None:
    """Add localhost to manual discovery if the dev robot card is not visible yet."""
    robot_card = page.locator(f"#RobotCard_{robot_name}_robotImage")
    if robot_card.count() > 0 and robot_card.first.is_visible():
        return

    settings_link = page.get_by_test_id("Navbar_settingsLink")
    click_when_ui_ready(page, settings_link)
    page.get_by_role("button", name="Set up connection").click()
    expect(
        page.get_by_test_id("Slideout_title_Connect to a Robot via IP Address")
    ).to_be_visible()

    if page.get_by_test_id("ip-hostname").filter(has_text=host).count() == 0:
        page.get_by_test_id("manual-ip-hostname-input").fill(host)
        page.get_by_role("button", name="Add").click()

    close = page.get_by_test_id("Slideout_icon_close_Connect to a Robot via IP Address")
    if close.count() > 0 and close.is_visible():
        close.click(force=True)

    dismiss_blocking_ui(page)
    click_when_ui_ready(page, link(page, "Devices"))
    expect(robot_card.first).to_be_visible(timeout=timeout)
