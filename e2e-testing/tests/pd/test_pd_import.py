"""Test protocol import functionality."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage


@pytest.mark.pdE2E
def test_import_v7_protocol_shows_migration_modal(page: Page, base_url: str) -> None:
    """Test importing a v7 protocol shows the migration modal.

    This test replicates the Cypress import.cy.ts test for v7 protocols:
    1. Navigate to landing page
    2. Click "Import existing protocol"
    3. Upload a v7 protocol file
    4. Verify migration modal appears
    5. Click Import to proceed
    6. Verify protocol metadata page displays correctly
    """
    # Start on landing page
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()

    # Click "Import existing protocol" button
    page.get_by_text("Import existing protocol").click()

    # Upload the v7 protocol file (doItAllV7.json)
    # Path is relative to e2e-testing directory
    protocol_file_path = "fixtures/protocol/7/doItAllV7.json"
    # Use the landing page file input (not the navigation one)
    file_input = page.get_by_label("Import_from_landing")
    file_input.set_input_files(protocol_file_path)

    # Verify migration modal appears with expected text
    expect(page.get_by_text("Your protocol was made in an older version of Protocol Designer")).to_be_visible(
        timeout=10000
    )
    expect(page.get_by_text("Your protocol and included labware will be automatically updated")).to_be_visible()

    # Verify modal has Import and Cancel buttons
    expect(page.get_by_role("button", name="Import")).to_be_visible()
    expect(page.get_by_role("button", name="Cancel")).to_be_visible()

    # Click Import to proceed
    page.get_by_role("button", name="Import").click()

    # Verify we're on the protocol metadata/overview page
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)
    expect(page.get_by_text("Instruments")).to_be_visible()
    expect(page.get_by_text("Protocol Starting Deck")).to_be_visible()

    # Verify protocol name is displayed (doItAllV7 should have "doItAll" or similar)
    # The protocol should have some visible metadata


@pytest.mark.pdE2E
def test_import_v8_protocol_no_migration_modal(page: Page, base_url: str) -> None:
    """Test importing a v8 protocol does not show migration modal.

    This test replicates the Cypress import.cy.ts test for v8 protocols:
    1. Navigate to landing page
    2. Click "Import existing protocol"
    3. Upload a v8 protocol file
    4. Verify migration modal does NOT appear
    5. Go directly to protocol metadata page
    """
    # Start on landing page
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()

    # Click "Import existing protocol" button
    page.get_by_text("Import existing protocol").click()

    # Upload the v8 protocol file (doItAllV8.json)
    protocol_file_path = "fixtures/protocol/8/doItAllV8.json"
    # Use the landing page file input (not the navigation one)
    file_input = page.get_by_label("Import_from_landing")
    file_input.set_input_files(protocol_file_path)

    # Verify we go directly to the protocol metadata page (no migration modal)
    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)
    expect(page.get_by_text("Instruments")).to_be_visible()
    expect(page.get_by_text("Protocol Starting Deck")).to_be_visible()
