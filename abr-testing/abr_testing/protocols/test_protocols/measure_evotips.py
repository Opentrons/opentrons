"""Measure Evotips Protocol Results."""

from opentrons.protocol_api import ProtocolContext, SINGLE
from opentrons.protocol_api.module_contexts import HeaterShakerContext

metadata = {
    "protocolName": "Measure Evotips Result with 96-ch Pipette",
    "author": "Rhyann Clarke, Opentrons",
    "description": "",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.22",
}


def run(protocol: ProtocolContext) -> None:
    """Measure Evotips Protocol."""
    hs: HeaterShakerContext = protocol.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_96_pcr_adapter")
    trash_plate = hs_adapter.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", label="Trash"
    )
    p1k_96 = protocol.load_instrument("flex_96channel_1000")
    partial_tiprack = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C3")
    protocol.load_trash_bin("A3")
    hs.close_labware_latch()
    hs.set_and_wait_for_shake_speed(1000)
    protocol.delay(seconds=60)
    hs.deactivate_shaker()
    p1k_96.configure_nozzle_layout(
        style=SINGLE, start="H12", tip_racks=[partial_tiprack]
    )
    column_1_wells = trash_plate.columns()[0]
    column_12_wells = trash_plate.columns()[11]
    column_1_wells.extend(column_12_wells)
    all_heights = {}
    for well in column_1_wells:
        p1k_96.pick_up_tip()
        liq_height = p1k_96.measure_liquid_height(well)
        well_str = well.display_name.split(" ")[0]
        all_heights[well_str] = liq_height
        p1k_96.drop_tip()
    protocol.comment(str(all_heights))
