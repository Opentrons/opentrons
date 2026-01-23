import pytest
from playwright.sync_api import Page
from automation.pd_pages.create_protocol_wizard import CreateProtocolWizard
from utility import create_new_protocol



@pytest.mark.pdE2E
@pytest.mark.slow
def test_flex_stacker(page: Page, base_url: str) -> None:
    
    create_new_protocol(page)
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
