# flake8: noqa
metadata = {"apiLevel": "2.11"}


def run(ctx):
    ctx.home()

    tiprack1 = ctx.load_labware_by_name("opentrons_96_tiprack_300ul", "1")
    tiprack2 = ctx.load_labware_by_name("opentrons_96_tiprack_300ul", "2")
    tiprack3 = ctx.load_labware("opentrons_96_filtertiprack_20ul", "3")
    tiprack4 = ctx.load_labware("opentrons_96_tiprack_20ul", "4")

    plate1 = ctx.load_labware("corning_96_wellplate_360ul_flat", "7")
    plate2 = ctx.load_labware("corning_96_wellplate_360ul_flat", "8")
    pip = ctx.load_instrument(
        "p20_single_gen2", mount="left", tip_racks=[tiprack3, tiprack4]
    )
    pip2 = ctx.load_instrument(
        "p300_single_gen2", mount="right", tip_racks=[tiprack1, tiprack2]
    )
    pip.transfer(
        10,
        plate1.wells("A1"),
        [
            plate2[well].top()
            for well in ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"]
        ],
    )
    pip2.transfer(
        50,
        plate1.wells("A2"),
        [
            plate2[well].bottom()
            for well in ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"]
        ],
    )
    # mix behavior
    pip.transfer(
        50,
        plate1.wells("A3"),
        [
            plate2[well].top()
            for well in ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"]
        ],
    )
