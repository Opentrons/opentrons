"""Pytest configuration for Playwright e2e tests."""

import os
import re
import select
import subprocess
import time
import urllib.request
from collections.abc import Generator
from pathlib import Path
from typing import Any

import pytest
from _pytest.fixtures import FixtureRequest
from playwright.sync_api import BrowserContext, Page, Video
from playwright.sync_api import Error as PlaywrightError


def _ensure_test_results_dir() -> None:
    """Ensure the test-results directory exists."""
    os.makedirs("test-results", exist_ok=True)


def _slugify_nodeid(nodeid: str) -> str:
    """Convert a pytest node ID to a filesystem-friendly slug."""
    test_identifier = nodeid.split("::")[-1]
    candidate = re.sub(r"[^A-Za-z0-9_.-]+", "_", test_identifier)
    candidate = candidate.strip("_")
    if not candidate:
        return "test"
    return candidate[:200]


def _save_video_with_test_name(video: Video, nodeid: str) -> None:
    """Persist the recorded video using the test name instead of a hash."""
    videos_dir = Path("test-results/videos")
    videos_dir.mkdir(parents=True, exist_ok=True)

    original_path: Path | None = None
    suffix = ".webm"

    try:
        original_path = Path(video.path())
        if original_path.suffix:
            suffix = original_path.suffix
    except PlaywrightError:
        original_path = None

    slug = _slugify_nodeid(nodeid)
    destination = videos_dir / f"{slug}{suffix}"
    counter = 1
    while destination.exists():
        destination = videos_dir / f"{slug}_{counter}{suffix}"
        counter += 1

    try:
        video.save_as(str(destination))
    except PlaywrightError as error:
        print(f"\n⚠️  Unable to save video for {nodeid}: {error}")
        return

    if original_path and original_path.exists() and original_path != destination:
        try:
            original_path.unlink()
        except OSError:
            pass


def pytest_configure(config: Any) -> None:
    """Create test-results directory if it doesn't exist."""
    _ensure_test_results_dir()


def pytest_sessionstart(session: pytest.Session) -> None:
    """Ensure artifacts directory exists before tests begin."""
    _ensure_test_results_dir()


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Guarantee artifacts directory exists before report generation."""
    _ensure_test_results_dir()


@pytest.fixture(scope="session")
def browser_context_args() -> dict[str, Any]:
    """Configure browser context.

    Records videos for all tests (passing and failing) to test-results/videos/.
    Videos are useful for debugging test failures, especially in CI.
    """
    return {
        "viewport": {"width": 1280, "height": 720},
        "record_video_dir": "test-results/videos",
        "record_video_size": {"width": 1280, "height": 720},
    }


@pytest.fixture(scope="session")
def browser_type_launch_args(pytestconfig: pytest.Config) -> dict[str, Any]:
    """Configure browser launch arguments."""
    is_ci = os.environ.get("CI", "false").lower() == "true"
    headed_cli = bool(pytestconfig.getoption("headed"))
    headless_env = os.environ.get("HEADLESS")

    if is_ci:
        headless = True
    elif headed_cli:
        headless = False
    elif headless_env is not None:
        headless = headless_env.lower() == "true"
    else:
        headless = True

    return {
        "headless": headless,
        "slow_mo": 0 if headless else 250,
    }


def _should_skip_dev_server(pytestconfig: pytest.Config) -> bool:
    """Determine whether the dev server should be skipped (e.g., unit tests only)."""
    markexpr = (pytestconfig.getoption("markexpr") or "").replace(" ", "").lower()
    if not markexpr:
        return False
    # Skip when running exclusively with unit marker (like `-m unit`)
    return "unit" in markexpr and "pde2e" not in markexpr


def _is_server_running(url: str, timeout: int = 1) -> bool:
    """Check if server is already running at the given URL."""
    try:
        urllib.request.urlopen(url, timeout=timeout)
        return True
    except Exception:
        return False


def _find_running_server() -> str | None:
    """Find if Protocol Designer server is running on any common port."""
    ports_to_check = [4173, 4174, 4175]
    for port in ports_to_check:
        url = f"http://localhost:{port}"
        if _is_server_running(url):
            return url
    return None


def _wait_for_server_ready(timeout: int = 240) -> str | None:
    """Wait for the local Protocol Designer server to become available."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        running_server = _find_running_server()
        if running_server:
            return running_server
        time.sleep(1)
    return None


def _start_local_server() -> Generator[str, None, None]:
    """Start or reuse a local Protocol Designer preview server."""
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing_server = _find_running_server()
    if existing_server:
        print(f"\n✓ Server already running on {existing_server}, skipping startup")
        os.environ["PD_SERVER_URL"] = existing_server
        yield existing_server
        return

    if skip_server:
        fallback_url = os.environ.get("PD_SERVER_URL", "http://localhost:4173")
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing server detected; "
            "returning fallback URL without starting preview server."
        )
        yield fallback_url
        return

    print("\nStarting protocol-designer preview server...")
    print("Building Protocol Designer (this may take 2-3 minutes)...")
    print("=" * 80)

    # Start the preview server (vite preview serves production build)
    server_process = subprocess.Popen(
        ["make", "-C", "../protocol-designer", "serve"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    # Wait for server to be ready, checking common ports
    max_attempts = 120
    ports_to_try = [4173, 4174, 4175]
    output_lines = []
    server_url = None

    for attempt in range(max_attempts):
        if server_process.poll() is not None:
            if server_process.stdout:
                remaining_output = server_process.stdout.read()
                if remaining_output:
                    print(remaining_output, end="")
                    output_lines.append(remaining_output)
            print(f"\n❌ Server process exited unexpectedly with code {server_process.returncode}")
            raise Exception(
                f"Server process exited with code {server_process.returncode}. Check output above for errors."
            )

        if server_process.stdout and select.select([server_process.stdout], [], [], 0.1)[0]:
            line = server_process.stdout.readline()
            if line:
                print(line, end="")
                output_lines.append(line)

        for port in ports_to_try:
            try:
                test_url = f"http://localhost:{port}"
                urllib.request.urlopen(test_url, timeout=1)
                print(f"✅ Preview server is ready on {test_url}")
                server_url = test_url
                break
            except Exception:
                pass

        if server_url:
            break

        if attempt > 0 and attempt % 10 == 0:
            elapsed = attempt * 2
            print(f"  Still waiting for server... ({elapsed}s elapsed)")

        if attempt == max_attempts - 1:
            print(f"\n❌ Server failed to start after {max_attempts * 2} seconds")
            server_process.kill()
            raise Exception(
                f"Preview server failed to start on any port: {ports_to_try}. "
                f"Waited {max_attempts * 2} seconds. Check output above for errors."
            )
        time.sleep(2)

    print("=" * 80)
    assert server_url is not None
    os.environ["PD_SERVER_URL"] = server_url

    try:
        yield server_url
    finally:
        if server_process:
            print("\nStopping dev server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print("⚠️  Preview server did not exit in time; sending SIGKILL.")
                server_process.kill()
                server_process.wait(timeout=5)
            if server_process.stdout:
                server_process.stdout.close()


@pytest.fixture(scope="session")
def base_url(pytestconfig: pytest.Config) -> Generator[str, None, None]:
    """Return the resolved base URL for the Protocol Designer instance."""
    if _should_skip_dev_server(pytestconfig):
        fallback_url = os.environ.get("PD_SERVER_URL", "http://localhost:4173")
        yield fallback_url
        return

    env = os.environ.get("TEST_ENV", "local")
    environments = {
        "staging": "https://staging.designer.opentrons.com",
        "prod": "https://designer.opentrons.com",
    }

    if env != "local":
        remote_url = environments.get(env, "http://localhost:4173")
        os.environ["PD_SERVER_URL"] = remote_url
        yield remote_url
        return

    yield from _start_local_server()


@pytest.fixture
def page(context: BrowserContext, base_url: str, request: FixtureRequest) -> Generator[Page, None, None]:
    """Configure page with base URL and rename recorded video using test name."""
    page = context.new_page()
    page.set_default_timeout(10000)
    target_url = os.environ.get("PD_SERVER_URL", base_url)

    try:
        page.goto(target_url)
    except PlaywrightError as error:
        error_message = str(error)
        if "ERR_CONNECTION_REFUSED" not in error_message:
            raise

        print("\n⚠️  Connection refused, rechecking Protocol Designer server availability...")
        restored_url = _wait_for_server_ready()
        if not restored_url:
            raise

        os.environ["PD_SERVER_URL"] = restored_url
        print(f"✓ Recovered server on {restored_url}, retrying navigation")
        page.goto(restored_url)

    try:
        yield page
    finally:
        page_video: Video | None = getattr(page, "video", None)
        try:
            page.close()
        except PlaywrightError as error:
            print(f"\n⚠️  Failed to close page for {request.node.nodeid}: {error}")

        if page_video is not None:
            _save_video_with_test_name(page_video, request.node.nodeid)
