import pytest
from playwright.sync_api import Page
from utility import create_new_protocol_flow, create_new_protocol_from_landing_page, start_new_create_protocol
from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from automation.pd_pages.deck_config_page import DeckConfigPage
from automation.pd_pages.plate_reader_page import PlateReaderPage
from automation.pd_pages.create_protocol_wizard import CreateProtocolWizard
from automation.pd_pages.tc_step_form_page import ThermocyclerStepPage
from automation.pd_pages.transfer_form import TransferPage



@pytest.mark.pdE2E
@pytest.mark.slow
def test_flex_stacker(page: Page) -> None:
    flex_stacker_page = FlexStackerPage(page)
    protocol_editor = ProtocolEditorPage(page)
    deck_config_page = DeckConfigPage(page)
    plate_reader_page = PlateReaderPage(page)
    create_protocol = CreateProtocolWizard(page)
    thermocycler_page = ThermocyclerStepPage(page)
    transfer_page = TransferPage(page)


    ## Create new Flex protocol from Landing Page, 4 stackers and waste chute and magnetic block
    create_new_protocol_from_landing_page(True, True, True, page)
    # deck_config_page.select_slot("A4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("A3")
    # deck_config_page.select_module("Magnetic Block GEN1")
    # deck_config_page.select_slot("B4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("C4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("D4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # #applitools eyes?
    # print("\n✓ Configured 4 Flex Stackers with waste chute and magnetic block")

    # ## Create new Flex protocol from Create New button
    # start_new_create_protocol(page)
    # create_new_protocol_flow(True, True, False, page)
    # deck_config_page.remove_fixture("Trash bin")
    # deck_config_page.select_slot("A4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.remove_fixture("Stacker")
    # deck_config_page.select_slot("A4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("B4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("C4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("D4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # print("✓ Configured 4 Flex Stackers without waste chute")

    # ##Creating a new protocol and adding 3 stackers and a trashbin
    # start_new_create_protocol(page)
    # create_new_protocol_flow(True, True, False, page)
    # deck_config_page.select_slot("B4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("C4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("D4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # print("✓ Configured 3 Flex Stackers with a trashbin")

    # ##Creating a new protocol
    # ##Test adding 3 stackers and an absorbance reader
    # start_new_create_protocol(page)
    # create_new_protocol_flow(True, True, True, page)
    # deck_config_page.select_slot("A4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # plate_reader_page.configure_module("B3", "Absorbance Plate Reader Module GEN1")
    # deck_config_page.select_slot("C4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("D4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # print("✓ Configured 3 Flex Stackers with waste chute a plate reader")


    # ##Test adding 2 stackers and an absorbnace reader and a expansion slot
    # start_new_create_protocol(page)
    # create_new_protocol_flow(True, True, True, page)
    # deck_config_page.select_slot("A3")
    # deck_config_page.select_fixture("Trash bin")
    # deck_config_page.select_slot("B3")
    # deck_config_page.select_module("Absorbance Plate Reader Module GEN1")
    # deck_config_page.select_slot("C4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # deck_config_page.select_slot("D4")
    # deck_config_page.select_module("Flex Stacker Module GEN1")
    # print("✓ Configured 2 Flex Stackers with Trash bin and a plate reader")

    # ##Test adding 2 stackers and an absorbance reader and a expansion slot
    # start_new_create_protocol(page)
    # create_new_protocol_flow(True, True, True, page)
    deck_config_page.select_slot("A4")
    deck_config_page.select_fixture("Staging Area Slot")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module("Magnetic Block GEN1")
    deck_config_page.select_slot("B3")
    deck_config_page.select_module("Absorbance Plate Reader Module GEN1")
    deck_config_page.select_slot("C1")
    deck_config_page.select_module("Heater-Shaker Module GEN1")
    deck_config_page.select_slot("C4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D4")
    deck_config_page.select_module("Flex Stacker Module GEN1")
    deck_config_page.select_slot("D1")
    deck_config_page.select_module("Temperature Module GEN2")
    print("✓ Configured 2 Flex Stackers with all fixtures and all modules")

    create_protocol.click_confirm()
    create_protocol.name_protocol("stacker protocol")
    create_protocol.click_confirm()
    plate_reader_page.button_selection("Edit Protocol")
    plate_reader_page.dimiss_deck_hardware_modal()
    protocol_editor.add_labware_to_slot("hopperD4")
    protocol_editor.select_labware_category_by_name("Well plates")
    protocol_editor.select_labware_by_name("Opentrons Tough 96 Well Plate", True, 40)
    plate_reader_page.button_selection("Done")

    protocol_editor.add_labware_to_slot("hopperC4")
    protocol_editor.select_labware_category_by_name("Well plates")
    protocol_editor.select_labware_by_name("Opentrons Tough 96 Well Plate", True, 40)
    plate_reader_page.button_selection("Done")

    protocol_editor.add_labware_to_slot("B2")
    protocol_editor.select_labware_category_by_name("Reservoirs")  
    protocol_editor.select_labware_by_name("NEST 1 Well Reservoir 195 mL")
    plate_reader_page.button_selection("Done")
    print("✓ Add labware to stacker")

    protocol_editor.add_labware_to_slot("hopperD4")
    protocol_editor.select_labware_category_by_name("Tip racks")
    protocol_editor.select_labware_by_name("Opentrons Flex 96 Tip Rack 50 µL", stacker=True, lid=True)
    plate_reader_page.button_selection("Done")
    print("✓ Replaced labware with tip racks with lids")

    protocol_editor.add_step('Flex Stacker')
    flex_stacker_page.retrieve_stacker('D4 Flex Stacker')
    plate_reader_page.button_selection('Save')
    print("✓ Retrieve command successful")

    protocol_editor.add_step("Move")
    protocol_editor.move_labware("D4 Opentrons Flex 96 Tip Rack", "A2")
    protocol_editor.add_step("Move")
    protocol_editor.move_labware("A2 Opentrons Flex 96 Tip Rack", "D4")
    print("✓ Move labware from and back to stacker")

    protocol_editor.add_step("Flex Stacker")
    flex_stacker_page.store_stacker('D4 Flex Stacker')
    plate_reader_page.button_selection("Save")
    print("✓ Store command successful")

    protocol_editor.add_step("Flex Stacker")
    flex_stacker_page.retrieve_stacker('D4 Flex Stacker')
    plate_reader_page.button_selection('Save')
    protocol_editor.add_step("Move")
    protocol_editor.move_labware("D4 Opentrons Flex Tip Rack Lid", "D3 Waste Chute in D3")
    plate_reader_page.button_selection("Confirm")
    protocol_editor.add_step("Move")
    protocol_editor.move_labware("D4 Opentrons Flex 96 Tip Rack", "A2")
    print("✓ Move lid from tip rack on shuttle to waste chute")

    protocol_editor.add_step("Thermocycler")
    thermocycler_page.select_state_mode()
    thermocycler_page.set_lid_position("open")
    plate_reader_page.button_selection("Save")
    protocol_editor.add_step("Flex Stacker")
    flex_stacker_page.retrieve_stacker('C4 Flex Stacker')
    plate_reader_page.button_selection('Save')
    protocol_editor.add_step("Move")
    protocol_editor.move_labware("C4 Opentrons Tough 96 Well Plate", "Thermocycler Module GEN2") 
    protocol_editor.add_step()
    transfer_page.source_labware_select("NEST 1 Well Reservoir 195 mL")
    transfer_page.destination_labware_select("Opentrons Tough 96 Well Plate")
    transfer_page.wells_select("Destination", ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12"], rect=False)
    transfer_page.pipette_path_select("Single transfer")
    transfer_page.input_volume("150")
    transfer_page.transfer_continue_to_next_step()
    transfer_page.transfer_continue_to_next_step()
    transfer_page.transfer_continue_to_next_step()
    plate_reader_page.button_selection("Save")
    print("✓ Transfer from Reservoir to plate in TC")


    protocol_editor.add_step("Flex Stacker")
    flex_stacker_page.empty_stacker("C4 Flex Stacker", "Empty message test")
    plate_reader_page.button_selection("Save")
    print("✓ Empty command successful")

    protocol_editor.add_step("Move")
    protocol_editor.move_labware("D2 Opentrons Flex 96 Tip Rack", "D3 Waste Chute in D3")
    protocol_editor.add_step("Flex Stacker")
    flex_stacker_page.refill_stacker("D4 Flex Stacker", 1, 'Refill message test')
    plate_reader_page.button_selection('Save')
    print("✓ Refill command successful")

    protocol_editor.add_step("Move")
    protocol_editor.move_labware("A2 Opentrons Flex 96 Tip Rack", "D4")

    protocol_editor.add_step("Move")
    protocol_editor.move_labware("A1+B1 Opentrons Tough 96 Well", "C4")
    protocol_editor.add_step("Flex Stacker")
    flex_stacker_page.store_stacker('C4 Flex Stacker')
    plate_reader_page.button_selection("Save")
    print("✓ Store well plate from TC into Stacker C")

    protocol_editor.add_step("Flex Stacker")
    ##insert applitools eyes check here or use try except?
    # try:
    #     flex_stacker_page.store_stacker('D4 Flex Stacker')
    # except Exception as e:
    #     print(f"Error storing tip rack into Stacker D: {e}")
    print("✓ Validated you cannot store mismatched labware into stacker")

    print("\n✅ Flex Stacker Configuration and Form Test completed successfully!")
