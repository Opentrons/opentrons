"""Pytest fixtures for launching the Opentrons Electron application.

Usage
-----
Mark your tests with ``@pytest.mark.appE2E`` and depend on the ``app_page``
fixture, which hands you a ready-to-use Playwright ``Page`` backed by the
first BrowserWindow of the Electron app.

The fixture chain launches the installed Opentrons desktop application with
``--remote-debugging-port`` and connects Playwright over CDP (Chrome DevTools
Protocol).

Configuration
-------------
``OPENTRONS_APP_PATH``  – env-var pointing to the Electron executable **or**
the ``.app`` bundle on macOS.  When unset the fixture falls back to
well-known install locations for the current platform.

``APP_STARTUP_TIMEOUT`` – seconds to wait for the app to expose its CDP
endpoint (default 30).

``APP_CDP_PORT`` – Chrome DevTools Protocol port used to connect Playwright
to the running Electron process (default 9222).
"""

from __future__ import annotations

import os
import platform
import signal
import subprocess
import time
import urllib.request
from collections.abc import Generator
from pathlib import Path

import pytest
from playwright.sync_api import Browser, Page, Playwright

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DEFAULT_CDP_PORT = 9222


def _resolve_executable() -> str:
    """Return the absolute path to the Opentrons Electron binary.

    Precedence:
    1. ``OPENTRONS_APP_PATH`` environment variable
    2. Platform-specific well-known install locations
    """
    explicit = os.environ.get("OPENTRONS_APP_PATH")
    if explicit:
        path = Path(explicit)
        # On macOS the user may point to the .app bundle or the binary inside it.
        if path.suffix == ".app":
            inner = path / "Contents" / "MacOS" / "Opentrons"
            if inner.exists():
                return str(inner)
        if path.exists():
            return str(path)
        raise FileNotFoundError(f"OPENTRONS_APP_PATH is set to '{explicit}' but the path does not exist.")

    system = platform.system()
    candidates: list[Path] = []

    if system == "Darwin":
        candidates = [
            Path("/Applications/Opentrons.app/Contents/MacOS/Opentrons"),
            Path.home() / "Applications" / "Opentrons.app" / "Contents" / "MacOS" / "Opentrons",
        ]
    elif system == "Linux":
        candidates = [
            Path("/usr/bin/opentrons"),
            Path("/opt/Opentrons/opentrons"),
            Path.home() / "Opentrons.AppImage",
        ]
    elif system == "Windows":
        localappdata = os.environ.get("LOCALAPPDATA", "")
        candidates = [
            Path(localappdata) / "Programs" / "Opentrons" / "Opentrons.exe",
        ]

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    searched = "\n  ".join(str(c) for c in candidates)
    raise FileNotFoundError(
        f"Could not find the Opentrons application.\n"
        f"Set the OPENTRONS_APP_PATH environment variable or install the app.\n"
        f"Searched:\n  {searched}"
    )


def _wait_for_cdp(port: int, timeout: int) -> None:
    """Block until the CDP endpoint is reachable on *port*."""
    url = f"http://127.0.0.1:{port}/json/version"
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            urllib.request.urlopen(url, timeout=2)
            return
        except Exception:
            time.sleep(0.5)
    raise TimeoutError(f"Electron app did not expose CDP on port {port} within {timeout}s")


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def app_path() -> str:
    """Resolve and return the Opentrons Electron executable path."""
    path = _resolve_executable()
    print(f"\n✓ Opentrons app found at {path}")
    return path


@pytest.fixture(scope="session")
def electron_app_process(app_path: str) -> Generator[subprocess.Popen[bytes], None, None]:
    """Launch the Opentrons Electron app with remote-debugging enabled.

    The process is kept alive for the entire test session and terminated
    when the session ends.
    """
    cdp_port = int(os.environ.get("APP_CDP_PORT", str(_DEFAULT_CDP_PORT)))
    startup_timeout = int(os.environ.get("APP_STARTUP_TIMEOUT", "30"))

    print(f"\nLaunching Opentrons app (CDP port {cdp_port}) …")
    proc: subprocess.Popen[bytes] = subprocess.Popen(
        [app_path, f"--remote-debugging-port={cdp_port}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    try:
        _wait_for_cdp(cdp_port, timeout=startup_timeout)
    except Exception:
        proc.kill()
        proc.wait(timeout=5)
        raise

    print("✓ Electron app is running and CDP is available")

    yield proc

    print("\nStopping Opentrons app …")
    proc.send_signal(signal.SIGTERM)
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        print("⚠️  App did not exit in time; sending SIGKILL.")
        proc.kill()
        proc.wait(timeout=5)
    print("✓ Electron app stopped")


@pytest.fixture(scope="session")
def electron_browser(
    playwright: Playwright,
    electron_app_process: subprocess.Popen[bytes],
) -> Generator[Browser, None, None]:
    """Connect Playwright to the running Electron app over CDP."""
    cdp_port = int(os.environ.get("APP_CDP_PORT", str(_DEFAULT_CDP_PORT)))
    cdp_url = f"http://127.0.0.1:{cdp_port}"

    print(f"\nConnecting Playwright to CDP endpoint {cdp_url} …")
    browser = playwright.chromium.connect_over_cdp(cdp_url)
    print(f"✓ Connected — {len(browser.contexts)} context(s) found")

    yield browser

    browser.close()


@pytest.fixture(scope="session")
def app_window(electron_browser: Browser) -> Page:
    """Return the main BrowserWindow page of the Electron app.

    Picks the first page from the first context — this is the main
    application window created by Electron on startup.
    """
    contexts = electron_browser.contexts
    assert contexts, "Expected at least one browser context from the Electron app"
    pages = contexts[0].pages
    assert pages, "Expected at least one page (BrowserWindow) in the Electron app"

    window = pages[0]
    window.wait_for_load_state("domcontentloaded", timeout=30_000)
    print(f"✓ App window ready – title: {window.title()!r}, url: {window.url}")
    return window


@pytest.fixture
def app_page(app_window: Page) -> Page:
    """Convenience fixture returning the app window as a ``Page``.

    Function-scoped so that per-test timeout and other settings are isolated.
    """
    app_window.set_default_timeout(10_000)
    return app_window
