"""Protocols page navigation and detail tabs."""

from __future__ import annotations

import pytest
from playwright.sync_api import Page, expect

from automation.helpers.screenshot_helper import ScreenshotHelper
from pages.protocols_page import ProtocolsPage


def test_protocol_opens_from_landing(run_local_app: Page, protocol_name: str) -> None:
    ProtocolsPage(run_local_app).open(protocol_name)
    expect(run_local_app).to_have_url("**/protocols/**")


@pytest.mark.parametrize("tab", ProtocolsPage.PROTOCOL_TABS)
def test_protocol_detail_tab(
    run_local_app: Page,
    protocol_name: str,
    screenshot_helper: ScreenshotHelper,
    tab: str,
) -> None:
    protocols = ProtocolsPage(run_local_app, shots=screenshot_helper)
    protocols.open(protocol_name)
    tab_button = protocols.tab_button(tab)
    if tab_button.count() == 0:
        pytest.skip(f"Protocol tab '{tab}' not present.")
    protocols.tab(tab)
    expect(tab_button).to_be_visible()
    screenshot_helper.capture("protocols", tab.lower())
