"""Device card tests start on the robot detail page."""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

import pytest
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page
from pytest_html import extras as html_extras

from automation.app_helpers.app_readiness import dismiss_blocking_ui
from automation.app_helpers.reporting import VIDEOS_DIR, ensure_test_results_dir, unique_artifact_path
from automation.app_helpers.screencast_recorder import ScreencastRecorder
from automation.app_helpers.test_progress import log_done, log_step, make_suite_logstart
from automation.app_pages import DeviceCardsPage, DevicesPage
from run_config import is_headed_run

pytestmark = pytest.mark.device_cards


pytest_runtest_logstart = make_suite_logstart("device_cards")


@pytest.fixture(scope="session", autouse=True)
def _device_cards_continuous_video(
    request: pytest.FixtureRequest,
    run_local_app: Page,
) -> Generator[None, None, None]:
    """Record one headed screencast for the full device_cards suite."""
    screencast: ScreencastRecorder | None = None
    if is_headed_run(request.config):
        ensure_test_results_dir()
        video_path = unique_artifact_path(VIDEOS_DIR, "device_cards", ".webm")
        screencast = ScreencastRecorder(run_local_app, video_path)
        try:
            screencast.start()
        except PlaywrightError as error:
            print(f"\n⚠️  Unable to start device_cards screencast: {error}")
            screencast = None

    yield

    if screencast is None:
        return
    saved_video = screencast.stop()
    if saved_video is not None:
        request.session.device_cards_video_path = str(saved_video)


def _device_cards_video_extras(video_path: str) -> list:
    """Build pytest-html extras for the suite screencast."""
    relative = Path(video_path).as_posix()
    return [
        html_extras.html(f'<video width="640" controls><source src="{relative}" type="video/webm"></video>'),
        html_extras.url(relative, name="Download device_cards video"),
    ]


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Attach the suite screencast to each device_cards row in the HTML report."""
    video_path = getattr(session, "device_cards_video_path", None)
    if not video_path or not Path(video_path).exists():
        return

    extras = _device_cards_video_extras(video_path)
    for item in session.items:
        if item.get_closest_marker("device_cards") is None:
            continue
        teardown_report = getattr(item, "rep_teardown", None)
        if teardown_report is not None:
            teardown_report.extras = getattr(teardown_report, "extras", []) + extras


@pytest.fixture(scope="session")
def device_cards(
    _device_cards_continuous_video: None,
    run_local_app: Page,
    robot_name: str,
) -> Generator[DeviceCardsPage, None, None]:
    """Shared helper: navigate once, cache module inventory for all tests in this session."""
    log_step(f"Navigating to robot detail for '{robot_name}'")
    helper = DeviceCardsPage(run_local_app)
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
