from __future__ import annotations

import os
import platform
import subprocess
import time
import urllib.error
import urllib.request
from playwright.sync_api import Browser, Page, Playwright, sync_playwright

DEBUG_PORT = 9222


def get_opentrons_path() -> str:
    """Return the standard Opentrons executable path for this OS."""
    current_os = platform.system().lower()

    if current_os == "windows":
        program_files = os.environ.get("ProgramFiles(x86)", "C:\\Program Files (x86)")
        return os.path.join(program_files, "Opentrons", "Opentrons.exe")

    if current_os == "darwin":
        return "/Applications/Opentrons.app/Contents/MacOS/Opentrons"

    if current_os == "linux":
        return "/usr/bin/opentrons"

    raise OSError(f"Unsupported operating system: {platform.system()}")


def _wait_for_cdp(debug_port: int, timeout: float = 30.0) -> None:
    url = f"http://127.0.0.1:{debug_port}/json/version"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1):
                return
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(0.5)
    raise TimeoutError(f"CDP not ready on port {debug_port} after {timeout}s")


def launch_app(*, debug_port: int = DEBUG_PORT, quiet: bool = True) -> subprocess.Popen:
    """Launch Opentrons with remote debugging. Returns immediately once CDP is up."""
    app_path = get_opentrons_path()
    print(f"Launching Opentrons from: {app_path}")

    popen_kwargs: dict = {}
    if quiet:
        popen_kwargs["stdout"] = subprocess.DEVNULL
        popen_kwargs["stderr"] = subprocess.DEVNULL

    process = subprocess.Popen(
        [app_path, f"--remote-debugging-port={debug_port}"],
        **popen_kwargs,
    )
    _wait_for_cdp(debug_port)
    print(f"Opentrons app ready (CDP port {debug_port})")
    return process


def _is_app_page(page: Page) -> bool:
    url = page.url.lower()
    title = page.title().lower()
    if "devtools" in url or title == "devtools":
        return False
    return "index.html" in url or "opentrons" in title


def _find_app_page(context) -> Page:
    for _ in range(30):
        for page in context.pages:
            if _is_app_page(page):
                return page
        time.sleep(1)

    for page in context.pages:
        if "devtools" not in page.url.lower():
            return page

    raise RuntimeError("Could not find Opentrons app window")


def connect_playwright(*, debug_port: int = DEBUG_PORT) -> tuple[Playwright, Browser, Page]:
    """Connect Playwright to a running Opentrons app. Caller must keep Playwright alive."""
    playwright = sync_playwright().start()
    cdp_url = f"http://127.0.0.1:{debug_port}"
    print(f"Connecting Playwright to {cdp_url}...")
    browser = playwright.chromium.connect_over_cdp(cdp_url)
    page = _find_app_page(browser.contexts[0])
    page.bring_to_front()
    print(f"Connected to app window: '{page.title()}'")
    return playwright, browser, page


def launch_and_connect(
    *, debug_port: int = DEBUG_PORT, quiet: bool = True
) -> tuple[subprocess.Popen, Playwright, Browser, Page]:
    process = launch_app(debug_port=debug_port, quiet=quiet)
    playwright, browser, page = connect_playwright(debug_port=debug_port)
    return process, playwright, browser, page


_app_process: subprocess.Popen | None = None
_playwright: Playwright | None = None
_browser: Browser | None = None
page: Page | None = None


def init(*, debug_port: int = DEBUG_PORT, quiet: bool = True) -> Page:
    """Launch the app, connect Playwright, and expose the active page."""
    global _app_process, _playwright, _browser, page
    _app_process, _playwright, _browser, page = launch_and_connect(
        debug_port=debug_port,
        quiet=quiet,
    )
    return page
