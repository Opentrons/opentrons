"""Test manual and gripper move functionality."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages import ProtocolEditorPage
from utility import import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/9/PD_Move_Lids_Setup.py"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_move_labware_flex(page: Page, pd_base_url: str) -> None:
    """Test manual and gripper move functionality with Lids and Labware.

    This test tests moving labware using the gripper and manual moves for the flex:
    1. Import protocol with labware and lids on deck
    2. Add manual move step to move Opentrons Tough PCR Auto-Sealing Lid from the Deck to the Thermocycler
    3. Add manual move step to move Opentrons Tough PCR Auto-Sealing Lid from the Thermocycler to the Deck
    4. Add gripper move step to move Opentrons Tough PCR Auto-Sealing Lid from the Deck to the Waste Chute
    5. Add manual move step to move the Opentrons Tough Universal Lid from the Deck to off-deck
    6. Add manual move step to move the Opentrons Tough Universal Lid from off-deck to the Temperature Module
    7. Add gripper move step to move the Opentrons Tough Universal Lid from the Temperature Module to the Lid Stack
    8. Add gripper move step to move the Opentrons Tough Universal Lid from the Deck to the Waste Chute
    9. Add manual move step to move the Opentrons Tough PCR Plate from the Temperature Module to the Waste Chute
    10. Add gripper move step to move the Opentrons Tough 12 Well Reservoir from the Deck to Off-deck

    Future work:
    - Made test for OT2 (only manual moves)
    """
    # Import setup protocol and open editor
    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)

    editor = ProtocolEditorPage(page)

    # Add Manual Move to move PCR Lid to Opentrons Tough Wellplate in Thermocycler
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.expect_move_labware_form()
    editor.toggle_checkbox("Use gripper")

    ####NOTE: playwright is having trouble finding the new location labware when using it's full name
    editor.move_labware("A3 Opentrons Tough PCR Auto-Sealing Lid", "B1 Opentrons Tough 96 Well")

    # Add Manual Move to move PCR Lid to Deck
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.toggle_checkbox("Use gripper")
    editor.move_labware("A1+B1 Opentrons Tough PCR Auto-Sealing Lid", "A3")

    # Add Gripper Move to move PCR Lid to Waste Chute
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.move_labware("A3 Opentrons Tough PCR Auto-Sealing Lid", "D3 Waste Chute in D3")

    # Add Manual Move to move Universal Lid to off-deck
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.toggle_checkbox("Use gripper")
    editor.move_labware("B2 Opentrons Tough Universal Lid", "Off-deck")

    # Add Manual Move to move Universal Lid to Temperature Module
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.toggle_checkbox("Use gripper")

    ####NOTE: Offdeck is incorrect and likely a bug, but leaving for the purpose of running tests
    editor.move_labware("Offdeck Opentrons Tough Universal Lid", "D1 Opentrons Tough 96 Well")

    # Add Gripper Move to move Universal Lid to Universal Lid Stack
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.move_labware("D1 Opentrons Tough Universal Lid", "B2 Opentrons Tough Universal Lid")

    # Add Gripper Move to move Universal Lid to Waste Chute
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")

    editor.move_labware("B2 Opentrons Tough Universal Lid", "D3 Waste Chute in D3")

    # Add Gripper Move to move PCR Plate on Temperature Module to Waste Chute
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.move_labware("D1 Opentrons Tough 96 Well", "D3 Waste Chute in D3")

    # Add Manual Move to move 12 Well Reservoir to Off-deck
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Move")
    editor.toggle_checkbox("Use gripper")
    editor.move_labware("D2 Opentrons Tough 22mL 12 Well Reservoir", "Off-deck")
