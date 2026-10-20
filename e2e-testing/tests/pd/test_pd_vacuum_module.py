"""Test Protocol Designer Vacuum Module deck configuration behavior."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages.create_protocol_wizard import CreateProtocolWizard
from automation.pd_pages.deck_config_page import DeckConfigPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from automation.pd_pages.timeline import Timeline
from utility import create_new_protocol_from_landing_page

VACUUM_MODULE = "Vacuum Module GEN1"
INCOMPATIBLE_LABWARE = "Bio-Rad 96 Well Plate 200 µL PCR"
OTHER_SLOTS_WITHOUT_VACUUM = ("B2", "B3", "C2", "C3", "D1", "D3")


@pytest.mark.pdE2E
@pytest.mark.slow
def test_vacuum_module_deck_configs(page: Page) -> None:
    """Validate Vacuum Module deck config with stackers, mag blocks, labware, and trash."""
    deck_config_page = DeckConfigPage(page)
    create_protocol = CreateProtocolWizard(page)
    protocol_editor = ProtocolEditorPage(page)
    timeline = Timeline(page)

    create_new_protocol_from_landing_page(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)

    # Add a stacker on A4
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")

    # Add a magnetic block on B3 and A3
    deck_config_page.select_slot("B3")
    deck_config_page.select_module("Magnetic Block GEN1")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module("Magnetic Block GEN1")

    # Remove them
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

    # Remove labware, then add vacuum successfully
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)

    # Remove vacuum, add trash bin, replace trash with vacuum
    deck_config_page.remove_fixture("Vacuum")
    deck_config_page.select_slot("A3")
    deck_config_page.select_fixture("Trash bin")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)

    # Vacuum should not be offered on other deck slots
    deck_config_page.remove_fixture("Vacuum")
    for slot in OTHER_SLOTS_WITHOUT_VACUUM:
        deck_config_page.expect_module_unavailable_on_slot(slot, VACUUM_MODULE)

    print("\n✓ Vacuum module deck configs validated")
