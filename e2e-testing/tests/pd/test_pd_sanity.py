"""Sanity tests for Protocol Designer - Full onboarding flow."""

# Import page objects
import sys
from pathlib import Path

import pytest
from playwright.sync_api import Page

from eyes import Eyes

sys.path.insert(0, str(Path(__file__).parent.parent))

from automation.pd_pages import (
    DeckConfigPage,
    LandingPage,
    ModuleConfigPage,
    PipetteModal,
    ProtocolEditorPage,
    TransferPage,
)
from automation.pd_pages.plate_reader_page import PlateReaderPage


@pytest.mark.pdE2E
def test_protocol_designer_loads(page: Page, pd_base_url: str) -> None:
    """Test that Protocol Designer loads successfully."""
    landing_page = LandingPage(page)
    landing_page.wait_for_page_load()

    print(f"✓ Protocol Designer loaded successfully at {pd_base_url}")


@pytest.mark.pdE2E
@pytest.mark.slow
def test_full_onboarding_flow(page: Page, pd_base_url: str, eyes: Eyes | None) -> None:
    """Full onboarding flow test using page objects."""
    print(f"Running full onboarding test against: {pd_base_url}")

    # Landing Page
    landing_page = LandingPage(page)
    landing_page.goto(pd_base_url)
    landing_page.wait_for_page_load()
    print("✓ Main page loaded")

    landing_page.confirm_welcome_modal()
    landing_page.click_create_protocol()
    if eyes is not None:
        eyes.check_window("Flex landing page after create protocol")
    # Pipette Configuration
    pipette_modal = PipetteModal(page)
    pipette_modal.open_pipette_selector()
    print("✓ Pipette selection modal opened")

    pipette_modal.select_pipette_type("1-Channel", "1000 µL")
    pipette_modal.select_tip_racks(["Filter Tip Rack 1000 µL", "Filter Tip Rack 200 µL", "Filter Tip Rack 50 µL"])
    pipette_modal.save_pipette_selection()
    if eyes is not None:
        eyes.check(
            checkpoint_name="Pipette Configuration Saved",
            target=eyes.Target.window().fully(),
        )
    # Basics configuration (pipette + gripper)
    module_config = ModuleConfigPage(page)
    module_config.select_gripper(True)
    print("✓ Pipette and gripper configured")

    module_config.confirm_module_selection()

    # Deck Configuration
    deck_config = DeckConfigPage(page)
    deck_config.configure_initial_deck_hardware(tc=True, waste_chute=True)

    # Add Heater-Shaker to C1
    deck_config.select_slot("C1")
    deck_config.select_module("Heater-Shaker Module GEN1")

    # Add Temperature Module to D1
    deck_config.select_slot("D1")
    deck_config.select_module("Temperature Module GEN2")
    # Add Plate Reader to B3
    plate_reader_page = PlateReaderPage(page)
    plate_reader_page.configure_module("B3", "Absorbance Plate Reader Module GEN1")

    # Add Staging Area on D3 cutout (fakeD4)
    if deck_config.is_sandbox:
        deck_config.select_slot("cutoutC3")
    else:
        deck_config.select_slot("fakeD4")
    deck_config.select_fixture("Staging Area Slot")
    print("✓ Deck configured with modules and fixtures")

    deck_config.confirm_deck_configuration()
    deck_config.name_protocol("Protocol Onboarding Demonstration")
    if eyes is not None:
        eyes.check(
            checkpoint_name="Deck Configuration Complete with HS, TD, Stacker, Plate Reader",
            target=eyes.Target.window().fully(),
        )
    deck_config.enter_edit_mode()
    print("✓ Protocol named and entered edit mode")

    # Protocol Editor - Add Labware and Liquid
    editor = ProtocolEditorPage(page)
    editor.add_labware_to_slot("D2")
    editor.select_labware_category(2)
    labware_on_deck = "Axygen 96 Well Plate 500 µL"
    editor.select_labware_by_name(labware_on_deck)
    editor.edit_liquid()
    editor.select_first_well()
    editor.define_liquid("Water")
    editor.assign_liquid_to_wells("Water", "400")
    editor.confirm_liquid_setup()
    print("✓ Labware added and liquid configured")

    # Add Transfer Step
    editor.confirm_liquid_setup()  # Close labware setup
    editor.add_step("Transfer")
    transfer_page = TransferPage(page)
    transfer_page.destination_labware_select(labware_on_deck)
    transfer_page.open_nozzle_and_well_selector()
    transfer_page.select_nozzles()
    transfer_page.wells_select(location="Source", labwareName=labware_on_deck, wells=["A1"], finalStep=False)
    transfer_page.wells_select(location="Destination", labwareName=labware_on_deck, wells=["A2"], finalStep=True)
    transfer_page.pipette_path_select("Single transfer")
    transfer_page.input_volume("100")
    print("✓ Transfer step configured")
