import re

import pytest
from playwright.sync_api import Page

from automation.pd_pages import LandingPage
from automation.pd_pages.create_protocol_wizard import CreateProtocolWizard
from automation.pd_pages.plate_reader_page import PlateReaderPage
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from automation.pd_pages.timeline import Timeline
from eyes import Eyes


@pytest.mark.pdE2E
@pytest.mark.slow
def test_flex_absorbance_reader_setup(page: Page, pd_base_url: str, eyes: Eyes | None) -> None:
    plate_reader_page = PlateReaderPage(page)
    protocol_editor = ProtocolEditorPage(page)
    create_protocol = CreateProtocolWizard(page)

    # Create new Flex protocol setup
    ## Note This will need to be refactored to a reusable function later
    test_flex_onboarding_workflow(page, pd_base_url)

    # Configure deck hardware
    ## Snapshot: Validate Absorbance Plate Reader module configuration option
    plate_reader_page.configure_module("B3", "Absorbance Plate Reader Module GEN1")
    plate_reader_page.button_selection("Confirm")
    create_protocol.name_protocol("test")
    plate_reader_page.button_selection("Confirm")

    # Edit protocol in Protocol Editor - adding labware to the deck
    plate_reader_page.button_selection("Edit protocol")
    plate_reader_page.dimiss_deck_hardware_modal()
    protocol_editor.add_labware_to_slot("D1")
    protocol_editor.select_labware_category_by_name("Well plates")
    protocol_editor.select_labware_by_name("Opentrons Tough 96 Well Plate")

    # Add plate reader multi-initialization step
    protocol_editor.add_step("Absorbance Plate Reader")
    ## Snapshot: Validate Plate Reader form
    plate_reader_page.define_initialization("Multi", 700)
    ## Snapshot: Validate Multi-initialization configuration

    # Add plate reader step to change lid position, to prep for moving labware onto plate reader
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.change_lid_position("Open")
    ## Snapshot: Validate Change Lid Position to Open
    plate_reader_page.save_pr_step()
    protocol_editor.add_step("Move")
    protocol_editor.move_labware(labware="D1 Opentrons Tough 96 Well Plate", new_location="B3 Absorbance Plate Reader")

    # Add plate reader step to close lid and read labware
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.change_lid_position("Closed")
    ## Snapshot: Validate Change Lid Position to Closed
    plate_reader_page.save_pr_step()
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.read_labware("test 1")
    ## Snapshot: Validate Read Labware Form
    plate_reader_page.save_pr_step()

    # Add plate reader step to open lid and move labware off plate reader
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.change_lid_position("Open")
    plate_reader_page.save_pr_step()
    protocol_editor.add_step("Move")
    protocol_editor.move_labware(labware="B3 Opentrons Tough 96 Well Plate", new_location="D1")

    # Add plate reader step to prep to change
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.define_initialization("Single", 450)
    ## Snapshot: Validate Single-initialization configuration
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.change_lid_position("Open")
    plate_reader_page.save_pr_step()
    protocol_editor.add_step("Move")
    protocol_editor.move_labware(labware="D1 Opentrons Tough 96 Well Plate", new_location="B3 Absorbance Plate Reader")

    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.change_lid_position("Closed")
    plate_reader_page.save_pr_step()
    protocol_editor.add_step("Absorbance Plate Reader")
    plate_reader_page.read_labware("test 2")
    plate_reader_page.save_pr_step()
    # Make a deterministic visual snapshot of the whole page
    # - wait for the step save snackbar to disappear
    # - scroll to the bottom of the timeline
    plate_reader_page.wait_for_save_banner_gone()
    timeline = Timeline(page)
    timeline.scroll_timeline_to_bottom()
    if eyes is not None:
        eyes.check(checkpoint_name="Fully Configured Plate Reader")
        # now take a visual snapshot of the timeline element with stitching
        eyes.check_element(
            checkpoint_name="Stitched Final Timeline",
            element=page.get_by_test_id(timeline.timeline_box_testid),
        )


def test_flex_onboarding_workflow(page: Page, pd_base_url: str) -> None:
    """This sets up the deck for the Flex Absorbance Reader test"""
    # Start on home page
    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    # Click "Create a Flex protocol" to start onboarding
    landing.click_create_protocol()
    # Part 1: Add pipette - Click "Add a pipette" to open selector
    page.get_by_text("Add a pipette").click()
    # Select 1-Channel pipette type
    page.get_by_text("1-Channel").click()
    # Select 50 µL volume
    page.get_by_text("50 µL").click()
    # Select Tip Rack 50 µL (not Filter Tip Rack) - use exact match
    page.locator("label").filter(has=page.get_by_text(re.compile(r"^Tip Rack 50 µL$"))).first.click()
    # Save pipette configuration
    page.get_by_role("button", name="Save").click()
    # Part 2: Gripper question - "Do you want to move labware automatically with the gripper?"
    page.get_by_text("Yes", exact=True).click()
    # Confirm basics and proceed to deck hardware configuration
    confirm_button = page.get_by_role("button", name="Confirm")
    confirm_button.click()
