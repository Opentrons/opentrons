"""Test manual and gripper move functionality."""
"""Tests covering the Mix step workflow in Protocol Designer."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage, ProtocolEditorPage

PROTOCOL_PATH = "fixtures/protocol/9/PD_Move_Lids_Setup.py"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_move_labware_flex(page: Page, base_url: str) -> None:
    """Test manual and gripper move functionality with Lids and Labware.
    
    This test tests moving labware using the gripper and manual moves for the flex:
    1. Import protocol with labware and lids on deck
    2. Add manual move step to move Opentrons Tough PCR Auto-Sealing Lid from the Deck to the Thermocycler
    3. Add gripper move step to move Opentrons Tough Universal Lid from the Deck to the Waste Chute
    4. Add manual move step to move the Opentrons Tough Universal Lid from the Deck to off-deck
    5. Add manual move step to move the Opentrons Tough Universal Lid from off-deck to the Temperature Module
    6. Add gripper move step to move the Opentrons Tough Universal Lid from the Temperature Module to the Deck
    7. Add gripper move step to move the Opentrons Tough Universal Lid from the Deck to the Waste Chute
    8. Add manual move step to move the Opentrons Tough PCR Plate from the Temperature Module to off-deck
    9. Add gripper move step to move the Opentrons Tough 12 Well Reservoir from the Deck to the Waste Chute
    10. Save protocol

    """
    # Import setup protocol and open editor
    _import_protocol_and_open_editor(page)

    editor = ProtocolEditorPage(page)

    # Add Manual Move to move PCR Lid to Opentrons Tough Wellplate in Thermocycler
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")

    page.locator("#stepFormTools svg").first.click()
    editor.move_labware("A3 Opentrons Tough PCR Auto-Sealing Lid", "B1 Opentrons Tough 96 Well")
    # page.get_by_role("button", name="A3 Opentrons Tough PCR Auto-").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.get_by_role("button", name="B1 Opentrons Tough 96 Well").click()
    page.get_by_role("button", name="Save").click()

    # Add Manual Move to move PCR Lid to Deck
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.toggle_checkbox("Use gripper")
    page.get_by_test_id("dropdownMenu").first.click()
    page.get_by_role("button", name="A1+B1 Opentrons Tough PCR").click()
    page.get_by_test_id("dropdownMenu").nth(1).click()
    page.get_by_role("button", name="A3").click()
    page.get_by_role("button", name="Save").click()
    page.locator("div").filter(has_text="Move has been saved").nth(3).click()

    # # Add Gripper Move to move PCR Lid to Waste Chute
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="A3 Opentrons Tough PCR Auto-").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.get_by_role("button", name="D3 Waste Chute in D3").click()
    # page.get_by_role("button", name="Save").click()
    # page.get_by_role("button", name="Confirm").click()

    # # Add Manual Move to move Universal Lid to off-deck
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # editor.toggle_checkbox("Use gripper")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="B2 Opentrons Tough Universal").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.locator("#stepFormTools").get_by_role("button", name="Off-deck").click()
    # page.get_by_role("button", name="Save").click()
    # page.locator("div").filter(has_text="Move has been saved").nth(3).click()

    # # Add Manual Move to move Universal Lid to Temperature Module
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # page.get_by_test_id("dropdownMenu").first.click()
    # editor.toggle_checkbox("Use gripper")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="offDeck Opentrons Tough").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.get_by_role("button", name="D1 Opentrons Tough 96 Well").click()
    # page.get_by_role("button", name="Save").click()

    # # Add Gripper Move to move Universal Lid to Universal Lid Stack
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="D1 Opentrons Tough Universal").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.get_by_role("button", name="B2 Opentrons Tough Universal").click()
    # page.get_by_role("button", name="Save").click()
    # page.locator("div").filter(has_text="Move has been saved").nth(3).click()

    # # Add Gripper Move to move Universal Lid to Waste Chute
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="B2 Opentrons Tough Universal").click()
    # page.get_by_text("Choose option").click()
    # page.get_by_role("button", name="D3 Waste Chute in D3").click()
    # page.get_by_role("button", name="Save").click()

    # # Add Gripper Move to move PCR Plate on Temperature Module to Waste Chute
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="D1 Opentrons Tough 96 Well").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.get_by_role("button", name="D3 Waste Chute in D3").click()
    # page.get_by_role("button", name="Save").click()
    # page.locator("div").filter(has_text="Move has been saved").nth(3).click()

    # # Add Manual Move to move 12 Well Reservoir to Off-deck
    # editor.open_add_step_menu()
    # editor.verify_add_step_menu_options()
    # editor.select_step_type("Move")
    # editor.toggle_checkbox("Use gripper")
    # page.get_by_test_id("dropdownMenu").first.click()
    # page.get_by_role("button", name="D2 Opentrons Tough 22mL 12").click()
    # page.get_by_test_id("dropdownMenu").nth(1).click()
    # page.locator("#stepFormTools").get_by_role("button", name="Off-deck").click()
    # page.get_by_role("button", name="Save").click()


###########################################################################

def _import_protocol_and_open_editor(page: Page) -> ProtocolEditorPage:
    """Shared setup helper used by both tests."""

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(PROTOCOL_PATH)

    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)
    _dismiss_migration_modal(page)

    page.get_by_role("button", name="Edit protocol").click()
    expect(page.get_by_role("button", name="Add Step")).to_be_visible(timeout=5000)
    return ProtocolEditorPage(page)


def _dismiss_migration_modal(page: Page) -> None:
    """Dismiss the migration modal if it appears during import."""

    overlay = page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
    if overlay.is_visible():
        page.get_by_role("button", name="Import", exact=True).click()
        expect(overlay).not_to_be_visible()
