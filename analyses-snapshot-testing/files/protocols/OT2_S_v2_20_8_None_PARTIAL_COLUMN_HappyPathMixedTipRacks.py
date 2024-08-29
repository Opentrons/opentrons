from opentrons import protocol_api
from opentrons.protocol_api import PARTIAL_COLUMN

metadata = {
    "protocolName": "Partial Tip with Partial Column and Single Smoke",
    "description": "OT-2 protocol with 1ch and 8ch pipette partial/single tip configurations. Mixing tipracks and using separate tipracks. ",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.20",
}


def run(protocol: protocol_api.ProtocolContext):

    # DECK SETUP AND LABWARE
    partial_tiprack_1 = protocol.load_labware("opentrons_96_tiprack_300ul", "7")
    partial_tiprack_2 = protocol.load_labware("opentrons_96_tiprack_300ul", "8")
    sample_plate = protocol.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "2")
    reservoir_12 = protocol.load_labware("nest_12_reservoir_15ml", "1")
    reservoir_1 = protocol.load_labware("nest_1_reservoir_290ml", "3")

    p300_multi = protocol.load_instrument("p300_multi_gen2", mount="left", tip_racks=[partial_tiprack_1])
    p300_single = protocol.load_instrument("p300_single_gen2", mount="right", tip_racks=[partial_tiprack_2])

    p300_multi.configure_nozzle_layout(style=PARTIAL_COLUMN, start="H1", end="D1", tip_racks=[partial_tiprack_1])
    p300_multi.pick_up_tip()
    p300_multi.mix(3, 75, sample_plate["E1"])
    p300_multi.mix(3, 200, reservoir_12["A1"])
    p300_multi.mix(3, 200, reservoir_1["A1"])
    p300_multi.drop_tip()

    p300_multi.transfer(
        volume=150,
        source=sample_plate["E1"],  ##NOTE TO SELF THINK ABOUT THIS THE OFFSET SHOULD BE
        dest=sample_plate["E12"],
        new_tip="once",
    )

    p300_multi.configure_nozzle_layout(style=PARTIAL_COLUMN, start="H1", end="E1", tip_racks=[partial_tiprack_1])
    p300_multi.distribute(
        volume=300,
        source=reservoir_12["A12"],
        dest=[reservoir_12["A11"], reservoir_12["A10"], reservoir_12["A9"], reservoir_12["A8"], reservoir_12["A7"], reservoir_12["A6"]],
    )

    p300_multi.configure_nozzle_layout(style=PARTIAL_COLUMN, start="H1", end="F1", tip_racks=[partial_tiprack_1])
    p300_multi.consolidate(
        volume=25,
        source=[
            reservoir_12["A1"],
            reservoir_12["A2"],
            reservoir_12["A3"],
            reservoir_12["A4"],
            reservoir_12["A5"],
            reservoir_12["A6"],
        ],
        dest=reservoir_1["A1"],
    )

    p300_multi.pick_up_tip()
    p300_multi.touch_tip(reservoir_12["A7"])
    p300_multi.drop_tip()
    p300_multi.pick_up_tip()
    p300_multi.home()
    p300_multi.drop_tip()

    p300_multi.pick_up_tip()
    well = reservoir_12["A7"]
    # directly from docs http://sandbox.docs.opentrons.com/edge/v2/new_protocol_api.html#opentrons.protocol_api.InstrumentContext.prepare_to_aspirate
    p300_multi.move_to(well.bottom(z=2))
    p300_multi.mix(10, 10)
    p300_multi.move_to(well.top(z=5))
    p300_multi.blow_out()
    p300_multi.prepare_to_aspirate()
    p300_multi.move_to(well.bottom(z=2))
    p300_multi.aspirate(10, well.bottom(z=2))
    p300_multi.dispense(10)
    p300_multi.drop_tip()

    p300_single.transfer(volume=25, source=sample_plate["A1"], dest=sample_plate["A12"], new_tip="once")
    p300_single.distribute(
        volume=300,
        source=reservoir_12["A1"],
        dest=[reservoir_12["A2"], reservoir_12["A3"], reservoir_12["A4"], reservoir_12["A5"], reservoir_12["A6"], reservoir_12["A7"]],
    )

    p300_single.consolidate(
        volume=25,
        source=[
            reservoir_12["A6"],
            reservoir_12["A7"],
            reservoir_12["A8"],
            reservoir_12["A9"],
            reservoir_12["A10"],
            reservoir_12["A11"],
            reservoir_12["A12"],
        ],
        dest=reservoir_1["A1"],
    )

    try:
        while partial_tiprack_1 != None:
            for well in sample_plate.wells():
                p300_single.pick_up_tip(partial_tiprack_1)
                p300_single.aspirate(10, well)
                p300_single.dispense(10, well)
                p300_single.drop_tip()
    except:
        p300_single.home()
