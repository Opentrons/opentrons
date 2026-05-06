"""Tests for Protocol Designer home page."""

import pytest
from playwright.sync_api import Page, expect


@pytest.mark.pdE2E
def test_home_page_loads_successfully(page: Page, pd_base_url: str) -> None:
    """Test that the home page loads successfully with all expected elements.

    This test verifies:
    - The page title is correct
    - The Protocol Designer header text is visible
    - The Create new button is visible in the header
    - The Settings icon button is visible
    - The welcome message is displayed
    - Privacy policy and EULA links are present
    - Create a Flex protocol button is visible
    - Import existing protocol label is visible
    """
    # Navigate to home page (done automatically by page fixture)
    # Close analytics modal
    expect(page.get_by_role("button", name="Confirm")).to_be_visible()
    page.get_by_role("button", name="Confirm").click()

    # Verify page title
    expect(page).to_have_title("Opentrons Protocol Designer")

    # Verify header elements (use first for elements that appear multiple times)
    expect(page.get_by_text("Protocol Designer").first).to_be_visible()
    expect(page.get_by_text("Create new")).to_be_visible()
    expect(page.get_by_label("Settings Icon Button")).to_be_visible()

    # Verify home page specific elements
    expect(page.get_by_text("Welcome to Protocol Designer!")).to_be_visible()
    expect(page.locator('a[href="https://opentrons.com/privacy-policy"]')).to_be_visible()
    expect(page.locator('a[href="https://opentrons.com/eula"]')).to_be_visible()
    expect(page.get_by_role("button", name="Create a Flex protocol")).to_be_visible()
    expect(page.get_by_label("Import existing protocol")).to_be_visible()
