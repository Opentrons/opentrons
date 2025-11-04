"""Tests covering the transfer step workflow in Protocol Designer.

Ports `transferSettings.cy.ts` from the Cypress suite to Playwright.
"""

from __future__ import annotations

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    CreateProtocolWizard,
    DeckConfigPage,
    LandingPage,
    ModuleConfigPage,
    PipetteModal,
    ProtocolEditorPage,
)

LIQUID_NAME = "My liquid!"
LABWARE_NAME = "Bio-Rad 96 Well Plate"


@pytest.mark.slow
def test_transfer_step_single_channel_workflow(page: Page, base_url: str) -> None:
    """Replicate the Cypress transferSettings single-channel test using Playwright."""

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_create_protocol()

    wizard = CreateProtocolWizard(page)
    wizard.wait_for_step(1)
    wizard.select_robot("Opentrons Flex")
    wizard.expect_robot_selected("Opentrons Flex")
    wizard.select_robot("Opentrons OT-2")
    wizard.expect_robot_selected("Opentrons OT-2")
    wizard.select_robot("Opentrons Flex")
    wizard.expect_add_pipette_prompt()
    wizard.click_add_pipette()

    pipette_modal = PipetteModal(page)
    pipette_modal.wait_for_modal_open()
    pipette_modal.select_pipette_type("1-Channel", "50 µL")
    pipette_modal.select_tip_racks(["Tip Rack 50 µL"])
    pipette_modal.save_pipette_selection()

    wizard.expect_pipette_summary("Flex 1-Channel 50 µL", "Opentrons Flex 96 Tip Rack 50 µL")
    wizard.expect_gripper_question()

    module_config = ModuleConfigPage(page)
    module_config.select_gripper(True)
    module_config.select_thermocycler(False)
    module_config.select_waste_chute(False)
    module_config.confirm_module_selection()

    deck = DeckConfigPage(page)
    deck.expect_module_overview()
    deck.select_slot("B1")
    deck.select_module("Thermocycler Module GEN2")
    deck.select_slot("D1")
    deck.select_module("Heater-Shaker Module GEN1")
    deck.select_slot("B2")
    deck.select_module("Magnetic Block GEN1")
    deck.select_slot("C1")
    deck.select_module("Temperature Module GEN2")
    deck.confirm_deck_configuration()
    deck.confirm_deck_configuration()
    deck.enter_edit_mode()

    editor = ProtocolEditorPage(page)

    editor.add_labware_to_slot("C2")
    editor.select_labware_by_name(LABWARE_NAME)
    editor.confirm_toolbox()

    editor.open_slot_tools("C2")
    editor.click_add_liquid_button()
    editor.open_liquid_tab()
    editor.expect_liquid_panel()
    editor.define_liquid(LIQUID_NAME)
    editor.select_wells(["A1", "A2"])
    editor.assign_liquid_to_wells(LIQUID_NAME, "150")
    editor.confirm_toolbox()
    editor.close_toolbox()

    editor.add_labware_to_slot("C3")
    editor.select_labware_by_name(LABWARE_NAME)
    editor.confirm_toolbox()
    editor.close_toolbox()

    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Transfer")
    editor.expect_transfer_form()
