"""Pytest configuration for Playwright e2e tests."""

import os
import select
import subprocess
import time
import urllib.request
import uuid
from collections.abc import Generator
from pathlib import Path
from typing import Any, List, Literal

import pytest
from _pytest.config import Config
from _pytest.fixtures import FixtureRequest
from _pytest.nodes import Item
from _pytest.python import Function
from playwright.sync_api import BrowserContext, Page, Video
from playwright.sync_api import Error as PlaywrightError

from automation.app_helpers.reporting import ensure_test_results_dir, slugify_nodeid
from run_config import effective_headless, is_headed_run, publish_playwright_headless_mode
from utility import _pause_for_debugging, troubleshoot_and_pause

# Expose fixtures defined in e2e-testing/eyes.py (e.g. the `eyes` fixture).
pytest_plugins = ["eyes"]


def pytest_collection_modifyitems(config: Config, items: List[Item]) -> None:
    if is_headed_run(config):
        for item in items:
            # Check if it's a function-based test (it usually is)
            if isinstance(item, Function):
                # Now the type checker knows 'item' has the 'obj' attribute
                item.obj = troubleshoot_and_pause(item.obj)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item: Item, call: pytest.CallInfo) -> Generator[None, None, None]:
    """Same pause path as ``troubleshoot_and_pause`` when fixture setup fails."""
    outcome = yield
    report = outcome.get_result()
    if report.failed and call.when == "setup" and is_headed_run(item.config):
        error = report.longrepr if isinstance(report.longrepr, BaseException) else None
        _pause_for_debugging(item.nodeid, error, item=item)


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

    slug = slugify_nodeid(nodeid)
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
    ensure_test_results_dir()


def _ensure_applitools_batch_env() -> None:
    """Ensure the Applitools batch name/id are stable for a single pytest run.

    Applitools defaults `APPLITOOLS_BATCH_ID` to a unique per-process UUID.
    For pytest runs, we want one batch shared across all tests in the same run.
    """

    is_ci = os.environ.get("CI", "false").lower() == "true"
    debug_enabled = os.environ.get("APPLITOOLS_DEBUG", "false").lower() == "true"
    should_log = is_ci or debug_enabled

    # This helper may be invoked multiple times (pytest_configure + sessionstart).
    # Print debug info only once per process to keep CI logs readable.
    debug_already_printed = os.environ.get("_APPLITOOLS_BATCH_DEBUG_PRINTED") == "true"

    def _log(message: str) -> None:
        if should_log and not debug_already_printed:
            print(f"[applitools] {message}")

    # Respect explicit user/CI configuration.
    if os.getenv("APPLITOOLS_BATCH_ID") and os.getenv("APPLITOOLS_BATCH_NAME"):
        _log("Batch env already set; leaving as-is.")
        _log(f"APPLITOOLS_BATCH_NAME={os.getenv('APPLITOOLS_BATCH_NAME')}")
        _log(f"APPLITOOLS_BATCH_ID={os.getenv('APPLITOOLS_BATCH_ID')}")
        if should_log and not debug_already_printed:
            os.environ["_APPLITOOLS_BATCH_DEBUG_PRINTED"] = "true"
        return

    # Create a stable ID for the run if one isn't already set.
    _log(f"CI={os.environ.get('CI')}")
    _log(f"APPLITOOLS_DEBUG={os.environ.get('APPLITOOLS_DEBUG')}")
    _log(f"TEST_ENV={os.environ.get('TEST_ENV')}")
    _log(f"GITHUB_HEAD_REF={os.environ.get('GITHUB_HEAD_REF')}")
    _log(f"GITHUB_REF_NAME={os.environ.get('GITHUB_REF_NAME')}")
    _log(f"GITHUB_REF={os.environ.get('GITHUB_REF')}")
    _log(f"APPLITOOLS_BATCH_NAME_pre={os.getenv('APPLITOOLS_BATCH_NAME')}")
    _log(f"APPLITOOLS_BATCH_ID_pre={os.getenv('APPLITOOLS_BATCH_ID')}")

    os.environ.setdefault("APPLITOOLS_BATCH_ID", str(uuid.uuid4()))

    if os.getenv("APPLITOOLS_BATCH_NAME") is not None:
        _log("APPLITOOLS_BATCH_NAME already set; using existing value.")
        _log(f"APPLITOOLS_BATCH_NAME={os.getenv('APPLITOOLS_BATCH_NAME')}")
        _log(f"APPLITOOLS_BATCH_ID={os.getenv('APPLITOOLS_BATCH_ID')}")
        if should_log and not debug_already_printed:
            os.environ["_APPLITOOLS_BATCH_DEBUG_PRINTED"] = "true"
        return

    test_env = os.getenv("TEST_ENV", "local")

    if is_ci:
        # For pull_request events, this is the source branch name.
        # Fallbacks cover non-PR workflows.
        pr_branch = (
            os.getenv("GITHUB_HEAD_REF") or os.getenv("GITHUB_REF_NAME") or os.getenv("GITHUB_REF") or "unknown-branch"
        )
        os.environ["APPLITOOLS_BATCH_NAME"] = f"CI | {pr_branch}"
    else:
        os.environ["APPLITOOLS_BATCH_NAME"] = f"dev run | {test_env}"

    _log("Batch env configured.")
    _log(f"APPLITOOLS_BATCH_NAME={os.getenv('APPLITOOLS_BATCH_NAME')}")
    _log(f"APPLITOOLS_BATCH_ID={os.getenv('APPLITOOLS_BATCH_ID')}")
    if should_log and not debug_already_printed:
        os.environ["_APPLITOOLS_BATCH_DEBUG_PRINTED"] = "true"


def pytest_sessionstart(session: pytest.Session) -> None:
    """Ensure artifacts directory exists before tests begin."""
    ensure_test_results_dir()
    _ensure_applitools_batch_env()


@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    """Guarantee artifacts directory exists before report generation."""
    ensure_test_results_dir()


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
    headless = effective_headless(pytestconfig)
    publish_playwright_headless_mode(headless)

    return {
        "headless": headless,
        "slow_mo": 0 if headless else 250,
    }


PD_SERVER_PORTS = [4173, 4174, 4175]
LL_SERVER_PORTS = [4176, 4177, 4178]

# Substrings expected in the HTML <title> of each app.  Used by
# ``_verify_server_identity`` to confirm the right application is serving.
_APP_TITLE_FINGERPRINTS: dict[str, str] = {
    "pd": "Protocol Designer",
    "ll": "Labware Library",
}


def _is_http_server_running(url: str, timeout: int = 1) -> bool:
    """Check if any HTTP server is already responding at the given URL."""
    try:
        urllib.request.urlopen(url, timeout=timeout)
        return True
    except Exception:
        return False


def _verify_server_identity(url: str, app: Literal["pd", "ll"], timeout: int = 2) -> bool:
    """Return True if the server at *url* is serving the expected application.

    Fetches the root page and checks that the HTML ``<title>`` contains the
    fingerprint string for the requested app.  This prevents one app from
    being mistaken for the other when they happen to share ports.
    """
    fingerprint = _APP_TITLE_FINGERPRINTS[app]
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            # Read a limited chunk — the <title> is near the top of the page.
            body = resp.read(4096).decode("utf-8", errors="replace")
            return fingerprint.lower() in body.lower()
    except Exception:
        return False


def _find_running_server(
    ports_to_check: list[int],
    app: Literal["pd", "ll"] | None = None,
) -> str | None:
    """Find a running server on localhost for the given port list.

    When *app* is provided the server's HTML title is checked to confirm
    the correct application is serving.  A server that responds but serves
    the wrong app is skipped with a warning.
    """
    for port in ports_to_check:
        url = f"http://localhost:{port}"
        if _is_http_server_running(url):
            if app is not None and not _verify_server_identity(url, app):
                print(
                    f"\n⚠️  Server on {url} is responding but does not look like "
                    f"{app.upper()} (expected '{_APP_TITLE_FINGERPRINTS[app]}' in "
                    f"<title>).  Skipping."
                )
                continue
            return url
    return None


def _wait_for_server_ready(
    ports_to_check: list[int],
    timeout: int = 240,
    app: Literal["pd", "ll"] | None = None,
) -> str | None:
    """Wait for a local server to become available on any of the given ports."""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        running_server = _find_running_server(ports_to_check, app=app)
        if running_server:
            return running_server
        time.sleep(1)
    return None


def _get_suite_for_test(request: FixtureRequest) -> Literal["pd", "ll", "none"]:
    """Infer which app a test targets based on markers."""
    is_pd = request.node.get_closest_marker("pdE2E") is not None
    is_ll = request.node.get_closest_marker("llE2E") is not None

    if is_pd and is_ll:
        raise RuntimeError(
            "A test cannot be marked with both 'pdE2E' and 'llE2E'. Run these suites separately or split the test."
        )
    if is_pd:
        return "pd"
    if is_ll:
        return "ll"
    return "none"


def _start_pd_server() -> Generator[str, None, None]:
    """Start or reuse a local Protocol Designer preview server."""
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing_server = _find_running_server(PD_SERVER_PORTS, app="pd")
    if existing_server:
        print(f"\n✓ Protocol Designer already running on {existing_server}, skipping startup")
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
    ports_to_try = PD_SERVER_PORTS
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
                if not _verify_server_identity(test_url, "pd"):
                    continue
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


def _start_ll_server() -> Generator[str, None, None]:
    """Start or reuse a local Labware Library preview server."""
    skip_server = os.environ.get("SKIP_SERVER_START", "false").lower() == "true"

    existing_server = _find_running_server(LL_SERVER_PORTS, app="ll")
    if existing_server:
        print(f"\n✓ Labware Library already running on {existing_server}, skipping startup")
        os.environ["LL_SERVER_URL"] = existing_server
        yield existing_server
        return

    if skip_server:
        fallback_url = os.environ.get("LL_SERVER_URL", "http://localhost:4176")
        print(
            "\n⚠️  SKIP_SERVER_START is set and no existing Labware Library server detected; "
            "returning fallback URL without starting preview server."
        )
        os.environ["LL_SERVER_URL"] = fallback_url
        yield fallback_url
        return

    print("\nStarting labware-library preview server...")
    print("Building Labware Library (this may take 1-2 minutes)...")
    print("=" * 80)

    preferred_port = int(os.environ.get("LL_SERVER_PORT", str(LL_SERVER_PORTS[0])))
    server_process = subprocess.Popen(
        [
            "make",
            "-C",
            "../labware-library",
            "serve",
            f"PORT={preferred_port}",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    max_attempts = 120
    ports_to_try = [preferred_port] + [p for p in LL_SERVER_PORTS if p != preferred_port]
    output_lines: list[str] = []
    server_url: str | None = None

    for attempt in range(max_attempts):
        if server_process.poll() is not None:
            if server_process.stdout:
                remaining_output = server_process.stdout.read()
                if remaining_output:
                    print(remaining_output, end="")
                    output_lines.append(remaining_output)
            print(f"\n❌ Labware Library server process exited with code {server_process.returncode}")
            raise Exception("Labware Library preview server exited unexpectedly. Check output above for errors.")

        if server_process.stdout and select.select([server_process.stdout], [], [], 0.1)[0]:
            line = server_process.stdout.readline()
            if line:
                print(line, end="")
                output_lines.append(line)

        for port in ports_to_try:
            try:
                test_url = f"http://localhost:{port}"
                urllib.request.urlopen(test_url, timeout=1)
                if not _verify_server_identity(test_url, "ll"):
                    continue
                print(f"✅ Labware Library preview server is ready on {test_url}")
                server_url = test_url
                break
            except Exception:
                pass

        if server_url:
            break

        if attempt > 0 and attempt % 10 == 0:
            elapsed = attempt * 2
            print(f"  Still waiting for Labware Library server... ({elapsed}s elapsed)")

        if attempt == max_attempts - 1:
            print(f"\n❌ Labware Library server failed to start after {max_attempts * 2} seconds")
            server_process.kill()
            raise Exception(
                f"Labware Library preview server failed to start on any port: {ports_to_try}. "
                f"Waited {max_attempts * 2} seconds."
            )
        time.sleep(2)

    print("=" * 80)
    assert server_url is not None
    os.environ["LL_SERVER_URL"] = server_url

    try:
        yield server_url
    finally:
        print("\nStopping Labware Library dev server...")
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            print("⚠️  Labware Library preview server did not exit in time; sending SIGKILL.")
            server_process.kill()
            server_process.wait(timeout=5)
        if server_process.stdout:
            server_process.stdout.close()


@pytest.fixture(scope="session")
def pd_base_url(pytestconfig: pytest.Config) -> Generator[str, None, None]:
    """Return the resolved base URL for Protocol Designer tests."""
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

    yield from _start_pd_server()


@pytest.fixture(scope="session")
def ll_base_url(pytestconfig: pytest.Config) -> Generator[str, None, None]:
    """Return the resolved base URL for Labware Library tests."""
    env = os.environ.get("TEST_ENV", "local")
    environments = {
        "staging": "https://staging.labware.opentrons.com",
        "prod": "https://labware.opentrons.com",
    }

    if env != "local":
        remote_url = os.environ.get("LL_BASE_URL", environments.get(env, "https://labware.opentrons.com")).rstrip("/")
        os.environ["LL_SERVER_URL"] = remote_url
        yield remote_url
        return

    yield from _start_ll_server()


@pytest.fixture
def page(context: BrowserContext, request: FixtureRequest) -> Generator[Page, None, None]:
    """Configure page with base URL and rename recorded video using test name."""
    page = context.new_page()
    page.set_default_timeout(10000)
    suite = _get_suite_for_test(request)
    if suite == "pd":
        resolved_base_url = str(request.getfixturevalue("pd_base_url"))
        target_url = os.environ.get("PD_SERVER_URL", resolved_base_url)
        ports_to_check = PD_SERVER_PORTS
        env_var = "PD_SERVER_URL"
    elif suite == "ll":
        resolved_base_url = str(request.getfixturevalue("ll_base_url"))
        target_url = os.environ.get("LL_SERVER_URL", resolved_base_url)
        ports_to_check = LL_SERVER_PORTS
        env_var = "LL_SERVER_URL"
    else:
        target_url = os.environ.get("PD_SERVER_URL", "http://localhost:4173")
        ports_to_check = PD_SERVER_PORTS
        env_var = "PD_SERVER_URL"

    try:
        page.goto(target_url)
    except PlaywrightError as error:
        error_message = str(error)
        if "ERR_CONNECTION_REFUSED" not in error_message:
            raise

        print("\n⚠️  Connection refused, rechecking server availability...")
        if suite == "pd":
            identity_app: Literal["pd", "ll"] | None = "pd"
        elif suite == "ll":
            identity_app = "ll"
        else:
            identity_app = None
        restored_url = _wait_for_server_ready(ports_to_check, app=identity_app)
        if not restored_url:
            raise

        os.environ[env_var] = restored_url
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
