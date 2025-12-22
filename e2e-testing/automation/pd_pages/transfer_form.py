"""Protocol editor page object."""

import re
from typing import Sequence

from playwright.sync_api import Page, TimeoutError, expect

from .base_page import BasePage


class TransferPage(BasePage):
    """Main protocol editor page for adding labware and steps."""

    def __init__(self, page: Page) -> None:
        super().__init__(page)

def configure_transfer_source(self) -> None:
    """Configure the source for a transfer step."""
    self.page.locator('input[name="aspirate_wells"]').click()
    self.page.locator("circle").first.click()
    self.click_button("Save")

def configure_transfer_destination(self, labware_name: str | None = None, well_index: int = 17) -> None:
    """Configure the destination for a transfer step.

    Args:
        labware_name: Name of destination labware (if needed for sandbox)
        well_index: Index of the destination well
    """
    if self.is_sandbox and labware_name:
        self.page.get_by_text("Choose option").click()
        self.click_button(labware_name)

    # Select dispense wells
    if self.is_sandbox:
        self.page.locator('input[name="dispense_wells"]').click()
    else:
        self.page.locator("[name='dispense_wells']").click()

    self.page.locator(f"circle:nth-child({well_index})").first.click()
    self.click_button("Save")

def set_transfer_volume(self, volume: str) -> None:
    """Set the volume for a transfer step.

    Args:
        volume: Volume in µL as a string
    """
    self.page.locator('input[name="volume"]').click()
    self.page.locator('input[name="volume"]').fill(volume)
    self.click_button("Continue")
    self.click_button("Continue")

def expect_transfer_form(self) -> None:
    """Verify the transfer step form fields are visible."""

    for text in [
        "Source labware",
        "Select source wells",
        "Destination labware",
        "Volume per well",
    ]:
        self.wait_for_visible(self.page.get_by_text(text, exact=False).first)
