def get_values(*names):
    import json

    _all_values = json.loads(
        """{"well_plate":"nest_96_wellplate_200ul_flat","pipette":"p20_single_gen2","tips":"opentrons_96_tiprack_20ul","pipette_mount":"right"}"""
    )
    return [_all_values[n] for n in names]


from opentrons.types import Point

metadata = {
    "protocolName": "OT-2 Guided Walk-through",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Custom Protocol Request",
    "apiLevel": "2.7",
}


def run(ctx):
    [well_plate, pipette, tips, pipette_mount] = get_values("well_plate", "pipette", "tips", "pipette_mount")  # noqa: F821

    # load labware
    plate = ctx.load_labware(well_plate, "1")
    tiprack = ctx.load_labware(tips, "2")

    # load instrument
    pip = ctx.load_instrument(pipette, pipette_mount, tip_racks=[tiprack])

    # protocol
    test_well = plate.wells()[0]

    pip.pick_up_tip()

    if well_plate == "corning_384_wellplate_112ul_flat":
        dimension = int(test_well.length) / 2

    elif well_plate == "nest_96_wellplate_2ml_deep":
        dimension = int(test_well.length) / 2

    elif well_plate == "usascientific_96_wellplate_2.4ml_deep":
        dimension = int(test_well.length) / 2

    else:
        dimension = int(test_well.diameter) / 2

    well_vol = test_well.geometry.max_volume
    vol = well_vol / 1.5 if well_vol < pip.max_volume else pip.max_volume / 1.5

    pip.move_to(plate["A1"].top())
    pip.aspirate(vol, test_well.bottom().move(Point(x=(dimension - 1.1))))
    pip.dispense(vol, test_well.top())
    pip.aspirate(vol, test_well.bottom().move(Point(x=((dimension - 1.1) * -1))))
    pip.dispense(vol, test_well.top())

    pip.mix(3, vol, test_well)

    pip.flow_rate.aspirate = 0.5 * pip.flow_rate.aspirate
    pip.flow_rate.dispense = 0.5 * pip.flow_rate.dispense
    for _ in range(2):
        pip.aspirate(vol, test_well)
        pip.dispense(vol, test_well.top())

    pip.flow_rate.aspirate = 4 * pip.flow_rate.aspirate
    pip.flow_rate.dispense = 4 * pip.flow_rate.dispense
    for _ in range(2):
        pip.aspirate(vol, test_well)
        pip.dispense(vol, test_well.top())

    for _ in range(2):
        pip.aspirate(vol, test_well)
        pip.touch_tip()
        pip.dispense(vol, test_well.top())

    for _ in range(2):
        pip.aspirate(vol, test_well)
        pip.dispense(vol, test_well.top())
        pip.blow_out()

    pip.flow_rate.blow_out = 0.5 * pip.flow_rate.blow_out
    pip.transfer(
        vol,
        plate.wells()[0],
        plate.wells()[16],
        blow_out=True,
        lowout_location="trash",
        new_tip="never",
    )
    pip.flow_rate.blow_out = 2 * pip.flow_rate.blow_out

    pip.drop_tip()
    pip.pick_up_tip()
    pip.move_to(plate["A1"].top())

    airgap = pip.max_volume / 3
    for _ in range(3):
        pip.aspirate(vol / 3, test_well)
        pip.air_gap(airgap)
        ctx.delay(seconds=5)
        pip.dispense(vol / 2 + airgap, test_well.top())

    airgap = pip.max_volume / 8
    for _ in range(2):
        pip.aspirate(vol / 8, plate.wells()[0])
        pip.air_gap(airgap)
    ctx.delay(seconds=5)
    pip.blow_out()
    pip.return_tip()
    pip.pick_up_tip()

    pip.consolidate(vol / 8, plate.wells()[0:8], plate.wells()[8], new_tip="never")

    pip.drop_tip()
    pip.pick_up_tip(tiprack.wells()[1])
    pip.distribute(vol / 8, plate.wells()[8], plate.wells()[0:8], new_tip="never")
    pip.drop_tip()
