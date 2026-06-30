"""Pytest fixtures for Opentrons Electron regression tests."""

from __future__ import annotations

import os
import subprocess
from collections.abc import Generator
from pathlib import Path

import bootstrap  # noqa: F401
import pytest
from playwright.sync_api import Browser, Page, Playwright
from pytest_html import extras as html_extras

import Open_app
from automation.helpers.cli_args import inject_robot_profile_or_name_arg
from automation.helpers.dev_robot_setup import ensure_localhost_robot_discovered, wait_for_robot_server
from automation.helpers.reporting import (
    capture_failure_screenshot,
    ensure_test_results_dir,
    is_headed_run,
    slugify_nodeid,
    start_test_recording,
    stop_test_recording,
)
from automation.helpers.robot_profiles import (
    DEFAULT_HARDWARE_ROBOT_NAME,
    RobotProfile,
    get_robot_profile,
)
from automation.helpers.screenshot_helper import ScreenshotHelper
from automation.helpers.test_progress import log_step
from setup_usb_or_wifi import DEFAULT_ROBOT_IP, RobotConnection

from check_health import find_opentrons_usb_port

DEFAULT_PROTOCOL_NAME = os.environ.get(
    # TODO: Update to 2.29/2.30 when available
    "PROTOCOL_NAME",
    "Flex Smoke Test - v2.28",
)
print(f"DEFAULT_PROTOCOL_NAME: {DEFAULT_PROTOCOL_NAME} from os.environ.get('PROTOCOL_NAME')")


def pytest_load_initial_conftests(early_config, parser, args) -> None:
    """Allow ``pytest fake-robot`` / ``pytest QA1Potato`` without main_script.py."""
    inject_robot_profile_or_name_arg(args)


def _resolve_robot_name(config: pytest.Config, profile: RobotProfile | None) -> str:
    """Resolve robot display name from profile, CLI flag, or environment."""
    if profile is not None:
        return profile.robot_name
    from_cli = config.getoption("--robot-name")
    if from_cli:
        return from_cli.strip()
    return os.environ.get("ROBOT_NAME", DEFAULT_HARDWARE_ROBOT_NAME).strip()


def pytest_addoption(parser: pytest.Parser) -> None:
    """Register robot name and launch profile CLI options."""
    parser.addoption(
        "--headed",
        action="store_true",
        default=False,
        help="Keep the Electron window visible during tests (or set HEADED=1).",
    )
    parser.addoption(
        "--robot-name",
        action="store",
        default=None,
        help="Robot display name on the Devices page (overrides ROBOT_NAME env var).",
    )
    parser.addoption(
        "--robot-profile",
        action="store",
        default=None,
        help=(
            "Launch profile (e.g. fake-robot starts make -C app dev + local robot-server). "
            "Overrides --robot-name when set."
        ),
    )


def _terminate_process(process: subprocess.Popen | None) -> None:
    """Terminate a subprocess, escalating to kill when it does not exit in time."""
    if process is None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except Exception:
        process.kill()


def _connect_robot_for_tests(profile: RobotProfile | None) -> RobotConnection:
    """Connect to USB, localhost, or Wi-Fi robot and verify ``/health``."""
    if profile is not None and not profile.require_hardware_connection:
        connection = RobotConnection(ip="127.0.0.1")
        connection("/health")
        return connection

    usb_port = find_opentrons_usb_port()
    if usb_port is not None:
        connection = RobotConnection(usb_port=usb_port)
        connection("/health")
        return connection

    ip = os.environ.get("ROBOT_IP", DEFAULT_ROBOT_IP).strip()
    connection = RobotConnection(ip=ip)
    connection("/health")
    return connection


@pytest.fixture(scope="session")
def robot_profile(request: pytest.FixtureRequest) -> RobotProfile | None:
    """Return the selected robot launch profile, if any."""
    profile_id = request.config.getoption("--robot-profile")
    if profile_id:
        profile = get_robot_profile(profile_id.strip())
        log_step(f"Robot profile: {profile.profile_id} (robot name: {profile.robot_name})")
        return profile
    return None


@pytest.fixture(scope="session")
def robot_server_process(
    robot_profile: RobotProfile | None,
) -> Generator[subprocess.Popen | None, None, None]:
    """Start ``make -C robot-server dev-flex`` for the fake-robot profile."""
    if robot_profile is None or not robot_profile.start_robot_server:
        yield None
        return

    try:
        wait_for_robot_server(timeout=3.0)
        log_step("Local robot-server already running — reusing")
        yield None
        return
    except TimeoutError:
        pass

    repo_root = Open_app.find_monorepo_root()
    log_step("Starting local Flex robot-server (make -C robot-server dev-flex)")
    process = subprocess.Popen(
        ["make", "-C", "robot-server", "dev-flex"],
        cwd=repo_root,
    )
    try:
        wait_for_robot_server()
        log_step("Local robot-server is healthy")
        yield process
    finally:
        _terminate_process(process)


@pytest.fixture(scope="session")
def robot_connection(
    robot_profile: RobotProfile | None,
    robot_server_process: subprocess.Popen | None,
) -> RobotConnection:
    """Connect to the robot over USB, Wi-Fi, or localhost before the app opens the port."""
    del robot_server_process
    return _connect_robot_for_tests(robot_profile)


@pytest.fixture(scope="session")
def run_local_app(
    robot_connection: RobotConnection,
    robot_profile: RobotProfile | None,
    request: pytest.FixtureRequest,
) -> Generator[Page, None, None]:
    """Launch (or attach to) the Opentrons desktop app and yield the Playwright page."""
    del robot_connection

    headed = is_headed_run(request.config)
    use_dev_app = robot_profile is not None and robot_profile.app_mode == "dev"
    if headed:
        log_step("Headed mode: Electron window stays visible; bringing app to front each test")
    if use_dev_app:
        log_step("App mode: dev (make -C app dev)")

    process: subprocess.Popen | None = None
    playwright: Playwright | None = None
    browser: Browser | None = None

    if Open_app.should_attach_only():
        playwright, browser, page = Open_app.connect_playwright()
    elif use_dev_app:
        assert robot_profile is not None
        process, playwright, browser, page = Open_app.launch_dev_and_connect(
            quiet=not headed,
            opentrons_project=robot_profile.opentrons_project,
        )
    else:
        process, playwright, browser, page = Open_app.launch_and_connect(quiet=not headed)

    Open_app.prepare_app_page(page)
    if robot_profile is not None and robot_profile.add_localhost_manual_ip:
        log_step(f"Ensuring localhost robot '{robot_profile.robot_name}' is discoverable")
        ensure_localhost_robot_discovered(page, robot_name=robot_profile.robot_name)
    if headed:
        page.bring_to_front()
    yield page

    if browser is not None:
        try:
            browser.close()
        except Exception:
            pass
    if playwright is not None:
        playwright.stop()
    _terminate_process(process)


@pytest.fixture(scope="session")
def robot_name(
    request: pytest.FixtureRequest, robot_profile: RobotProfile | None
) -> str:
    """Resolved robot display name used on the Devices page."""
    name = _resolve_robot_name(request.config, robot_profile)
    log_step(f"Robot name: {name}")
    return name


@pytest.fixture(autouse=True)
def _headed_bring_app_to_front(
    request: pytest.FixtureRequest, run_local_app: Page
) -> Generator[None, None, None]:
    """Bring the Electron window to the front before each test in headed mode."""
    if is_headed_run(request.config):
        try:
            if not run_local_app.is_closed():
                run_local_app.bring_to_front()
        except Exception:
            if run_local_app.is_closed():
                pytest.fail("Opentrons app window closed before test started.")
            raise
    yield


@pytest.fixture(autouse=True)
def _record_test_artifacts(
    request: pytest.FixtureRequest, run_local_app: Page
) -> Generator[None, None, None]:
    """Record per-test Playwright trace and optional headed screencast video."""
    slug = slugify_nodeid(request.node.nodeid)
    headed = is_headed_run(request.config)
    uses_suite_video = request.node.get_closest_marker("device_cards") is not None
    recording = start_test_recording(
        context=run_local_app.context,
        page=run_local_app,
        slug=slug,
        record_screencast=headed and not uses_suite_video,
    )
    yield
    artifacts = stop_test_recording(run_local_app.context, recording)
    if artifacts.trace_path is not None:
        request.node.user_properties.append(("trace_path", str(artifacts.trace_path)))
    if artifacts.video_path is not None:
        request.node.user_properties.append(("video_path", str(artifacts.video_path)))


@pytest.fixture(scope="session")
def protocol_name() -> str:
    """Default protocol title used by navigation tests."""
    return DEFAULT_PROTOCOL_NAME


@pytest.fixture(scope="session")
def screenshot_helper(run_local_app: Page) -> ScreenshotHelper:
    """Session-scoped helper for saving PNG screenshots under ``artifacts/``."""
    return ScreenshotHelper(run_local_app)


def _artifact_extras(item: pytest.Item) -> list:
    """Build pytest-html extras for trace, video, and failure screenshot artifacts."""
    report_extras: list = []
    for name, path_str in item.user_properties:
        path = Path(path_str)
        if not path.exists():
            continue
        relative = path.as_posix()
        if name == "trace_path":
            report_extras.append(
                html_extras.url(relative, name="Playwright trace (open in trace viewer)")
            )
        elif name == "video_path":
            report_extras.append(
                html_extras.html(
                    f'<video width="640" controls><source src="{relative}" '
                    f'type="video/webm"></video>'
                )
            )
            report_extras.append(html_extras.url(relative, name="Download video"))
        elif name == "screenshot_path":
            report_extras.append(html_extras.image(relative))
    return report_extras


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item: pytest.Item, call: pytest.CallInfo) -> Generator[None, None, None]:
    """Attach trace, video, and failure screenshot links to the HTML report."""
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        page = item.funcargs.get("run_local_app")
        if page is not None:
            slug = slugify_nodeid(item.nodeid)
            screenshot_path = capture_failure_screenshot(page, slug)
            if screenshot_path is not None:
                item.user_properties.append(("screenshot_path", str(screenshot_path)))
    if report.when == "teardown":
        report.extras = getattr(report, "extras", []) + _artifact_extras(item)


def pytest_configure(config: pytest.Config) -> None:
    """Register markers and ensure the HTML report output directory exists."""
    ensure_test_results_dir()
    config.addinivalue_line("markers", "smoke: navigation tests under tests/nav/")
    config.addinivalue_line(
        "markers",
        "device_cards: tests under tests/device_cards/ (robot detail hardware UI)",
    )


# Full-suite order: device_cards (devices nav, then cards) → nav (labware, protocols, settings).
_MODULE_ORDER = (
    "device_cards/test_devices_nav.py",
    "device_cards/test_cards.py",
    "nav/test_labware.py",
    "nav/test_protocols.py",
    "nav/test_app_settings.py",
)


def pytest_collection_modifyitems(
    session: pytest.Session, config: pytest.Config, items: list[pytest.Item]
) -> None:
    """Run device_cards before nav, with modules in workflow order within each suite."""
    rank = {path: index for index, path in enumerate(_MODULE_ORDER)}

    def sort_key(item: pytest.Item) -> tuple[int, str]:
        rel = "/".join(item.path.parts[-2:])
        return (rank.get(rel, len(_MODULE_ORDER)), item.nodeid)

    items.sort(key=sort_key)


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Ensure artifact directories exist before pytest-html writes the report."""
    ensure_test_results_dir()
