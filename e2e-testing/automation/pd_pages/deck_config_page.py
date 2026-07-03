"""Deck configuration page object."""

from typing import List, Literal, Union

from playwright.sync_api import Page, TimeoutError

from automation.base_page import BasePage


class DeckConfigPage(BasePage):
    """Page for configuring the deck with modules and fixtures."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    OT2ModuleName = Literal[
        "Temperature Module GEN1",
        "Temperature Module GEN2",
        "Heater-Shaker Module GEN1",
        "Magnetic Module GEN1",
        "Magnetic Module GEN2",
        "Thermocycler Module GEN1",
        "Thermocycler Module GEN2",
    ]

    def ot2_module_selection(self, module_name: Union[str, List[str]]) -> None:
        """Select one or more OT-2 modules from the module list.
        Args:
            module_name: A single module name or a list of names.
                         Supported: "Temperature Module GEN1", "Magnetic Module GEN2", etc.
        """
        # Ensure we are working with a list
        modules_to_click = [module_name] if isinstance(module_name, str) else module_name
        for module in modules_to_click:
            self.page.get_by_text(module, exact=True).first.click(force=True)

    def expect_module_overview(self) -> None:
        """Validate Step 4 deck hardware content is visible."""

        self.wait_for_visible(self.page.get_by_text("Configure your deck hardware", exact=False).first)
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
            if slot == "A4" or slot == "B4" or slot == "C4" or slot == "D4":
                slot_name = f"fake{slot}"
                self.page.get_by_test_id(slot_name).click()
            else:
                self.page.get_by_test_id(slot).click()

    def select_module(self, module_name: str) -> None:
        """Select a module from the module list.

        Args:
            module_name: Name of the module, e.g., "Heater-Shaker Module GEN1"
        """
        modules_button = self.page.locator("button[data-testid='Modules']")
        try:
            modules_button.first.wait_for(state="visible", timeout=5000)
            modules_button.first.click()
        except TimeoutError:
            pass

        module_label = self.page.get_by_text(module_name, exact=False)
        self.wait_for_visible(module_label.first, timeout=10000)
        module_button = self.page.get_by_test_id(module_name)
        self.wait_for_visible(module_button.first)
        module_button.first.click(force=True)

    def select_fixture(self, fixture_name: str) -> None:
        """Select a fixture from the fixture list.

        Args:
            fixture_name: Name of the fixture
        """

        self.page.get_by_test_id("Fixtures").click()
        self.page.get_by_test_id(fixture_name).click()

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

    def remove_fixture(self, fixture_name: str) -> None:
        """Remove a fixture from the deck.

        Args:
            fixture_name: Name of the fixture to remove
        """
        self.page.get_by_role("button", name=fixture_name).click()

    def add_waste_chute(self) -> None:
        """Add a waste chute fixture at cutout D3."""
        self.select_slot("D3")
        fixtures_option = self.page.get_by_test_id("Fixtures")
        self.wait_for_visible(fixtures_option.first)
        fixtures_option.first.click()

        waste_chute_entry = self.page.get_by_test_id("Waste chute")
        if waste_chute_entry.count() > 0:
            self.wait_for_visible(waste_chute_entry.first)
            waste_chute_entry.first.click()

        waste_chute_fixture = self.page.get_by_test_id("Waste Chute")
        self.wait_for_visible(waste_chute_fixture.first)
        waste_chute_fixture.first.click()

    def configure_initial_deck_hardware(self, *, tc: bool, waste_chute: bool) -> None:
        """Configure thermocycler and waste chute on the onboarding deck step.

        Args:
            tc: When True, add a Thermocycler Module GEN2 at B1.
            waste_chute: When True, remove the default trash bin and add a waste chute at D3.
        """
        self.expect_module_overview()

        if waste_chute:
            self.remove_fixture("Trash bin")
            self.add_waste_chute()

        if tc:
            self.select_slot("B1")
            self.select_module("Thermocycler Module GEN2")
