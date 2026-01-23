import pytest
from playwright.sync_api import Page
from utility import create_new_protocol, create_new_protocol_from_landing_page
from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from automation.pd_pages.deck_config_page import DeckConfigPage
from automation.pd_pages.plate_reader_page import PlateReaderPage



@pytest.mark.pdE2E
@pytest.mark.slow
def test_flex_stacker(page: Page) -> None:
    flex_stacker_page = FlexStackerPage(page)
    protocol_editor = ProtocolEditorPage(page)
    deck_config_page = DeckConfigPage(page)
    plate_reader_page = PlateReaderPage(page)


    ## Create new Flex protocol from Landing Page, 4 stackers and waste chute and magnetic block
    create_new_protocol_from_landing_page(True, True, True, page)
    flex_stacker_page.configure_stacker("A4")
    flex_stacker_page.configure_stacker("B4")
    flex_stacker_page.configure_stacker("C4")
    flex_stacker_page.configure_stacker("D4")
    #applitools eyes?
    #need to add magnetic block
    print("Configured 4 Flex Stackers with waste chute and magnetic block")

    ## Create new Flex protocol from Create New button
    flex_stacker_page.start_new_create_protocol()
    create_new_protocol(True, True, False, page)
    deck_config_page.remove_fixture("Trash bin")
    flex_stacker_page.configure_stacker("A4")
    flex_stacker_page.configure_stacker("B4")
    flex_stacker_page.configure_stacker("C4")
    flex_stacker_page.configure_stacker("D4")
    print("Configured 4 Flex Stackers without waste chute")

    ##Creating a new protocol and adding 3 stackers and a trashbin
    flex_stacker_page.start_new_create_protocol()
    create_new_protocol(True, True, False, page)
    flex_stacker_page.configure_stacker("B4")
    flex_stacker_page.configure_stacker("C4")
    flex_stacker_page.configure_stacker("D4")
    print("Configured 3 Flex Stackers with a trashbin")

    ##Creating a new protocol
    ##Test adding 3 stackers and an absorbance reader
    flex_stacker_page.start_new_create_protocol()
    create_new_protocol(True, True, True, page)
    flex_stacker_page.configure_stacker("A4")
    plate_reader_page.configure_module("B3", "Absorbance Plate Reader Module GEN1")
    flex_stacker_page.configure_stacker("C4")
    flex_stacker_page.configure_stacker("D4")
    print("Configured 3 Flex Stackers with waste chute a plate reader")


#before each maybe? test.beforeEach(async ({ page }) => {}
    ##Creating a new protocol
    ##Test adding 2 stackers and an absorbnace reader and a expansion slot
    ##Add labware to stacker
        ##select labware, check off tip rack lid, quantity
        ##replace labware is visible (app eyes)
    ##Add step for stacker
        ##Select Stacker by location
    ##check to make surethat the stacker is highlighted
