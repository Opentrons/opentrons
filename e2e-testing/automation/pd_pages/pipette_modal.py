"""Pipette configuration modal page object."""

from playwright.sync_api import Page, expect

from automation.base_page import BasePage


class PipetteModal(BasePage):
    """Modal for selecting and configuring pipettes."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

    def wait_for_modal_open(self) -> None:
        """Wait for the pipette selection modal to open."""
        expect(self.page.get_by_test_id("Modal_header")).to_be_visible(timeout=5000)

    def open_pipette_selector(self) -> None:
        """Open the pipette selector."""
        self.click_test_id("EmptySelectorButton_click")
        self.wait_for_modal_open()

    def select_pipette_type(self, channels: str, volume: str) -> None:
        """Select pipette by channels and volume.

        Args:
            channels: e.g., "1-Channel", "8-Channel"
            volume: e.g., "1000 µL", "300 µL"
        """
        self.page.get_by_text(channels).click()
        self.page.get_by_text(volume).click()

    def ot2_select_pipette_type(self, channels: str, gen: str, volume: str) -> None:
        """Select pipette for OT-2 by channels and volume.

        Args:
            channels: e.g., "1-Channel", "8-Channel"
            gen: e.g., "GEN1", "GEN2"
            volume: e.g., "1000 µL", "300 µL"
        """
        self.page.get_by_text(channels).click()
        self.page.get_by_text(gen).click()
        self.page.get_by_text(volume).click()

    def select_tip_racks(self, tip_racks: list[str]) -> None:
        """Select multiple tip racks by their names.

        Args:
            tip_racks: List of tip rack names, e.g., ["Filter Tip Rack 1000 µL"]
        """
        for tip_rack in tip_racks:
            self.click_checkbox_label(tip_rack)

    def save_pipette_selection(self) -> None:
        """Save the pipette configuration."""
        self.click_button("Save")
        expect(self.page.get_by_role("button", name="Swap pipette mounts")).to_be_visible(timeout=5000)
