"""Test Protocol Designer Vacuum Module deck configuration behavior."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages.create_protocol_wizard import CreateProtocolWizard
from automation.pd_pages.deck_config_page import DeckConfigPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from utility import create_new_protocol_from_landing_page

VACUUM_MODULE = "Vacuum Module GEN1"
VACUUM_DOCK = "vacuumModuleV1DockA4"
INCOMPATIBLE_LABWARE = "Bio-Rad 96 Well Plate 200 µL PCR"
COLLECTION_PLATE = "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
FILTER_PLATE = "Millipore 96 Well Plate 300µL"
SHORT_COLLAR = "Opentrons Vacuum Manifold Collar Short"
TALL_COLLAR = "Opentrons Vacuum Manifold Collar Tall"
SHORT_SPACER = "Opentrons Vacuum Manifold Spacer Short"
TALL_SPACER = "Opentrons Vacuum Manifold Spacer Tall"
UNIVERSAL_LID = "Opentrons Tough Universal Lid"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_vacuum_module_deck_configs(page: Page) -> None:
    """Validate Vacuum Module deck config with stackers, mag blocks, labware, and trash."""
    deck_config_page = DeckConfigPage(page)
    create_protocol = CreateProtocolWizard(page)
    protocol_editor = ProtocolEditorPage(page)

    create_new_protocol_from_landing_page(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)

    # Add a stacker on A4
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")

    # Add a magnetic block on B3 and A3
    deck_config_page.select_slot("B3")
    deck_config_page.select_module("Magnetic Block GEN1")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module("Magnetic Block GEN1")

    # Remove them //NOTE: NEED TO FIX THIS TEST
    # deck_config_page.remove_fixture("magneticBlockV1A3")
    # deck_config_page.remove_fixture("magneticBlockV1B3")
    page.get_by_test_id("magneticBlockV1A3").click()
    page.get_by_test_id("magneticBlockV1B3").click()
    # deck_config_page.remove_fixture("Stacker")

    # Add a vacuum module, remove it, confirm it is gone
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    deck_config_page.remove_fixture("Vacuum")
    create_protocol.click_confirm()
    create_protocol.name_protocol("vacuum module deck configs")
    create_protocol.click_confirm()
    deck_config_page.enter_edit_mode()

    # Add labware in A3, then adding vacuum should error
    protocol_editor.add_labware_to_slot("A3")
    protocol_editor.select_labware_category_by_name("Well plates")
    protocol_editor.select_labware_by_name(INCOMPATIBLE_LABWARE)
    protocol_editor.select_done()
    protocol_editor.select_deck_hardware()
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    deck_config_page.expect_snackbar("Module is incompatible with the labware in slot A3")

    # Remove labware, then add vacuum successfully
    protocol_editor.select_starting_deck()
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.select_deck_hardware()
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)

    # Remove vacuum module, add trash bin, replace trash with vacuum
    deck_config_page.remove_fixture("Vacuum")
    deck_config_page.select_slot("A3")
    deck_config_page.select_fixture("Trash bin")
    deck_config_page.remove_fixture("Trash")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)

    print("\n✓ Vacuum module deck configs validated")


@pytest.mark.pdE2E
def test_vacuum_module_set_up(page: Page) -> None:
    """Validate Vacuum Module starting-deck labware setup and stacking."""
    deck_config_page = DeckConfigPage(page)
    create_protocol = CreateProtocolWizard(page)
    protocol_editor = ProtocolEditorPage(page)

    create_new_protocol_from_landing_page(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    create_protocol.click_confirm()
    create_protocol.name_protocol("vacuum module set up")
    create_protocol.click_confirm()
    deck_config_page.enter_edit_mode()

    # Try to add a well plate with nothing else (non-compatible plate is blocked)
    protocol_editor.add_labware_to_slot("A3")
    protocol_editor.expect_labware_unavailable(INCOMPATIBLE_LABWARE, recommended_only=True)
    protocol_editor.cancel_labware_modal()
    protocol_editor.select_done()

    # Try to add non-recommended / incompatible labware with recommended filter off
    protocol_editor.add_labware_to_slot("A3")
    protocol_editor.expect_labware_unavailable(INCOMPATIBLE_LABWARE, recommended_only=False)
    protocol_editor.cancel_labware_modal()
    protocol_editor.select_done()

    # Add collection plate, then filter plate on top
    protocol_editor.add_labware_and_done("A3", COLLECTION_PLATE, "Well plates", recommended_only=True)
    protocol_editor.add_labware_and_done("A3", FILTER_PLATE, "Filter Plate", recommended_only=True)

    # Switch to tall collar
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", TALL_COLLAR, "Adapters", recommended_only=True)

    # Add / remove short and tall spacers on the main module
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", SHORT_SPACER, "Adapters", recommended_only=True)
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", TALL_SPACER, "Adapters", recommended_only=True)
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", TALL_SPACER, "Adapters", recommended_only=True)
    protocol_editor.clear_labware_from_slot("A3")

    # Switch back to filter plate with short collar (dock)
    protocol_editor.add_labware_and_done(VACUUM_DOCK, SHORT_COLLAR, "Adapters", recommended_only=True)
    protocol_editor.add_labware_and_done(VACUUM_DOCK, FILTER_PLATE, "Filter Plate", recommended_only=True)

    # Add universal lid, then take it off
    protocol_editor.add_labware_and_done(
        "B2",
        COLLECTION_PLATE,
        "Well plates",
        lid=True,
        lid_name=UNIVERSAL_LID,
    )
    protocol_editor.clear_labware_from_slot("B2")

    print("\n✓ Vacuum module set up validated")