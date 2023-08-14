# flake8: noqa

from opentrons import protocol_api
from opentrons import types
import random

metadata = {
    'ctxName': 'QC_Protocol',
    'author': 'Jon Klar <jonathan.klar@opentrons.com',
}
requirements = {
    'robotType': 'OT-3',
    'apiLevel': '2.15'
}




def run(protocol: protocol_api.ProtocolContext):


    # DECK SETUP AND LABWARE
    pcr_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt', 1)
    plate_396_1 = protocol.load_labware('biorad_384_wellplate_50ul', 10)
    plate_396_2 = protocol.load_labware('biorad_384_wellplate_50ul', 3)
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 4)
    tiprack_50 = protocol.load_labware('opentrons_ot3_96_tiprack_50ul_rss', 6)
    tiprack_50_2 = protocol.load_labware('opentrons_ot3_96_tiprack_50ul_rss', 9)
    tiprack_200 = protocol.load_labware('opentrons_ot3_96_tiprack_200ul_rss', 5)
    tiprack_200_2 = protocol.load_labware('opentrons_ot3_96_tiprack_200ul_rss', 8)
    tiprack_1000 = protocol.load_labware('opentrons_ot3_96_tiprack_1000ul_rss', 11)

    # LOAD PIPETTES
    p1000 = protocol.load_instrument("p1000_96", "left", tip_racks=[tiprack_1000, tiprack_200, tiprack_50])

    # COMMANDS

    p1000.pick_up_tip(tiprack_1000.wells_by_name()['A1'])
    p1000.aspirate(100, reservoir.wells_by_name()['A1'])
    p1000.dispense(100, pcr_plate.wells_by_name()['A1'])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_200.wells_by_name()['A1'])
    p1000.aspirate(25, reservoir.wells_by_name()['A1'])
    p1000.dispense(25, plate_396_1.wells_by_name()['A1'])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_200_2.wells_by_name()['A1'])
    p1000.aspirate(25, reservoir.wells_by_name()['A1'])
    p1000.dispense(25, plate_396_2.wells_by_name()['A2'])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50.wells_by_name()['A1'])
    p1000.aspirate(25, reservoir.wells_by_name()['A1'])
    p1000.dispense(25, plate_396_1.wells_by_name()['B1'])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50_2.wells_by_name()['A1'])
    p1000.aspirate(25, reservoir.wells_by_name()['A1'])
    p1000.dispense(25, plate_396_2.wells_by_name()['B2'])
    p1000.drop_tip()

