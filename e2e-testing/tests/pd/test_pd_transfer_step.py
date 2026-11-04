"""Tests covering the transfer step workflow in Protocol Designer.

Ports `transferSettings.cy.ts` from the Cypress suite to Playwright.
"""

import pytest
from playwright.sync_api import Page

from automation.pd_pages import (
    ProtocolEditorPage,
    TransferPage,
)
from eyes import Eyes
from utility import import_protocol_and_open_editor

SOURCE_LABWARE = "Opentrons Tough 300 mL 1 Well Reservoir"
DESTINATION_LABWARE = "Greiner 384 Well Plate 240 µL"


@pytest.mark.pdE2E
@pytest.mark.slow
def test_96_channel_workflow(page: Page, eyes: Eyes | None) -> None:
    import_protocol_and_open_editor(page, "fixtures/protocol/9/Liquid_Class_96_Channel_Test.py", migration=True)
    editor = ProtocolEditorPage(page)
    editor.open_add_step_menu()
    editor.add_step()
    transfer_page = TransferPage(page)
    transfer_page.source_labware_select(SOURCE_LABWARE)
    transfer_page.destination_labware_select(DESTINATION_LABWARE)
    transfer_page.open_nozzle_and_well_selector()
    transfer_page.select_nozzles()
    transfer_page.wells_select("Source", SOURCE_LABWARE, [], False)
    transfer_page.wells_select("Destination", DESTINATION_LABWARE, "A1", True)
    transfer_page.pipette_path_select("Single transfer")
    transfer_page.input_volume("30")
    transfer_page.transfer_continue_to_next_step()
    """
    Regressions steps for Liquid Class settings
    """
    liquid_classes = ["Aqueous", "Viscous", "Volatile"]

    for liquid in liquid_classes:
        # todo 12/24/25 add no liquid class when implementing snapshot
        transfer_page.part_2_transfer_form_liquid_class(liquid)

        transfer_page.transfer_continue_to_next_step()
        # Take snapshot here for visual regression testing: {liquid}
        if liquid != "Aqueous":
            transfer_page.update_or_keep_liquid_class_settings("Update settings")
        else:
            pass

        transfer_page.select_aspirate_or_dispense_advanced_settings("Dispense")
        # Take snapshot here for visual regression testing: {liquid}
        transfer_page.select_aspirate_or_dispense_advanced_settings("Aspirate")
        # Take snapshot here for visual regression testing: {liquid}

        transfer_page.go_back_to_previous_step()

    transfer_page.transfer_continue_to_next_step()

    transfer_page.set_flow_rate_aspirate(150)
    transfer_page.set_submerge_and_retract(
        aspirate=True, submerge_speed=25, submerge_delay=0.5, retract_speed=25, retract_delay=0.5
    )
    transfer_page.advanced_settings(
        Aspirate=True,
        Pre_wetting=True,
        Touch_tip=False,
        Air_gap=True,
        Air_gap_volume=5,
        Delay=True,
        Delay_time=1,
    )
    transfer_page.tip_position_asp_disp(aspirate=True, xyz=(1, 2, 0))
    transfer_page.tip_position_submerge_retract(aspirate=True, submerge=True, xyz=(1, 1, 0))
    transfer_page.tip_position_submerge_retract(aspirate=True, submerge=False, xyz=(-1, -1, 0.5))
    transfer_page.set_mix_settings(mix_times=2, mix_volume=20, aspirate=True)
    transfer_page.select_aspirate_or_dispense_advanced_settings("Dispense")
    transfer_page.advanced_settings(
        Aspirate=False,
        Pre_wetting=True,
        Touch_tip=True,
        Touch_tip_speed=30,
        Touch_tip_distance_from_edge=1.0,
        Air_gap=True,
        Air_gap_volume=30,
        Delay=True,
        Delay_time=1,
        set_blowout=True,
        blowout_location="Source well",
        blowout_flow_rate=150,
    )
    if eyes is not None:
        eyes.check(checkpoint_name="Dispense Advanced Settings")
    transfer_page.set_mix_settings(mix_times=2, mix_volume=20, aspirate=False)
    transfer_page.transfer_continue_to_next_step()
    transfer_page.tip_change_strategy("Once", drop_location="Tip rack")
    transfer_page.save_transfer_step()
