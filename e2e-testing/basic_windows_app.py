"""Basic Windows Electron app smoke test.

This script is intended to be run in CI after:

- building the Windows NSIS installer
- installing the app on the runner
- launching the app with a Chrome remote debugging port

It connects to the Electron app's Chromium instance over CDP using Playwright
and asserts that at least one window (page) is available.
"""

from __future__ import annotations

import argparse
import json
import time
import urllib.request
from dataclasses import dataclass

from playwright.sync_api import Browser, Page, sync_playwright  # type: ignore[import-not-found]


@dataclass(frozen=True)
class SmokeConfig:
    """Configuration for the basic Electron smoke test."""

    cdp_url: str
    timeout_seconds: float


def _parse_args(argv: list[str] | None = None) -> SmokeConfig:
    """Parse CLI args.

    Args:
        argv: Optional argument vector.

    Returns:
        Parsed configuration.
    """
    parser = argparse.ArgumentParser(description="Playwright CDP smoke test for installed Windows app")
    parser.add_argument(
        "--cdp-url",
        default="http://127.0.0.1:9222",
        help="CDP base URL for the running Electron app (default: http://127.0.0.1:9222)",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=60.0,
        help="Total timeout to wait for CDP readiness and window creation.",
    )

    args = parser.parse_args(argv)
    return SmokeConfig(cdp_url=str(args.cdp_url).rstrip("/"), timeout_seconds=float(args.timeout_seconds))


def _wait_for_cdp_ready(cdp_url: str, timeout_seconds: float) -> None:
    """Wait for the CDP endpoint to be ready.

    Args:
        cdp_url: CDP base URL.
        timeout_seconds: Timeout in seconds.

    Raises:
        RuntimeError: If the endpoint does not become ready before the timeout.
    """
    # /json/version is a simple readiness signal for CDP.
    url = f"{cdp_url}/json/version"
    deadline = time.time() + timeout_seconds
    last_exc: Exception | None = None

    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                json.loads(resp.read().decode("utf-8"))
            return
        except Exception as exc:  # noqa: BLE001 (CI smoke test; keep simple)
            last_exc = exc
            time.sleep(1)

    raise RuntimeError(f"Timed out waiting for CDP readiness at {url}: {last_exc}")


def _get_any_page(browser: Browser, timeout_seconds: float) -> Page:
    """Return the first available page (window), waiting briefly if needed."""
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        for context in browser.contexts:
            if context.pages:
                return context.pages[0]
        time.sleep(1)

    raise RuntimeError("No pages/windows found via CDP")


def run_smoke(config: SmokeConfig) -> None:
    """Run the CDP smoke test.

    Args:
        config: Smoke test configuration.
    """
    _wait_for_cdp_ready(config.cdp_url, timeout_seconds=min(30.0, config.timeout_seconds))

    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(config.cdp_url)
        try:
            page = _get_any_page(browser, timeout_seconds=config.timeout_seconds)
            _ = page.evaluate("() => ({ readyState: document.readyState, href: location.href })")
        finally:
            browser.close()


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint."""
    config = _parse_args(argv)
    run_smoke(config)
    print("OK: connected to Electron via CDP and found a window")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
