from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

metadata = {
    "protocolName": "96ch 200µL stacker LC partial",
    "description": "GRIP stacker 200µL racks; ALL/COLUMN/SINGLE; liquid classes.",
}


def run(ctx: protocol_api.ProtocolContext):
    stacker = ctx.load_module("flexStackerModuleV1", "C4")
    waste = ctx.load_waste_chute()

    res = ctx.load_labware("agilent_1_reservoir_290ml", "B1", "Source Reservoir")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D1", "Dest Plate")

    full_adapter = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", "D2")

    stacker.set_stored_labware(
        load_name="opentrons_flex_96_tiprack_200ul",
        count=2,
        lid="opentrons_flex_tiprack_lid",
    )

    pipette = ctx.load_instrument("flex_96channel_200", "left")
    water_lc = ctx.get_liquid_class(name="water")
    glycerol_lc = ctx.get_liquid_class(name="glycerol_50")
    ethanol_lc = ctx.get_liquid_class(name="ethanol_80")
    lc = [water_lc, glycerol_lc, ethanol_lc]

    rack_full = stacker.retrieve()
    ctx.move_labware(rack_full, full_adapter, use_gripper=True)
    ctx.move_lid(rack_full, waste, use_gripper=True)

    rack_partial = stacker.retrieve()
    ctx.move_labware(rack_partial, "B3", use_gripper=True)
    ctx.move_lid(rack_partial, waste, use_gripper=True)

    for liquid_class in lc:
        ctx.comment(f"Testing Liquid Class: {liquid_class.name}")
        pipette.configure_nozzle_layout(
            style=protocol_api.ALL,
            tip_racks=[rack_full],
        )
        pipette.pick_up_tip(rack_full.wells_by_name()["A1"])

        pipette.transfer_with_liquid_class(
            volume=15,
            source=res.wells()[0],
            dest=plate.wells_by_name()["A1"],
            liquid_class=water_lc,
            new_tip="never",
            group_wells=False,
        )
        pipette.return_tip()

        pipette.configure_nozzle_layout(
            style=protocol_api.COLUMN,
            start="A12",
            tip_racks=[rack_partial],
        )
        pipette.pick_up_tip(rack_partial.wells_by_name()["A12"])

        pipette.transfer_with_liquid_class(
            volume=1,
            source=res.wells()[0],
            dest=plate.wells_by_name()["A12"],
            liquid_class=water_lc,
            new_tip="never",
            group_wells=False,
        )
        pipette.return_tip()

    pipette.configure_nozzle_layout(
        style=protocol_api.SINGLE,
        start="A1",
        tip_racks=[rack_partial],
    )
    pipette.pick_up_tip(rack_partial.wells_by_name()["A1"])

    found_height = pipette.detect_liquid_presence(plate.wells()[0])

    pipette.aspirate(volume=10, location=res["A1"])
    pipette.dispense(volume=10, location=plate.wells_by_name()["A3"].bottom(found_height - 1))
    pipette.touch_tip()
    pipette.blow_out()
    pipette.drop_tip()

    pipette.configure_nozzle_layout(
        style=protocol_api.ALL,
        tip_racks=[rack_full],
    )
