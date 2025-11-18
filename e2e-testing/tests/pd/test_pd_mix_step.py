"""Tests covering the Mix step workflow in Protocol Designer."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import LandingPage, MixStepForm, ProtocolEditorPage

PROTOCOL_PATH = "fixtures/protocol/8/doItAllV8.json"
LABWARE_OPTION = "B4 Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
PIPETTE_OPTION = "Flex 1-Channel 1000 µL"
TIPRACK_OPTION = "Opentrons Flex 96 Tip Rack 1000 µL"


@pytest.mark.pdE2E
def test_import_protocol_and_enter_edit_mode(page: Page, base_url: str) -> None:
    """Verify we can import a protocol and reach the editor."""

    _import_protocol_and_open_editor(page)
    expect(page.get_by_role("button", name="Add Step")).to_be_visible()


@pytest.mark.pdE2E
def test_mix_step_configuration_workflow(page: Page, base_url: str) -> None:
    """Replicate the complete mixSettings Cypress test using Playwright."""

    editor = _import_protocol_and_open_editor(page)

    # Step menu parity checks
    editor.open_add_step_menu()
    editor.verify_add_step_menu_options()
    editor.select_step_type("Mix")

    mix_form = MixStepForm(page)
    # currently there is a divergence in the number of parts in the mix step form
    # between 8.6.2 prod (1/3) and what's in edge (1/4)
    # mix_form.expect_part_header("Part 1 / 3")
    for label in [
        "Mix",
        "Pipette",
        "Tiprack",
        "Labware",
        "Select wells",
        "Volume per well",
        "Mix repetitions",
    ]:
        mix_form.expect_text(label)

    mix_form.select_pipette(PIPETTE_OPTION)
    mix_form.select_tiprack(TIPRACK_OPTION)

    mix_form.select_labware(LABWARE_OPTION)
    mix_form.open_well_selector()
    mix_form.expect_well_selector_modal()
    mix_form.select_wells(["A1", "A2"])
    mix_form.save_modal()
    mix_form.enter_volume("100")
    mix_form.enter_mix_repetitions("5")
    mix_form.click_continue()

    # Part 2 / 4 – liquid class settings
    mix_form.expect_part_header(("Part 2 / 4", "Part 2 / 3"))
    mix_form.expect_text("Apply liquid class settings for this mix")
    mix_form.click_continue()
    mix_form.expect_part_header(("Part 3 / 4", "Part 2 / 3"))
    mix_form.open_mix_tip_modal()
    mix_form.expect_text("Side view")
    page.get_by_role("button", name="Swap view").click()
    mix_form.expect_text("Top view")
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
    mix_form.expect_text("Destination well")
    page.get_by_text("Destination well").click()
    mix_form.set_flow_rate("blowout_flowRate", "300")
    mix_form.open_blowout_position_modal()
    mix_form.set_blowout_position("4")
    mix_form.reset_settings()
    mix_form.set_blowout_position("-3")
    mix_form.save_modal()
    mix_form.expect_text("Blowout position from top")

    mix_form.click_continue()

    # Part 4 / 4 – tip handling and rename
    mix_form.expect_part_header(("Part 4 / 4", "Part 3 / 3"))
    mix_form.expect_text("Tip management")
    mix_form.expect_tip_handling_options(["Always", "Once", "Per source", "Per destination", "Never"])
    mix_form.select_tip_handling_option("Once")

    mix_form.rename_step("Cypress Mix Test", "This is testing cypress automation in PD")
    mix_form.save_step()

    expect(page.get_by_text("Cypress Mix Test").first).to_be_visible()


def _import_protocol_and_open_editor(page: Page) -> ProtocolEditorPage:
    """Shared setup helper used by both tests."""

    landing = LandingPage(page)
    landing.wait_for_page_load()
    landing.confirm_welcome_modal()
    landing.click_import_existing_protocol()
    landing.upload_protocol_file(PROTOCOL_PATH)

    expect(page.get_by_text("Protocol Metadata")).to_be_visible(timeout=10000)
    _dismiss_migration_modal(page)

    page.get_by_role("button", name="Edit protocol").click()
    expect(page.get_by_role("button", name="Add Step")).to_be_visible(timeout=5000)
    return ProtocolEditorPage(page)


def _dismiss_migration_modal(page: Page) -> None:
    """Dismiss the migration modal if it appears during import."""

    overlay = page.locator('[aria-label="BackgroundOverlay_ModalShell"]')
    if overlay.is_visible():
        page.get_by_role("button", name="Import", exact=True).click()
        expect(overlay).not_to_be_visible()
