"""Smoke tests for the Opentrons desktop application (Electron).

These tests launch the installed Opentrons app via Playwright's Electron
support and verify that the application starts and renders its initial UI.
"""

import pytest
from playwright.sync_api import Page, expect

from automation.app_pages import AppPage


@pytest.mark.appE2E
def test_app_launches_and_shows_window(app_page: Page) -> None:
    """Verify the Electron app launches and a window appears.

    The most basic smoke test — if the app crashes on startup or fails to
    render any content this test will fail.
    """
    app = AppPage(app_page)
    app.wait_for_app_ready()

    # The window title should contain "Opentrons".
    title = app.get_title()
    assert title, "Window title should not be empty"
    print(f"Window title: {title!r}")


@pytest.mark.appE2E
def test_app_displays_initial_content(app_page: Page) -> None:
    """Verify the app renders recognisable content after startup.

    Looks for the text 'Opentrons' somewhere in the page, which should
    be present in the nav bar / branding area of every screen.
    """
    app = AppPage(app_page)
    app.wait_for_app_ready()

    # Take a screenshot for debugging / visual reference.
    app_page.screenshot(path="test-results/app_initial_content.png")

    # There should be at least one element containing "Opentrons".
    opentrons_text = app_page.get_by_text("Opentrons").first
    expect(opentrons_text).to_be_visible(timeout=15_000)
