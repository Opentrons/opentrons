"""Snapshot tests for Protocol Designer artifacts."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage
from protocols import ProtocolFixture, get_protocol_fixtures


@pytest.mark.snapshot
@pytest.mark.pdE2E
@pytest.mark.parametrize(
    "protocol",
    get_protocol_fixtures(),
    ids=lambda f: f.key,
)
def test_migrate(page: Page, base_url: str, protocol: ProtocolFixture) -> None:
    """Make sure that all the protocol fixtures can be imported into PD."""
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(protocol.path)
    landing.dismiss_migration_modal()
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=5000)
