"""Test Protocol Designer Vacuum Module deck configuration behavior."""

import pytest
from playwright.sync_api import Page

from automation.pd_pages.create_protocol_wizard import CreateProtocolWizard
from automation.pd_pages.deck_config_page import DeckConfigPage
from automation.pd_pages.heater_shaker_step_form_page import (
    LidPosition,
    _add_heater_shaker_latch_step,
    _add_heater_shaker_step,
)
from automation.pd_pages.protocol_editor_page import ProtocolEditorPage
from automation.pd_pages.transfer_form import TransferPage, TransferStepConfig, add_transfer_step
from automation.pd_pages.vacuum_step_form_page import (
    VacuumProfileCycleConfig,
    VacuumProfileStepConfig,
    VacuumStepPage,
    add_vacuum_close_vent,
    add_vacuum_open_vent,
    add_vacuum_power_state,
    add_vacuum_pressure_profile,
    add_vacuum_pressure_state,
    add_vacuum_pump_off,
)
from utility import create_new_protocol_from_landing_page

VACUUM_MODULE = "Vacuum Module GEN1"
VACUUM_DOCK = "vacuumModuleV1DockA4"
VACUUM_MODULE_DEST = "Vacuum Module GEN1"
VACUUM_DOCK_DEST = "Vacuum Module Dock A4"
INCOMPATIBLE_LABWARE = "Bio-Rad 96 Well Plate 200 µL PCR"
# PD recommends Tough PCR as the vacuum collection plate (Nunc 450 is not offered).
COLLECTION_PLATE = "Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt"
FILTER_PLATE = "Millipore 96 Well Plate 300µL PCR"
# Slot-prefixed nicknames when two Tough PCR plates are on deck.
VACUUM_COLLECTION = f"A3 {COLLECTION_PLATE}"
DECK_COLLECTION = f"B1 {COLLECTION_PLATE}"
SHORT_COLLAR = "Opentrons Vacuum Manifold Collar Short"
TALL_COLLAR = "Opentrons Vacuum Manifold Collar Tall"
SHORT_SPACER = "Opentrons Vacuum Manifold Spacer Short"
TALL_SPACER = "Opentrons Vacuum Manifold Spacer Tall"
UNIVERSAL_LID = "Opentrons Tough Universal Lid"
HS_ADAPTER = "Opentrons 96 PCR Heater-Shaker Adapter"
TIPRACK_1000 = "Opentrons Flex 96 Tip Rack 1000 µL"
TIPRACK_200 = "Opentrons Flex 96 Tip Rack 200 µL"
RESERVOIR = "Opentrons Tough 300 mL 1 Well Reservoir"
CORNING_FLAT = "Corning 96 Well Plate 360 µL Flat"
COLUMN_WELLS = [f"A{i}" for i in range(1, 13)]
ODD_COLUMNS = ["A1", "A3", "A5", "A7", "A9", "A11"]


@pytest.mark.pdE2E
@pytest.mark.slow
def test_vacuum_module_deck_configs(page: Page) -> None:
    """Validate Vacuum Module deck config with stackers, mag blocks, labware, and trash."""
    deck_config_page = DeckConfigPage(page)
    create_protocol = CreateProtocolWizard(page)
    protocol_editor = ProtocolEditorPage(page)

    create_new_protocol_from_landing_page(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)

    # Add a stacker on A4
    deck_config_page.select_slot("A4")
    deck_config_page.select_module("Flex Stacker Module GEN1")

    # Add a magnetic block on B3 and A3
    deck_config_page.select_slot("B3")
    deck_config_page.select_module("Magnetic Block GEN1")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module("Magnetic Block GEN1")

    # Remove them //NOTE: NEED TO FIX THIS TEST
    # deck_config_page.remove_fixture("magneticBlockV1A3")
    # deck_config_page.remove_fixture("magneticBlockV1B3")
    page.get_by_test_id("magneticBlockV1A3").click()
    page.get_by_test_id("magneticBlockV1B3").click()
    # deck_config_page.remove_fixture("Stacker")

    # Add a vacuum module, remove it, confirm it is gone
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    deck_config_page.remove_fixture("Vacuum")
    create_protocol.click_confirm()
    create_protocol.name_protocol("vacuum module deck configs")
    create_protocol.click_confirm()
    deck_config_page.enter_edit_mode()

    # Add labware in A3, then adding vacuum should error
    protocol_editor.add_labware_to_slot("A3")
    protocol_editor.select_labware_category_by_name("Well plates")
    protocol_editor.select_labware_by_name(INCOMPATIBLE_LABWARE)
    protocol_editor.select_done()
    protocol_editor.select_deck_hardware()
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    deck_config_page.expect_snackbar("Module is incompatible with the labware in slot A3")

    # Remove labware, then add vacuum successfully
    protocol_editor.select_starting_deck()
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.select_deck_hardware()
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)

    # Remove vacuum module, add trash bin, replace trash with vacuum
    deck_config_page.remove_fixture("Vacuum")
    deck_config_page.select_slot("A3")
    deck_config_page.select_fixture("Trash bin")
    deck_config_page.remove_fixture("Trash")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)

    print("\n✓ Vacuum module deck configs validated")


@pytest.mark.pdE2E
def test_vacuum_module_set_up(page: Page) -> None:
    """Validate Vacuum Module starting-deck labware setup and stacking."""
    deck_config_page = DeckConfigPage(page)
    create_protocol = CreateProtocolWizard(page)
    protocol_editor = ProtocolEditorPage(page)

    create_new_protocol_from_landing_page(pipette="8-Channel", gripper=True, tc=True, waste_chute=True, page=page)
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    create_protocol.click_confirm()
    create_protocol.name_protocol("vacuum module set up")
    create_protocol.click_confirm()
    deck_config_page.enter_edit_mode()

    # Try to add a well plate with nothing else (non-compatible plate is blocked)
    protocol_editor.add_labware_to_slot("A3")
    protocol_editor.expect_labware_unavailable(INCOMPATIBLE_LABWARE, recommended_only=True)
    protocol_editor.cancel_labware_modal()
    protocol_editor.select_done()

    # Try to add non-recommended / incompatible labware with recommended filter off
    protocol_editor.add_labware_to_slot("A3")
    protocol_editor.expect_labware_unavailable(INCOMPATIBLE_LABWARE, recommended_only=False)
    protocol_editor.cancel_labware_modal()
    protocol_editor.select_done()

    # Add collection plate, then filter plate on top
    protocol_editor.add_labware_and_done("A3", COLLECTION_PLATE, "Well plates", recommended_only=True)
    protocol_editor.add_labware_and_done("A3", FILTER_PLATE, "Filter Plate", recommended_only=True)

    # Switch to tall collar
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", TALL_COLLAR, "Adapters", recommended_only=True)

    # Add / remove short and tall spacers on the main module
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", SHORT_SPACER, "Adapters", recommended_only=True)
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", TALL_SPACER, "Adapters", recommended_only=True)
    protocol_editor.clear_labware_from_slot("A3")
    protocol_editor.add_labware_and_done("A3", TALL_SPACER, "Adapters", recommended_only=True)
    protocol_editor.clear_labware_from_slot("A3")

    # Switch back to filter plate with short collar (dock)
    protocol_editor.add_labware_and_done(VACUUM_DOCK, SHORT_COLLAR, "Adapters", recommended_only=True)
    protocol_editor.add_labware_and_done(VACUUM_DOCK, FILTER_PLATE, "Filter Plate", recommended_only=True)

    # Add universal lid, then take it off
    protocol_editor.add_labware_and_done(
        "B2",
        COLLECTION_PLATE,
        "Well plates",
        lid=True,
        lid_name=UNIVERSAL_LID,
    )
    protocol_editor.clear_labware_from_slot("B2")

    print("\n✓ Vacuum module set up validated")


def _add_labware_with_liquid(
    editor: ProtocolEditorPage,
    slot: str,
    labware: str,
    category: str,
    liquid_name: str,
    liquid_class: str,
    volume: str,
    *,
    wells: list[str] | None = None,
    define: bool = True,
) -> None:
    """Add labware to a slot and assign liquid to wells."""
    editor.add_labware_to_slot(slot)
    editor.select_labware_category_by_name(category)
    editor.select_labware_by_name(labware)
    editor.edit_liquid()
    if wells is not None:
        editor.select_wells(wells)
    else:
        editor.select_first_well()
    if define:
        editor.define_liquid(liquid_name, liquid_class)
    editor.assign_liquid_to_wells(liquid_name, volume)
    editor.select_done()
    editor.select_done()


@pytest.mark.pdE2E
@pytest.mark.slow
@pytest.mark.timeout(1200)
def test_vacuum_module_protocol_execution(page: Page) -> None:
    """Build the VM test protocol in PD (deck, liquids, and steps)."""
    deck_config_page = DeckConfigPage(page)
    create_protocol = CreateProtocolWizard(page)
    editor = ProtocolEditorPage(page)
    transfer = TransferPage(page)
    vacuum = VacuumStepPage(page)

    # Match VM_test_in_PD: no TC, trash at D1, vacuum A3, HS A1, mag block D3
    create_new_protocol_from_landing_page(
        pipette="8-Channel",
        gripper=True,
        tc=False,
        waste_chute=False,
        page=page,
        volume="1000 µL",
        tip_racks=["Tip Rack 1000 µL", "Tip Rack 200 µL"],
    )
    deck_config_page.remove_fixture("Trash bin")
    deck_config_page.select_slot("D1")
    deck_config_page.select_fixture("Trash bin")
    deck_config_page.select_slot("A3")
    deck_config_page.select_module(VACUUM_MODULE)
    deck_config_page.select_slot("A1")
    deck_config_page.select_module("Heater-Shaker Module GEN1")
    deck_config_page.select_slot("D3")
    deck_config_page.select_module("Magnetic Block GEN1")
    create_protocol.click_confirm()
    create_protocol.name_protocol("VM test in PD")
    create_protocol.click_confirm()
    deck_config_page.enter_edit_mode()

    # Starting deck labware (vacuum stack uses recommended Tough PCR collection plate)
    editor.add_labware_and_done("A3", TALL_SPACER, "Adapters", recommended_only=True)
    editor.add_labware_and_done("A3", COLLECTION_PLATE, "Well plates", recommended_only=True)
    # NOTE: Blocked without SelectLabware amount reset — amount stays at stack length (2) while filter plate stackLimit is 1.
    # editor.add_labware_and_done("A3", FILTER_PLATE, "Filter Plate", recommended_only=True)
    editor.add_labware_and_done(VACUUM_DOCK, TALL_COLLAR, "Adapters", recommended_only=True)
    editor.add_labware_and_done("A2", TIPRACK_1000, "Tip racks")
    editor.add_labware_and_done("C1", TIPRACK_200, "Tip racks")
    _add_labware_with_liquid(editor, "C2", RESERVOIR, "Reservoirs", "aqueous", "Aqueous", "200000")
    _add_labware_with_liquid(
        editor,
        "B2",
        CORNING_FLAT,
        "Well plates",
        "volatile",
        "Volatile",
        "300",
        wells=ODD_COLUMNS,
    )
    _add_labware_with_liquid(editor, "C3", RESERVOIR, "Reservoirs", "viscous", "Viscous", "200000")
    editor.add_labware_and_done("B1", COLLECTION_PLATE, "Well plates")
    editor.add_labware_and_done("A1", HS_ADAPTER, "Adapters", recommended_only=True)

    print("✓ Deck and liquids configured")

    # NOTE: Skipped — depends on filter plate add above.
    # # Step 1: distribute aqueous → filter plate
    # add_transfer_step(
    #     editor,
    #     transfer,
    #     TransferStepConfig(
    #         tip_rack=TIPRACK_1000,
    #         source_labware=f"C2 {RESERVOIR}",
    #         dest_labware=FILTER_PLATE,
    #         source_wells="A1",
    #         dest_wells=COLUMN_WELLS,
    #         path="Distribute",
    #         volume="100",
    #         change_tip="Always",
    #         drop_location="Trash Bin",
    #         liquid_class="Aqueous",
    #     ),
    # )

    # Step 2: close vent
    add_vacuum_close_vent(editor, vacuum)

    # Step 3: move collar onto vacuum module
    editor.move_labware_with_gripper(TALL_COLLAR, VACUUM_MODULE_DEST)

    # Steps 4–5: pressure -800 for 00:30 with ending vent (auto-wait pause)
    add_vacuum_pressure_state(editor, vacuum, pressure_mbar="-800", duration="00:30", ending_hold_vent=True)

    # Steps 6–7: pressure -1 for 00:30 without ending vent
    add_vacuum_pressure_state(editor, vacuum, pressure_mbar="-1", duration="00:30", ending_hold_vent=False)

    # Step 8: move collar back to dock
    editor.move_labware_with_gripper(TALL_COLLAR, VACUUM_DOCK_DEST)

    # NOTE: Skipped — depends on filter plate add above.
    # # Step 9: move filter plate onto deck PCR plate (B1)
    # editor.move_labware_with_gripper(FILTER_PLATE, DECK_COLLECTION)

    # Step 10: transfer viscous → vacuum collection plate
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=f"C3 {RESERVOIR}",
            dest_labware=VACUUM_COLLECTION,
            source_wells="A1",
            dest_wells=COLUMN_WELLS,
            path="Single transfer",
            volume="100",
            change_tip="Once",
            drop_location="Trash Bin",
            liquid_class="Viscous",
        ),
    )

    # Step 11: transfer volatile → vacuum collection plate (odd columns)
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_200,
            source_labware=CORNING_FLAT,
            dest_labware=VACUUM_COLLECTION,
            source_wells=ODD_COLUMNS,
            dest_wells=ODD_COLUMNS,
            path="Single transfer",
            volume="100",
            change_tip="Once",
            drop_location="Trash Bin",
            liquid_class="Volatile",
        ),
    )

    # NOTE: Skipped — depends on filter plate add above.
    # # Step 12: move filter plate back onto vacuum collection plate
    # editor.move_labware_with_gripper(FILTER_PLATE, VACUUM_COLLECTION)

    # Step 13: move collar onto vacuum module
    editor.move_labware_with_gripper(TALL_COLLAR, VACUUM_MODULE_DEST)

    # Steps 14–16: power 100% for 00:30 with vent (auto-wait); concurrent transfer follows wait
    add_vacuum_power_state(editor, vacuum, percent_power=100, duration="00:30", ending_hold_vent=True)
    add_transfer_step(
        editor,
        transfer,
        TransferStepConfig(
            tip_rack=TIPRACK_1000,
            source_labware=f"C3 {RESERVOIR}",
            dest_labware=DECK_COLLECTION,
            source_wells="A1",
            dest_wells="A1",
            path="Single transfer",
            volume="200",
            change_tip="Once",
            drop_location="Trash Bin",
            liquid_class="Viscous",
        ),
    )

    # Steps 17–18: power 2% for 00:30 with vent
    add_vacuum_power_state(editor, vacuum, percent_power=2, duration="00:30", ending_hold_vent=True)

    # Steps 19–20: pressure profile (two cycles) with ending vent
    add_vacuum_pressure_profile(
        editor,
        vacuum,
        [
            VacuumProfileCycleConfig(
                steps=[
                    VacuumProfileStepConfig("1", "03:00", "-800", vent_after=True),
                    VacuumProfileStepConfig("2", "03:00", "-400", vent_after=False),
                ]
            ),
            VacuumProfileCycleConfig(
                steps=[
                    VacuumProfileStepConfig("1", "01:00", "-200", vent_after=False),
                    VacuumProfileStepConfig("2", "00:30", "-600", vent_after=False),
                    VacuumProfileStepConfig("3", "00:30", "0", vent_after=False),
                ]
            ),
        ],
        ending_hold_vent=True,
    )

    # Steps 21–23: indefinite holds
    add_vacuum_power_state(editor, vacuum, percent_power=47)
    add_vacuum_pressure_state(editor, vacuum, pressure_mbar="-200")
    add_vacuum_pressure_state(editor, vacuum, pressure_mbar="-200")

    # Step 24: pump off
    add_vacuum_pump_off(editor, vacuum)

    # Step 25: open HS latch
    editor.add_step("Heater-Shaker")
    _add_heater_shaker_latch_step(page, LidPosition.OPEN)

    # Step 26: move deck PCR plate onto HS adapter
    editor.move_labware_with_gripper(DECK_COLLECTION, HS_ADAPTER)

    # Step 27: close HS latch
    editor.add_step("Heater-Shaker")
    _add_heater_shaker_latch_step(page, LidPosition.CLOSED)

    # Steps 28–32: timed vacuum with concurrent HS shake + move, then wait
    add_vacuum_pressure_state(editor, vacuum, pressure_mbar="-700", duration="05:00", ending_hold_vent=False)
    editor.add_step("Heater-Shaker")
    _add_heater_shaker_step(page, "55", "2500", "00:02:50")
    editor.add_step("Heater-Shaker")
    _add_heater_shaker_latch_step(page, LidPosition.OPEN)
    editor.move_labware_with_gripper(COLLECTION_PLATE, "B1")  # from HS adapter back to B1

    # Step 33: open vent
    add_vacuum_open_vent(editor, vacuum)

    print("\n✓ Vacuum module protocol execution protocol created")
