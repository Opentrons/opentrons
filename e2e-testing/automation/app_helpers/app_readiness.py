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
    _close_open_slideouts(page)
    _wait_for_overlays_hidden(page, timeout=timeout)


def click_when_ui_ready(page: Page, locator: Locator, *, timeout: float = 15_000) -> None:
    """Dismiss blocking UI, then click the target."""
    dismiss_blocking_ui(page, timeout=timeout)
    if APP_SETTINGS_URL.search(page.url):
        # Drain a pending gear-menu debounced navigate before leaving App Settings.
        page.wait_for_timeout(GEAR_NAV_DEBOUNCE_MS)
    locator.click()


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


def _close_open_slideouts(page: Page) -> None:
    """Close visible slideouts so navbar links are clickable."""
    deadline = time.time() + 5.0
    close_buttons = page.locator(SLIDEOUT_CLOSE_SELECTOR)

    while time.time() < deadline:
        visible_indexes = [index for index in range(close_buttons.count()) if close_buttons.nth(index).is_visible()]
        if not visible_indexes:
            return
        close = close_buttons.nth(visible_indexes[0])
        # Slideout close buttons are fixed-position; Playwright may treat them as
        # outside the viewport even when visible.
        try:
            close.click(force=True, timeout=2_000)
        except Exception:
            page.keyboard.press("Escape")
        page.wait_for_timeout(400)


def _wait_for_overlays_hidden(page: Page, *, timeout: float) -> None:
    """Wait until blocking overlay elements are no longer visible."""
    overlays = page.locator(OVERLAY_SELECTOR)
    if overlays.count() == 0:
        return

    per_overlay_timeout = max(timeout / overlays.count(), 1_000)
    for index in range(overlays.count()):
        expect(overlays.nth(index)).to_be_hidden(timeout=per_overlay_timeout)
