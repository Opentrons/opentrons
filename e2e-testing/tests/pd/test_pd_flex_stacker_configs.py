"""Test Protocol Designer Flex Stacker Configuration functionality.

Runs different configurations of the Stacker with various modules and fixtures.
"""

import pytest
from playwright.sync_api import Page

from automation.pd_pages.deck_config_page import DeckConfigPage
from automation.pd_pages.plate_reader_page import PlateReaderPage

from eyes import Eyes
from utility import create_new_protocol_flow, create_new_protocol_from_landing_page, start_new_create_protocol


@pytest.mark.pdE2E
@pytest.mark.slow
def test_flex_stacker(page: Page, eyes: Eyes | None) -> None:
    deck_config_page = DeckConfigPage(page)
    plate_reader_page = PlateReaderPage(page)


    ## Create new Flex protocol from Landing Page, 4 stackers and waste chute and magnetic block
    create_new_protocol_from_landing_page(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module("Magnetic Block GEN1")
    deck_config_page.select_slot("B4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("C4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    print("\n✓ Configured 4 Flex Stackers with waste chute and magnetic block")

    if eyes is not None:
        eyes.check(checkpoint_name="Configured 4 Flex Stackers with waste chute and magnetic block - combo fixture check")

    ## Create new Flex protocol from Create New button,  and configuring 4 stackers without waste chute
    start_new_create_protocol(page)
    create_new_protocol_flow(pipette="8-Channel", gripper=True, tc=True, waste_chute=False, page=page)
    deck_config_page.remove_fixture("Trash bin")
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.remove_fixture("Stacker")
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("B4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("C4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    print("✓ Configured 4 Flex Stackers without waste chute or trash bin")

    ##Creating a new protocol and adding 3 stackers and a trash bin
    start_new_create_protocol(page)
    create_new_protocol_flow(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)
    deck_config_page.select_slot("B4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("C4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    print("✓ Configured 3 Flex Stackers with a trash bin")

    ##Creating a new protocol and adding 3 stackers and an absorbance reader
    start_new_create_protocol(page)
    create_new_protocol_flow(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    plate_reader_page.configure_module("B3", "Absorbance Plate Reader Module GEN1")
    deck_config_page.select_slot("C4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    print("✓ Configured 3 Flex Stackers with waste chute a plate reader")

    ##Test adding 2 stackers and an absorbance reader and an trash bin
    start_new_create_protocol(page)
    create_new_protocol_flow(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)
    deck_config_page.select_slot("A3")
    deck_config_page.select_fixture("Trash bin")
    deck_config_page.select_slot("B3")
    deck_config_page.select_module("Absorbance Plate Reader Module GEN1")
    deck_config_page.select_slot("C4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    print("✓ Configured 2 Flex Stackers with Trash bin and a plate reader")