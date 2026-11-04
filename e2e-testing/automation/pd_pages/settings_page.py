"""Module for Protocol Designer settings page interactions."""

from playwright.sync_api import Locator, Page, expect

from automation.base_page import BasePage


class SettingsPage(BasePage):
    """Page object for Protocol Designer settings page."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def navigate_to_settings(self) -> None:
        """Navigate to settings page via clicking Settings button."""
        # Cypress: cy.getByTestId('SettingsIconButton').click()
        self.page.get_by_label("Settings Icon Button").click()

    def wait_for_settings_page(self) -> None:
        """Wait for settings page to load.

        Verifies settings page elements (matches cy.verifySettingsPage()).
        """
        expect(self.page.get_by_text("Settings", exact=True).first).to_be_visible()
        expect(self.page.get_by_text("App Info")).to_be_visible()
        expect(self.page.get_by_text("Privacy", exact=True)).to_be_visible()
        expect(self.page.get_by_text("Share analytics with Opentrons")).to_be_visible()

    def get_toggle_by_label(self, label: str) -> Locator:
        """Get toggle switch element by its aria-label.

        Cypress uses: cy.getByAriaLabel('Settings_<name>')

        Args:
            label: The aria-label of the toggle switch (e.g., "Settings_Privacy").

        Returns:
            The toggle switch locator.
        """
        return self.page.locator(f'[aria-label="{label}"]')

    def is_toggle_checked(self, label: str) -> bool:
        """Check if a toggle switch is checked.

        Cypress checks: .should('have.attr', 'aria-checked', 'true')
        Or checks for path[aria-roledescription="ot-toggle-input-on"]

        Args:
            label: The aria-label of the toggle switch.

        Returns:
            True if checked, False otherwise.
        """
        toggle = self.get_toggle_by_label(label)
        # Check if toggle has "on" indicator
        on_indicator = toggle.locator('path[aria-roledescription="ot-toggle-input-on"]')
        return on_indicator.count() > 0

    def click_toggle(self, label: str) -> None:
        """Click a toggle switch by its aria-label.

        Args:
            label: The aria-label of the toggle switch.
        """
        toggle = self.get_toggle_by_label(label)
        toggle.click()

    def toggle_setting(self, label: str, enable: bool) -> None:
        """Set a toggle to a specific state.

        Args:
            label: The aria-label of the toggle switch.
            enable: True to enable, False to disable.
        """
        current_state = self.is_toggle_checked(label)
        if current_state != enable:
            self.click_toggle(label)

    def navigate_to_home(self) -> None:
        """Navigate back to home page.

        Cypress uses: cy.visit('/') to navigate home.
        """
        # Navigate to home via URL (Cypress uses cy.visit('/'))
        # Extract base URL from current URL
        current_url = self.page.url
        base_url = current_url.split("/#")[0] if "/#" in current_url else current_url.split("?")[0]
        self.page.goto(base_url)

    def verify_toggle_state(self, label: str, expected_state: bool) -> None:
        """Verify a toggle is in the expected state.

        Args:
            label: The aria-label of the toggle switch.
            expected_state: True if should be checked (on), False otherwise (off).
        """
        toggle = self.get_toggle_by_label(label)
        if expected_state:
            # Should have "on" indicator
            expect(toggle.locator('path[aria-roledescription="ot-toggle-input-on"]')).to_be_visible()
        else:
            # Should have "off" indicator
            expect(toggle.locator('path[aria-roledescription="ot-toggle-input-off"]')).to_be_visible()
