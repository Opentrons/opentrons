"""Left sidebar navigation helpers for the Opentrons desktop app."""

from __future__ import annotations

import re
from re import Pattern

from playwright.sync_api import Locator, Page, expect

from automation.helpers.app_readiness import click_when_ui_ready, dismiss_blocking_ui
from automation.helpers.locator_helpers import sidebar_nav_link

_NAV_TARGETS: dict[str, str] = {
    "Devices": "devices",
    "Labware": "labware",
    "Protocols": "protocols",
}


def link(page: Page, name: str, *, first: bool = False) -> Locator:
    """Return the left-nav link for ``name`` (Devices, Labware, Protocols)."""
    href_fragment = _NAV_TARGETS.get(name)
    if href_fragment is None:
        locator = page.get_by_role("link", name=name, exact=True).filter(
            has_not=page.locator('[class*="crumb_link"]')
        )
        return locator.first if first else locator
    return sidebar_nav_link(page, href_fragment=href_fragment, label=name)


def _url_matches(page: Page, url_pattern: str | Pattern[str]) -> bool:
    if isinstance(url_pattern, Pattern):
        return url_pattern.search(page.url) is not None
    return re.search(url_pattern, page.url) is not None


def _goto_hash(page: Page, hash_path: str) -> None:
    """Navigate directly via hash routing when sidebar clicks are unavailable."""
    base = page.url.split("#", 1)[0]
    normalized = hash_path if hash_path.startswith("#") else f"#{hash_path}"
    page.goto(f"{base}{normalized}")


def navigate_to(
    page: Page,
    name: str,
    url_pattern: str | Pattern[str],
    *,
    first: bool = False,
) -> Locator:
    """Click a left-nav link and wait until that section is active."""
    dismiss_blocking_ui(page)

    if _url_matches(page, url_pattern):
        return link(page, name, first=first)

    nav = link(page, name, first=first)
    try:
        click_when_ui_ready(page, nav)
        page.wait_for_url(url_pattern)
    except Exception:
        href_fragment = _NAV_TARGETS.get(name)
        if href_fragment is None:
            raise
        _goto_hash(page, f"#/{href_fragment}")
        page.wait_for_url(url_pattern)

    try:
        expect(nav).to_have_attribute("aria-current", "page", timeout=5_000)
    except AssertionError:
        if not _url_matches(page, url_pattern):
            raise
    return nav
