"""Sanity tests for Protocol Designer - Full onboarding flow."""

# Import page objects
import sys
from pathlib import Path

import pytest
from playwright.sync_api import Page

sys.path.insert(0, str(Path(__file__).parent.parent))

from automation.pd_pages import (
    DeckConfigPage,
    LandingPage,
    ModuleConfigPage,
    PipetteModal,
    ProtocolEditorPage,
)


@pytest.mark.pdE2E
def test_protocol_designer_loads(page: Page, base_url: str) -> None:
    """Test that Protocol Designer loads successfully."""
    landing_page = LandingPage(page)
    landing_page.wait_for_page_load()

    print(f"✓ Protocol Designer loaded successfully at {base_url}")


@pytest.mark.pdE2E
@pytest.mark.slow
def test_full_onboarding_flow(page: Page, base_url: str) -> None:
    """Full onboarding flow test using page objects."""
    print(f"Running full onboarding test against: {base_url}")

    # Landing Page
    landing_page = LandingPage(page)
    landing_page.goto(base_url)
    landing_page.wait_for_page_load()
    print("✓ Main page loaded")

    landing_page.confirm_welcome_modal()
    landing_page.click_create_protocol()

    # Pipette Configuration
    pipette_modal = PipetteModal(page)
    pipette_modal.open_pipette_selector()
    print("✓ Pipette selection modal opened")

    pipette_modal.select_pipette_type("1-Channel", "1000 µL")
    pipette_modal.select_tip_racks(["Filter Tip Rack 1000 µL", "Filter Tip Rack 200 µL", "Filter Tip Rack 50 µL"])
    pipette_modal.save_pipette_selection()

    # Module Configuration
    module_config = ModuleConfigPage(page)
    module_config.select_gripper(True)
    module_config.select_thermocycler(True)
    module_config.select_waste_chute(True)
    print("✓ Pipette and modules configured")

    module_config.confirm_module_selection()

    # Deck Configuration
    deck_config = DeckConfigPage(page)

    # Add Heater-Shaker to C1
    deck_config.select_slot("C1")
    deck_config.select_module("Heater-Shaker Module GEN1")

    # Add Temperature Module to D1
    deck_config.select_slot("D1")
    deck_config.select_module("Temperature Module GEN2")

    # Add Staging Area to C3/fakeD4
    if deck_config.is_sandbox:
        deck_config.select_slot("cutoutC3")
    else:
        deck_config.select_slot("fakeD4")
    deck_config.select_fixture("Staging Area Slot")
    print("✓ Deck configured with modules and fixtures")

    deck_config.confirm_deck_configuration()
    deck_config.name_protocol("Protocol Onboarding Demonstration")
    deck_config.enter_edit_mode()
    print("✓ Protocol named and entered edit mode")

    # Protocol Editor - Add Labware and Liquid
    editor = ProtocolEditorPage(page)
    editor.add_labware_to_slot("D2")
    editor.select_labware_category(2)
    editor.select_labware_by_name("Axygen 96 Well Plate 500 µL")

    editor.edit_liquid()
    editor.select_first_well()
    editor.define_liquid("Water")
    editor.assign_liquid_to_wells("Water", "400")
    editor.confirm_liquid_setup()
    print("✓ Labware added and liquid configured")

    # Add Transfer Step
    editor.confirm_liquid_setup()  # Close labware setup
    editor.add_step("Transfer")
    editor.configure_transfer_source()
    editor.configure_transfer_destination("Axygen 96 Well Plate 500 µL", 17)
    editor.set_transfer_volume("100")
    print("✓ Transfer step configured")

    print("\n✅ Full onboarding flow completed successfully!")
