"""Protocols page navigation and detail tabs."""

from __future__ import annotations

import pytest
from playwright.sync_api import Page, expect

from automation.helpers.screenshot_helper import ScreenshotHelper
from automation.helpers.test_progress import log_done, log_step
from pages.protocols_page import ProtocolsPage


def test_protocol_opens_from_landing(run_local_app: Page, protocol_name: str) -> None:
    """Open a protocol from the landing list and assert detail URL loads."""
    log_step(f"Open Protocols landing and select '{protocol_name}'")
    ProtocolsPage(run_local_app).open(protocol_name)
    expect(run_local_app).to_have_url(ProtocolsPage.PROTOCOL_DETAIL_URL)
    log_done("Protocol detail page loaded")


@pytest.mark.parametrize("tab", ProtocolsPage.PROTOCOL_TABS)
def test_protocol_detail_tab(
    run_local_app: Page,
    protocol_name: str,
    screenshot_helper: ScreenshotHelper,
    tab: str,
) -> None:
    """Open a protocol and screenshot each present detail tab."""
    log_step(f"Open protocol '{protocol_name}'")
    protocols = ProtocolsPage(run_local_app, shots=screenshot_helper)
    protocols.open(protocol_name)
    tab_button = protocols.tab_button(tab)
    if tab_button.count() == 0:
        log_step(f"Tab '{tab}' not present — skipping")
        pytest.skip(f"Protocol tab '{tab}' not present.")
    log_step(f"Switch to '{tab}' tab and capture screenshot")
    protocols.tab(tab)
    expect(tab_button).to_be_visible()
    screenshot_helper.capture("protocols", tab.lower())
    log_done(f"'{tab}' tab visible")
