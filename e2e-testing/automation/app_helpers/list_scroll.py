"""Shared End-key scrolling for long app lists (Devices, Labware, Protocols)."""

from __future__ import annotations

from playwright.sync_api import Locator, Page

DEFAULT_MAX_SCROLLS = 60
DEFAULT_PAUSE_MS = 150


def _scroll_y(page: Page) -> float:
    return page.evaluate("() => window.scrollY || document.documentElement.scrollTop")


def scroll_until_visible(
    page: Page,
    locator: Locator,
    *,
    max_scrolls: int = DEFAULT_MAX_SCROLLS,
    pause_ms: int = DEFAULT_PAUSE_MS,
) -> Locator:
    """Press End until ``locator`` is visible, then scroll it into view."""
    for _ in range(max_scrolls):
        if locator.count() > 0 and locator.is_visible():
            break
        page.keyboard.press("End")
        page.wait_for_timeout(pause_ms)
    locator.scroll_into_view_if_needed()
    return locator


def scroll_to_bottom(
    page: Page,
    *,
    max_scrolls: int = DEFAULT_MAX_SCROLLS,
    pause_ms: int = DEFAULT_PAUSE_MS,
) -> None:
    """Press End until the page scroll position stops changing."""
    previous_scroll = _scroll_y(page)
    for _ in range(max_scrolls):
        page.keyboard.press("End")
        page.wait_for_timeout(pause_ms)
        current_scroll = _scroll_y(page)
        if current_scroll == previous_scroll:
            break
        previous_scroll = current_scroll
