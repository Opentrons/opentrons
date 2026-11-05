"""Tests covering the Mix step workflow in Protocol Designer."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages import MixStepForm, ProtocolEditorPage
from utility import import_protocol_and_open_editor

PROTOCOL_PATH = "fixtures/protocol/8/doItAllV8.json"
# Ending deck keeps the 1000 µL tip rack on C2 (do not dispose it before Mix).
LABWARE_OPTION = "B4 Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
PIPETTE_OPTION = "Flex 1-Channel 1000 µL"
TIPRACK_OPTION = "Opentrons Flex 96 Tip Rack 1000 µL"


@pytest.mark.pdE2E
def test_mix_step_configuration_workflow(page: Page) -> None:
    """Replicate the complete mixSettings Cypress test using Playwright."""

    import_protocol_and_open_editor(page, PROTOCOL_PATH, migration=True)
    protocol_editor = ProtocolEditorPage(page)

    mix_form = MixStepForm(page)
    protocol_editor.add_step("Mix")

    mix_form.select_labware(LABWARE_OPTION)

    mix_form.open_nozzle_and_well_selector()

    mix_form.select_nozzles()
    mix_form.expect_well_modal()

    mix_form.select_wells(["A1", "A2"])
    mix_form.enter_volume("100")
    mix_form.enter_mix_repetitions("5")
    mix_form.click_continue()

    # Part 2 / 4 – liquid class settings
    mix_form.click_continue()
    mix_form.open_mix_tip_modal()
    page.get_by_role("button", name="Swap view").click()
    mix_form.set_mix_tip_position("2", "2", "4")
    mix_form.reset_settings()
    mix_form.set_mix_tip_position("2", "2", "5")
    mix_form.save_modal()

    mix_form.toggle_checkbox()
    mix_form.fill_delay_seconds("5")

    # Part 3 / 4 – dispense configuration
    mix_form.click_dispense_tab()
    mix_form.set_flow_rate("dispense_flowRate", "300")
    mix_form.toggle_checkbox()
    mix_form.fill_delay_seconds("5")
    mix_form.toggle_checkbox()
    mix_form.set_push_out_volume("5")
    mix_form.toggle_checkbox()
    mix_form.open_blowout_location_dropdown()
    page.get_by_text("Destination well").click()
    mix_form.set_flow_rate("blowout_flowRate", "300")
    mix_form.open_blowout_position_modal()
    mix_form.set_blowout_position("4")
    mix_form.reset_settings()
    mix_form.set_blowout_position("-3")
    mix_form.save_modal()

    mix_form.click_continue()

    # Part 4 / 4 – tip handling and rename
    mix_form.expect_tip_handling_options(["Always", "Once", "Per source", "Per destination", "Never"])
    mix_form.select_tip_handling_option("Once")
    mix_form.rename_step("Cypress Mix Test", "This is testing cypress automation in PD")
    mix_form.save_step()
