"""Landing page for Protocol Designer."""

from playwright.sync_api import Page, expect

from .base_page import BasePage


class LandingPage(BasePage):
    """Landing page with main entry point to create protocols."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def wait_for_page_load(self) -> None:
        """Wait for the landing page to load."""
        expect(self.page.get_by_test_id("basic_button_Create new")).to_be_visible(timeout=5000)

    def confirm_welcome_modal(self) -> None:
        """Click the Confirm button on welcome modal if present."""
        self.click_button("Confirm")
        expect(self.page.get_by_role("button", name="View release notes")).to_be_visible(timeout=5000)

    def click_create_protocol(self) -> None:
        """Click the 'Create a protocol' button."""
        self.click_button("Create a protocol")
