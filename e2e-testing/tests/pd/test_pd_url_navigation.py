"""Test direct URL navigation in Protocol Designer.

Ports tests from protocol-designer/cypress/e2e/urlNavigation.cy.ts.
"""

import pytest
from playwright.sync_api import Page, expect


def _build_hash_url(base_url: str, fragment: str) -> str:
    """Construct a Protocol Designer hash URL from the provided base URL."""
    normalized_base = base_url.rstrip("/")
    normalized_fragment = fragment.lstrip("#/")
    return f"{normalized_base}/#/{normalized_fragment}"


@pytest.mark.pdE2E
def test_navigate_to_settings_directly(page: Page, pd_base_url: str) -> None:
    """Test direct navigation to settings page via URL.

    Cypress uses hash routing: cy.visit('#/settings')
    """
    # Protocol Designer uses hash routing
    settings_url = _build_hash_url(pd_base_url, "settings")
    page.goto(settings_url)

    # Verify we're on the settings page - matches cy.verifySettingsPage()
    # Use exact match and check for heading/title context
    expect(page.get_by_text("Settings", exact=True).first).to_be_visible()
    expect(page.get_by_text("App Info")).to_be_visible()
    expect(page.get_by_text("Privacy", exact=True)).to_be_visible()
    expect(page.get_by_text("Share analytics with Opentrons")).to_be_visible()


@pytest.mark.pdE2E
def test_navigate_to_create_new_directly(page: Page, pd_base_url: str) -> None:
    """Test direct navigation to create new protocol page via URL.

    Cypress notes: directly navigating sends you back to the home page.
    This test verifies cy.verifyOnboardingPage() behavior.
    """
    # Protocol Designer uses hash routing
    create_new_url = _build_hash_url(pd_base_url, "createNew")
    page.goto(create_new_url)

    # Directly navigating to createNew shows the onboarding/create new page
    # Verify onboarding page elements (privacy policy, EULA)
    # Use first() to handle multiple privacy policy links
    expect(page.locator('a[href="https://opentrons.com/privacy-policy"]').first).to_be_visible()
    expect(page.locator('a[href="https://opentrons.com/eula"]').first).to_be_visible()


@pytest.mark.pdE2E
def test_navigate_to_overview_directly(page: Page, pd_base_url: str) -> None:
    """Test direct navigation to protocol overview page via URL.

    Cypress notes: directly navigating sends you back to the home page.
    This test verifies cy.verifyHomePage() behavior.
    """
    # Protocol Designer uses hash routing
    overview_url = _build_hash_url(pd_base_url, "overview")
    page.goto(overview_url)

    # Dismiss welcome modal if this test runs before any onboarding flow clears it
    confirm_button = page.get_by_role("button", name="Confirm")
    if confirm_button.count() > 0:
        confirm_button.click()
        release_notes_toast = page.get_by_text("updated Protocol Designer", exact=False)
        if release_notes_toast.count() > 0:
            close_icon = page.get_by_label("close_icon")
            if close_icon.count() > 0:
                close_icon.first.click()
            else:
                page.keyboard.press("Escape")

    # Directly navigating to overview redirects to home page
    # Verify home page elements - use first() for elements that appear multiple times
    expect(page.get_by_text("Welcome to Protocol Designer!")).to_be_visible()
    expect(page.locator('a[href="https://opentrons.com/privacy-policy"]').first).to_be_visible()
    expect(page.locator('a[href="https://opentrons.com/eula"]').first).to_be_visible()
    expect(page.get_by_role("button", name="Create a Flex protocol")).to_be_visible()
