# flake8: noqa

import random

from opentrons import protocol_api
from opentrons import types

metadata = {
    "ctxName": "gripper test with modules",
}

requirements = {"robotType": "OT-3", "apiLevel": "2.15"}


def run(protocol: protocol_api.ProtocolContext):
    # LABWARE AND MODULES

    heatershaker = protocol.load_module("heaterShakerModuleV1", location="D1")
    hs_pcr_adapter = heatershaker.load_adapter("opentrons_96_pcr_adapter")
    hs_deepwell_adapter = protocol.load_adapter(
        "opentrons_96_deep_well_adapter", location=protocol_api.OFF_DECK
    )

    temp_block = protocol.load_module("temperature module gen2", location="D3")
    temp_block_adapter = temp_block.load_adapter("opentrons_96_well_aluminum_block")

    thermocycler = protocol.load_module("thermocycler module gen2")
    mag_block = protocol.load_module("magneticBlockV1", location="C3")

    thermocycler.open_lid()

    # DECK SETUP AND LABWARE FOR PIPETTES
    pcr_plate = thermocycler.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")

    deepwell_plate = mag_block.load_labware("nest_96_wellplate_2ml_deep")

    plate_384_1 = protocol.load_labware("biorad_384_wellplate_50ul", location="C1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", location="B3")
    tiprack_50 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", location="A2")
    tiprack_200 = protocol.load_labware(
        "opentrons_flex_96_tiprack_200ul", location="B2"
    )
    tiprack_1000 = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", location="C2"
    )

    # LOAD PIPETTES
    p1000 = protocol.load_instrument(
        "flex_1channel_1000", "left", tip_racks=[tiprack_1000, tiprack_200, tiprack_50]
    )
    m1000 = protocol.load_instrument(
        "flex_8channel_1000", "right", tip_racks=[tiprack_1000, tiprack_200, tiprack_50]
    )

    # # GRIPPER MOVED
    def move_to_new_location(
        labware, slot, p_x_off=0, p_y_off=0, p_z_off=0, d_x_off=0, d_y_off=0, d_z_off=0
    ):
        protocol.move_labware(
            labware=labware,
            new_location=slot,
            use_gripper=True,
            pick_up_offset={"x": p_x_off, "y": p_y_off, "z": p_z_off},
            drop_offset={"x": d_x_off, "y": d_y_off, "z": d_z_off},
        )

    # PIPETTES COMMANDS
    m1000.pick_up_tip(tiprack_1000.wells_by_name()["A1"])
    m1000.aspirate(50, reservoir.wells_by_name()["A1"].bottom(z=3))
    m1000.dispense(50, pcr_plate.wells_by_name()["A1"].bottom(z=1.5))
    m1000.blow_out()
    m1000.drop_tip()

    m1000.pick_up_tip(tiprack_200.wells_by_name()["A1"])
    m1000.aspirate(50, reservoir.wells_by_name()["A2"].bottom(z=3))
    m1000.dispense(50, pcr_plate.wells_by_name()["A2"].bottom(z=1.5))
    m1000.blow_out()
    m1000.drop_tip()

    m1000.flow_rate.aspirate = 300
    m1000.flow_rate.dispense = 300
    m1000.flow_rate.blow_out = 300

    m1000.pick_up_tip(tiprack_50.wells_by_name()["A1"])
    m1000.aspirate(50, reservoir.wells_by_name()["A3"].bottom(z=3))
    m1000.dispense(50, pcr_plate.wells_by_name()["A3"].bottom(z=1.5))
    m1000.blow_out()
    m1000.drop_tip()

    m1000.pick_up_tip(tiprack_50.wells_by_name()["A2"])
    m1000.aspirate(25, reservoir.wells_by_name()["A4"].bottom(z=3))
    m1000.dispense(25, plate_384_1.wells_by_name()["A1"].bottom(z=1.5))
    m1000.blow_out()
    m1000.drop_tip()

    ############################################################################

    p1000.pick_up_tip(tiprack_1000.wells_by_name()["A2"])
    p1000.aspirate(50, reservoir.wells_by_name()["A1"].bottom(z=3))
    p1000.dispense(50, pcr_plate.wells_by_name()["A4"].bottom(z=1.5))
    p1000.blow_out()
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_200.wells_by_name()["A2"])
    p1000.aspirate(50, reservoir.wells_by_name()["A2"].bottom(z=3))
    p1000.dispense(50, pcr_plate.wells_by_name()["B4"].bottom(z=1.5))
    p1000.blow_out()
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50.wells_by_name()["A3"])
    p1000.aspirate(50, reservoir.wells_by_name()["A3"].bottom(z=3))
    p1000.dispense(50, pcr_plate.wells_by_name()["C4"].bottom(z=1.5))
    p1000.blow_out()
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50.wells_by_name()["B3"])
    p1000.aspirate(25, reservoir.wells_by_name()["A4"].bottom(z=3))
    p1000.dispense(25, plate_384_1.wells_by_name()["A2"].bottom(z=1.5))
    p1000.blow_out()
    p1000.drop_tip()

    # GRIPPER
    heatershaker.open_labware_latch()

    thermocycler.open_lid()

    move_to_new_location(pcr_plate, hs_pcr_adapter)
    heatershaker.close_labware_latch()
    heatershaker.deactivate_shaker()
    heatershaker.open_labware_latch()

    move_to_new_location(pcr_plate, temp_block_adapter)
    move_to_new_location(pcr_plate, 2)
    move_to_new_location(pcr_plate, thermocycler)

    ##############################################################################

    move_to_new_location(deepwell_plate, 2)
    move_to_new_location(deepwell_plate, mag_block)

    # Commented these out because they were trying to move tipracks to occupied locations
    move_to_new_location(tiprack_1000, slot="D2")
    move_to_new_location(tiprack_1000, slot="C2")
    #
