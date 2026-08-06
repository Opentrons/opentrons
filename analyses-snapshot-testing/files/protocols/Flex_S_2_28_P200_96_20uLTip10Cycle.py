"""96ch P200: alternating adapter vs bare 20µL racks; 10 cycles; SINGLE H12 partial."""

from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

metadata = {
    "protocolName": "96ch 20µL tip repeat cycles",
    "description": "Adapter D2 vs bare B2; H12 SINGLE; 10 cycles.",
}


def run(ctx: protocol_api.ProtocolContext):
    ctx.load_waste_chute()
    adapter_d2 = ctx.load_adapter("opentrons_flex_96_tiprack_adapter", "D2")
    tips_adapter = adapter_d2.load_labware("opentrons_flex_96_tiprack_20ul")
    tips_bare = ctx.load_labware("opentrons_flex_96_tiprack_20ul", "B2")

    pipette = ctx.load_instrument(
        "flex_96channel_200",
        "right",
        tip_racks=[tips_adapter, tips_bare],
    )

    bare_tip_order = [w for col in tips_bare.columns() for w in col]

    cycles = 10
    for n in range(cycles):
        ctx.comment(f"Static tip test cycle {n + 1} of {cycles}")

        pipette.configure_nozzle_layout(
            style=protocol_api.ALL,
            tip_racks=[tips_adapter, tips_bare],
        )
        pipette.pick_up_tip(tips_adapter.wells_by_name()["A1"])
        ctx.home()
        pipette.return_tip()

        pipette.configure_nozzle_layout(
            style=protocol_api.SINGLE,
            start="H12",
            tip_racks=[tips_bare],
        )
        pipette.pick_up_tip(bare_tip_order[n])
        ctx.home()
        pipette.drop_tip()
