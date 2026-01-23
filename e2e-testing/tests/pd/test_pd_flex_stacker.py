import pytest
from playwright.sync_api import Page
from utility import create_new_protocol, create_new_protocol_from_landing_page
from automation.pd_pages.flex_stacker import FlexStackerPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage



@pytest.mark.pdE2E
@pytest.mark.slow
def test_flex_stacker(page: Page, base_url: str) -> None:
    flex_stacker_page = FlexStackerPage(page)
    protocol_editor = ProtocolEditorPage(page)



    create_new_protocol_from_landing_page(page)
    flex_stacker_page.configure_stacker("A4")
    flex_stacker_page.configure_stacker("B4")
    flex_stacker_page.configure_stacker("C4")
    flex_stacker_page.configure_stacker("D4")
    flex_stacker_page.start_new_create_protocol()
    create_new_protocol(page)
    print("Configured 4 Flex Stackers with waste chute")
    page.wait_for_timeout(10000)
#before each maybe? test.beforeEach(async ({ page }) => {}
    ##Creating a new protocol
    ##Test adding 4 Stackers, with a waste chute
#before each maybe? test.beforeEach(async ({ page }) => {}
    ##Creating a new protocol
    ##Test adding 4 Stackers, without a waste chute
#before each maybe? test.beforeEach(async ({ page }) => {}
    ##Creating a new protocol
    ##Test adding 3 stackers and a trashbin
#before each maybe? test.beforeEach(async ({ page }) => {}
    ##Creating a new protocol
    ##Test adding 3 stackers and an absorbance reader
#before each maybe? test.beforeEach(async ({ page }) => {}
    ##Creating a new protocol
    ##Test adding 2 stackers and an absorbnace reader and a expansion slot
    ##Add labware to stacker
        ##select labware, check off tip rack lid, quantity
        ##replace labware is visible (app eyes)
    ##Add step for stacker
        ##Select Stacker by location
    ##check to make surethat the stacker is highlighted
