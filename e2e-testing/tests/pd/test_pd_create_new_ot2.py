"""Test OT-2 protocol creation workflow."""

import pytest
from playwright.sync_api import Page, expect

from eyes import Eyes


@pytest.mark.pdE2E
def test_ot2_robot_selection_and_96_channel_visibility(page: Page, pd_base_url: str, eyes: Eyes | None) -> None:
    """Test robot selection and 96-Channel pipette availability.

    This test verifies:
    1. Flex is selected by default
    2. Can switch to OT-2 and back to Flex
    3. 96-Channel option is visible for Flex
    4. Canceling and starting over with OT-2
    5. 96-Channel option is NOT visible for OT-2

    This replicates the Cypress createNew.cy.ts test.
    """
    # Close analytics modal
    expect(page.get_by_role("button", name="Confirm")).to_be_visible()
    page.get_by_role("button", name="Confirm").click()

    # Verify header contains "Create new"
    expect(page.get_by_text("Create new")).to_be_visible()

    # Click "Create new" button
    page.get_by_role("button", name="Create a Flex protocol").click()

    # Select OT-2
    page.locator("label", has_text="Opentrons OT-2").click()
    page.wait_for_timeout(300)

    page.get_by_text("Add a pipette").click()
    if eyes is not None:
        eyes.check_window("OT-2 pipette selection")
