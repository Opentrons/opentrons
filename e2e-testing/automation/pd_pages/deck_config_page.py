"""Deck configuration page object."""

from playwright.sync_api import Page

from .base_page import BasePage


class DeckConfigPage(BasePage):
    """Page for configuring the deck with modules and fixtures."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def expect_module_overview(self) -> None:
        """Validate Step 4 deck hardware content is visible."""

        self.wait_for_visible(
            self.page.get_by_text("Configure your deck hardware", exact=False).first
        )
        self.wait_for_visible(
            self.page.get_by_text(
                "Place the modules and fixtures that you are using for this protocol onto the deck.",
                exact=False,
            ).first
        )

    def select_slot(self, slot: str) -> None:
        """Select a deck slot.

        Args:
            slot: Slot identifier like "C1", "D1", "D2", etc.
                  For sandbox, use "cutoutC1", "cutoutD1", etc.
        """
        if self.is_sandbox and not slot.startswith("cutout"):
            # Convert regular slot to cutout format for sandbox
            selector = f"cutout{slot}"
            self.page.get_by_test_id(selector).nth(1).click()
        else:
            self.click_test_id(slot)

    def select_module(self, module_name: str) -> None:
        """Select a module from the module list.

        Args:
            module_name: Name of the module, e.g., "Heater-Shaker Module GEN1"
        """
        modules_tab = self.page.get_by_test_id("Modules")
        if modules_tab.count() > 0:
            modules_tab.first.click()

        module_button = self.page.get_by_test_id(module_name)
        if module_button.count() == 0:
            # Scroll item into view via its text if the button is virtualized.
            module_text = self.page.get_by_text(module_name, exact=False).first
            self.wait_for_visible(module_text)
            module_text.click()
            module_button = self.page.get_by_test_id(module_name)

        self.wait_for_visible(module_button.first)
        module_button.first.click()

    def select_fixture(self, fixture_name: str) -> None:
        """Select a fixture from the fixture list.

        Args:
            fixture_name: Name of the fixture
        """
        self.click_test_id("Fixtures")

        # Handle different fixture names between environments
        if self.is_sandbox and fixture_name == "Staging Area Slot":
            self.click_test_id("Staging area slot")
        else:
            self.click_test_id(fixture_name)

    def confirm_deck_configuration(self) -> None:
        """Confirm the deck configuration."""
        self.click_button("Confirm")

    def name_protocol(self, name: str) -> None:
        """Enter the protocol name."""
        self.page.locator('input[name="fields.name"]').click()
        self.page.locator('input[name="fields.name"]').fill(name)
        self.click_button("Confirm")

    def enter_edit_mode(self) -> None:
        """Click 'Edit protocol' to enter the protocol editor."""
        from playwright.sync_api import expect

        self.click_button("Edit protocol")
        expect(self.page.get_by_role("button", name="Back to overview")).to_be_visible(timeout=5000)
