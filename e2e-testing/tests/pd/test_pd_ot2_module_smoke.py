"""Test OT-2 protocol creation workflow."""

import pytest
from playwright.sync_api import Page, expect

from automation.pd_pages import DeckConfigPage, LandingPage, PipetteModal, ProtocolEditorPage
from automation.pd_pages.heater_shaker_step_form_page import _add_heater_shaker_step
from automation.pd_pages.magnetic_module_step_form_page import AddMagneticModule
from automation.pd_pages.tc_step_form_page import _add_thermocycler_profile_step, _add_thermocycler_state_step
from automation.pd_pages.tempdeck_step_form_page import _add_temperature_module_step
from eyes import Eyes


@pytest.mark.pdE2E
@pytest.mark.slow
def test_ot2_robot_modules(page: Page, pd_base_url: str, eyes: Eyes | None) -> None:
    """The Opentrons Ot-2 needs to be tested as well so we're going
    through the onboarding flow, deck configuration
    Then going through each module with basic steps
    'Temperature Module GEN2'
    "Heater-Shaker Module GEN1"
    "Thermocycler Module GEN2"
    "Magnetic Module GEN2"
    """
    # Landing Page
    landing_page = LandingPage(page)
    print(f"DEBUG base_url: '{pd_base_url}'")
    landing_page.goto(pd_base_url)
    landing_page.wait_for_page_load()
    print("✓ Main page loaded")

    landing_page.confirm_welcome_modal()
    landing_page.click_create_protocol()

    # Select OT-2
    page.locator("label", has_text="Opentrons OT-2").click()
    page.wait_for_timeout(300)
    # For OT-2: Verify "Add a pipette" button is still there
    expect(page.get_by_text("Add a pipette")).to_be_visible()

    # Click "Add a pipette" to open the selector for OT-2
    page.get_by_text("Add a pipette").click()
    pipette_modal = PipetteModal(page)
    editor = ProtocolEditorPage(page)
    print("✓ Pipette selection modal opened")
    pipette_modal.ot2_select_pipette_type(channels="1-Channel", gen="GEN2", volume="1000 µL")
    print("✓ Pipette type selected: 1-Channel GEN2 1000 µL")
    pipette_modal.select_tip_racks(["Filter Tip Rack 1000 µL"])
    editor.select_save_text()
    editor.select_confirm_text()
    print("✓ Pipette configuration saved")
    deck_config = DeckConfigPage(page)
    print("confirmed pipette(s)")
    # We're on step 2, adding modules
    list_of_modules = [
        "Temperature Module GEN2",
        "Heater-Shaker Module GEN1",
        "Magnetic Module GEN2",
        "Thermocycler Module GEN2",
    ]
    deck_config.ot2_module_selection(list_of_modules)
    deck_config.confirm_deck_configuration()
    editor.select_confirm_text()
    deck_config.enter_edit_mode()
    if eyes is not None:
        # This works because 'eyes' is an object that 'knows' your current page
        eyes.check("OT-2 Modules Added")
    print("✓ File uploaded, ready for module steps")
    editor.add_step("Temperature")
    _add_temperature_module_step(page, "50")
    editor.add_step("Heater-Shaker")
    _add_heater_shaker_step(page, "50", "300", "00:30")
    print("✓ Heater-Shaker step: 50°C, 300 rpm, timer 00:30")
    editor.add_step("Thermocycler")
    _add_thermocycler_state_step(page, block_temp="40", lid_temp="110", lid_position="open")
    editor.add_step("Thermocycler")
    _add_thermocycler_profile_step(
        page,
        well_volume="100",
        lid_temp="50",
        cycles=[
            {
                "repeat_count": "2",
                "steps": [
                    {"name": "Cycle 1", "temperature": "40", "time": "1:00"},
                    {"name": "Cycle 2", "temperature": "4", "time": "0:01"},
                ],
            }
        ],
    )
    # Add Magnetic Module
    editor.add_step("Magnet")
    magnetic = AddMagneticModule(page)
    magnetic.magnetic_module_engage_height(10)
    print("✓ Magnetic module engage height set to 10")
    editor.add_step("Magnet")
    magnetic.magnetic_module_disengage()
    print("✓ Magnetic module steps added with engage height 10 and disengage")
