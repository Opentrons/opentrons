"""Test Protocol Designer settings page functionality.

Ports tests from protocol-designer/cypress/e2e/settings.cy.ts.
"""

import pytest
from playwright.sync_api import Page

from automation.pd_pages import LandingPage
from automation.pd_pages.settings_page import SettingsPage


@pytest.mark.slow
def test_settings_toggle_persistence(page: Page, base_url: str) -> None:
    """Test that settings toggles persist across navigation.

    This test verifies that:
    1. Settings page loads correctly
    2. Toggle switches can be changed
    3. Toggle states persist when navigating away and back
    """
    # Start on home page
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()

    # Navigate to settings
    settings = SettingsPage(page)
    settings.navigate_to_settings()
    settings.wait_for_settings_page()

    # Test various toggle switches
    # These are the aria-labels from Cypress test suite
    # From: protocol-designer/cypress/e2e/settings.cy.ts
    toggles_to_test = [
        "Settings_Privacy",  # Share sessions with Opentrons toggle
        "Settings_OT_PD_ENABLE_HOT_KEYS_DISPLAY",  # Timeline editing tips
    ]

    # Get initial states
    initial_states = {}
    for toggle_label in toggles_to_test:
        initial_states[toggle_label] = settings.is_toggle_checked(toggle_label)

    # Toggle each setting to opposite state
    for toggle_label in toggles_to_test:
        settings.click_toggle(toggle_label)

    # Verify toggles are in opposite state
    for toggle_label in toggles_to_test:
        expected_state = not initial_states[toggle_label]
        settings.verify_toggle_state(toggle_label, expected_state)

    # Navigate away to home
    settings.navigate_to_home()
    landing.wait_for_page_load()

    # Navigate back to settings
    settings.navigate_to_settings()
    settings.wait_for_settings_page()

    # Verify toggles maintained their new state (persistence)
    for toggle_label in toggles_to_test:
        expected_state = not initial_states[toggle_label]
        settings.verify_toggle_state(toggle_label, expected_state)

    # Toggle back to original states (cleanup)
    for toggle_label in toggles_to_test:
        settings.click_toggle(toggle_label)

    # Verify back to original states
    for toggle_label in toggles_to_test:
        settings.verify_toggle_state(toggle_label, initial_states[toggle_label])
