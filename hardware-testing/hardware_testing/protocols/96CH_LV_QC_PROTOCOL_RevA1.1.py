# flake8: noqa

from opentrons import protocol_api
from opentrons import types
import random

metadata = {
    "protocolName": "96CH_LV_QC_Protocol_RevA1.1",
    "author": "Jon Klar <jonathan.klar@opentrons.com> (updated by RSS)",
}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}


def run(protocol: protocol_api.ProtocolContext):

    # DECK SETUP AND LABWARE
    pcr_plate = protocol.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt", "D1"
    )
    plate_396_1 = protocol.load_labware("biorad_384_wellplate_50ul", "A1")
    plate_396_2 = protocol.load_labware("biorad_384_wellplate_50ul", "D3")
    reservoir = protocol.load_labware("nest_1_reservoir_195ml", "C1")
    tiprack_50 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_50ul",
        location="C3",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tiprack_50_2 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_50ul",
        location="B3",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    tiprack_200 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_200ul",
        location="A2",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    trash_labware = protocol.load_trash_bin("A3")

    # LOAD PIPETTES
    p1000 = protocol.load_instrument("flex_96channel_200", "left")
    p1000.trash_container = trash_labware
    # COMMANDS

    p1000.pick_up_tip(tiprack_200.wells_by_name()["A1"])
    p1000.aspirate(200, reservoir.wells_by_name()["A1"])
    p1000.dispense(200, pcr_plate.wells_by_name()["A1"])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50.wells_by_name()["A1"])
    p1000.aspirate(10, reservoir.wells_by_name()["A1"])
    p1000.dispense(10, plate_396_1.wells_by_name()["A1"])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50_2.wells_by_name()["A1"])
    p1000.aspirate(1, reservoir.wells_by_name()["A1"])
    p1000.dispense(1, plate_396_2.wells_by_name()["A2"])
    p1000.drop_tip()
