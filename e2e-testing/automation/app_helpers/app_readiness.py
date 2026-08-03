"""Dismiss modals and slideouts that block navbar interaction."""

from __future__ import annotations

import re
import time

from playwright.sync_api import Locator, Page, expect

OVERLAY_SELECTOR = '[data-sentry-component="Overlay"]'
SLIDEOUT_CLOSE_SELECTOR = '[data-testid^="Slideout_icon_close_"]'
LANGUAGE_MODAL_BUTTONS = ("Continue", "Use system language", "Don't change")
APP_SETTINGS_URL = re.compile(r"#/app-settings")
# Navbar gear menu debounces navigation by 300ms (see app/src/App/Navbar/index.tsx).
GEAR_NAV_DEBOUNCE_MS = 350


def dismiss_blocking_ui(page: Page, *, timeout: float = 15_000) -> None:
    """Close startup modals and slideouts so the app is ready for navigation."""
    _dismiss_language_modals(page)
    close_visible_slideouts(page)
    wait_for_overlays_hidden(page, timeout=timeout)


def click_when_ui_ready(page: Page, locator: Locator, *, timeout: float = 15_000) -> None:
    """Dismiss blocking UI, then click the target."""
    dismiss_blocking_ui(page, timeout=timeout)
    if APP_SETTINGS_URL.search(page.url):
        # Drain a pending gear-menu debounced navigate before leaving App Settings.
        page.wait_for_timeout(GEAR_NAV_DEBOUNCE_MS)
    locator.click()


def close_visible_slideouts(page: Page, *, deadline_s: float = 5.0, pause_ms: int = 400) -> bool:
    """Close visible slideouts. Returns True if any close was attempted."""
    deadline = time.time() + deadline_s
    close_buttons = page.locator(SLIDEOUT_CLOSE_SELECTOR)
    closed_any = False

    while time.time() < deadline:
        visible_indexes = [index for index in range(close_buttons.count()) if close_buttons.nth(index).is_visible()]
        if not visible_indexes:
            return closed_any
        close = close_buttons.nth(visible_indexes[0])
        closed_any = True
        # Slideout close buttons are fixed-position; Playwright may treat them as
        # outside the viewport even when visible.
        try:
            close.click(force=True, timeout=2_000)
        except Exception:
            page.keyboard.press("Escape")
        page.wait_for_timeout(pause_ms)
    return closed_any


def click_visible_overlays(page: Page, *, timeout_ms: float = 1_000) -> bool:
    """Click visible Overlay components to dismiss menus/slideouts. Returns True if any clicked."""
    overlays = page.locator(OVERLAY_SELECTOR)
    clicked_any = False
    for index in range(overlays.count()):
        overlay = overlays.nth(index)
        if not overlay.is_visible():
            continue
        clicked_any = True
        try:
            overlay.click(force=True, position={"x": 8, "y": 8}, timeout=timeout_ms)
        except Exception:
            pass
    return clicked_any


def wait_for_overlays_hidden(page: Page, *, timeout: float) -> None:
    """Wait until blocking overlay elements are no longer visible."""
    overlays = page.locator(OVERLAY_SELECTOR)
    if overlays.count() == 0:
        return

    per_overlay_timeout = max(timeout / overlays.count(), 1_000)
    for index in range(overlays.count()):
        expect(overlays.nth(index)).to_be_hidden(timeout=per_overlay_timeout)


def _dismiss_language_modals(page: Page) -> None:
    """Click through optional language-selection modals on first launch."""
    for button_name in LANGUAGE_MODAL_BUTTONS:
        button = page.get_by_role("button", name=button_name)
        if button.count() == 0:
            continue
        try:
            button.first.click(timeout=2_000)
        except Exception:
            continue
