"""Test OT-2 protocol creation workflow."""

import pytest
from playwright.sync_api import Page, expect


@pytest.mark.pdE2E
def test_ot2_robot_selection_and_96_channel_visibility(page: Page, base_url: str) -> None:
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
    page.get_by_role("button", name="Create a protocol").click()

    # Step 1: Verify we're on Step 1
    expect(page.get_by_text("Step 1")).to_be_visible()
    expect(page.get_by_text("What kind of robot do you have?")).to_be_visible()

    # Verify Opentrons Flex is visible (it's selected by default)
    expect(page.locator("label", has_text="Opentrons Flex")).to_be_visible()

    # Select OT-2
    page.locator("label", has_text="Opentrons OT-2").click()
    page.wait_for_timeout(300)

    # Switch back to Flex
    page.locator("label", has_text="Opentrons Flex").click()
    page.wait_for_timeout(300)

    # Now we should see "Add a pipette" prompt for Flex
    expect(page.get_by_text("Add a pipette")).to_be_visible()

    # For Flex: Click "Add a pipette" to see available options
    page.get_by_text("Add a pipette").click()

    # Verify 96-Channel option is visible for Flex
    expect(page.get_by_text("96-Channel")).to_be_visible()

    # Close the pipette selector modal by clicking Cancel
    page.get_by_role("button", name="Cancel").click()
    page.wait_for_timeout(300)

    # Verify the modal is closed
    expect(page.get_by_text("Pipette type")).not_to_be_visible()

    # Now switch to OT-2 to verify 96-Channel is not available
    page.locator("label", has_text="Opentrons OT-2").click()
    page.wait_for_timeout(300)

    # For OT-2: Verify "Add a pipette" button is still there
    expect(page.get_by_text("Add a pipette")).to_be_visible()

    # Click "Add a pipette" to open the selector for OT-2
    page.get_by_text("Add a pipette").click()

    # Verify 96-Channel option is NOT visible for OT-2 (only 1-Channel and 8-Channel should be there)
    expect(page.get_by_text("1-Channel")).to_be_visible()
    expect(page.get_by_text("8-Channel")).to_be_visible()
    expect(page.get_by_text("96-Channel")).not_to_be_visible()
