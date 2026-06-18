"""Launch the Opentrons desktop app and attach Playwright over CDP."""

from __future__ import annotations

import os
import platform
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

from playwright.sync_api import Browser, Page, Playwright, sync_playwright

from automation.helpers.app_readiness import dismiss_blocking_ui

DEBUG_PORT = 9222
DEV_CDP_TIMEOUT_S = 180.0


def find_monorepo_root() -> Path:
    """Walk up from this file until the Opentrons monorepo root is found."""
    for parent in Path(__file__).resolve().parents:
        if (parent / "app" / "Makefile").is_file() and (
            parent / "robot-server" / "Makefile"
        ).is_file():
            return parent
    raise RuntimeError("Could not find Opentrons monorepo root from Open_app.py")


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


def launch_dev_app(
    *,
    debug_port: int = DEBUG_PORT,
    opentrons_project: str = "ot3",
    quiet: bool = True,
) -> subprocess.Popen:
    """Run ``make -C app dev`` with CDP enabled. Returns once CDP is up."""
    repo_root = find_monorepo_root()
    print(
        f"Launching dev app (make -C app dev OPENTRONS_PROJECT={opentrons_project})..."
    )

    popen_kwargs: dict = {}
    if quiet:
        popen_kwargs["stdout"] = subprocess.DEVNULL
        popen_kwargs["stderr"] = subprocess.DEVNULL

    env = {
        **os.environ,
        "ELECTRON_EXTRA_ARGS": f"--remote-debugging-port={debug_port}",
    }
    process = subprocess.Popen(
        ["make", "-C", "app", "dev", f"OPENTRONS_PROJECT={opentrons_project}"],
        cwd=repo_root,
        env=env,
        **popen_kwargs,
    )
    _wait_for_cdp(debug_port, timeout=DEV_CDP_TIMEOUT_S)
    print(f"Dev app ready (CDP port {debug_port})")
    return process


def launch_app(*, debug_port: int = DEBUG_PORT, quiet: bool = True) -> subprocess.Popen:
    """Launch Opentrons with remote debugging. Returns once CDP is up."""
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


def _iter_cdp_pages(browser: Browser):
    for context in browser.contexts:
        yield from context.pages


def _find_app_page(browser: Browser) -> Page:
    for _ in range(30):
        for page in _iter_cdp_pages(browser):
            if _is_app_page(page):
                return page
        time.sleep(1)

    for page in _iter_cdp_pages(browser):
        if "devtools" not in page.url.lower():
            return page

    raise RuntimeError("Could not find Opentrons app window")


def connect_playwright(*, debug_port: int = DEBUG_PORT) -> tuple[Playwright, Browser, Page]:
    """Connect Playwright to a running Opentrons app. Caller must stop Playwright."""
    playwright = sync_playwright().start()
    cdp_url = f"http://127.0.0.1:{debug_port}"
    print(f"Connecting Playwright to {cdp_url}...")
    browser = playwright.chromium.connect_over_cdp(cdp_url)
    page = _find_app_page(browser)
    page.bring_to_front()
    print(f"Connected to app window: '{page.title()}'")
    return playwright, browser, page


def launch_and_connect(
    *, debug_port: int = DEBUG_PORT, quiet: bool = True
) -> tuple[subprocess.Popen, Playwright, Browser, Page]:
    process = launch_app(debug_port=debug_port, quiet=quiet)
    playwright, browser, page = connect_playwright(debug_port=debug_port)
    return process, playwright, browser, page


def launch_dev_and_connect(
    *,
    debug_port: int = DEBUG_PORT,
    opentrons_project: str = "ot3",
    quiet: bool = True,
) -> tuple[subprocess.Popen, Playwright, Browser, Page]:
    process = launch_dev_app(
        debug_port=debug_port,
        opentrons_project=opentrons_project,
        quiet=quiet,
    )
    playwright, browser, page = connect_playwright(debug_port=debug_port)
    return process, playwright, browser, page


def prepare_app_page(page: Page) -> Page:
    """Dismiss blocking UI after attach."""
    dismiss_blocking_ui(page)
    return page


def should_attach_only() -> bool:
    return os.environ.get("ATTACH", "").strip().lower() in ("1", "true", "yes")
