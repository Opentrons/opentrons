from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "cold-1uL-photo"}
requirements = {"robotType": "Flex", "apiLevel": "2.20"}

LIQUID_NAME = "Diluent"
LIQUID_DESCRIPTION = "Artel MVS Diluent"
LIQUID_COLOR = "#0000FF"


def run(ctx: ProtocolContext) -> None:
    """Run."""

    ctx.load_trash_bin("A3")

    # (dye source) PCR plate, on a 96 adapter, on the temp-deck
    temp_mod = ctx.load_module(module_name="temperature module gen2", location="B3")
    temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    dye_source = temp_adapter.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt"
    )
    dye = ctx.define_liquid(
        name="Dye",
        description="Artel Range D (or E) Dye",
        display_color="#FF0000",
    )
    dye_source["D6"].load_liquid(dye, 96 + 20)

    # (diluent source)
    diluent_source = ctx.load_labware("nest_12_reservoir_15ml", "D2")
    diluent = ctx.define_liquid(
        name="Diluent",
        description="Artel MVS Diluent",
        display_color="#0000FF",
    )
    diluent_source["A1"].load_liquid(diluent, (8 * 199 * 6) + 3000)
    diluent_source["A2"].load_liquid(diluent, (8 * 199 * 6) + 3000)

    # (destination) empty MVS Artel plate
    destination = ctx.load_labware("corning_96_wellplate_360ul_flat", "D3")

    # (left) P50S using 50uL tips
    tips_50 = ctx.load_labware(f"opentrons_flex_96_tiprack_50uL", "C2")
    p50s = ctx.load_instrument("flex_1channel_50", "left", tip_racks=[tips_50])

    # (right) P1000M using 200uL tips
    tips_200 = ctx.load_labware(f"opentrons_flex_96_tiprack_200uL", "C3")
    p1000m = ctx.load_instrument("flex_8channel_1000", "right", tip_racks=[tips_200])

    # set module's temperature
    temp_mod.set_temperature(celsius=20.0)

    # spread diluent
    p1000m.pick_up_tip()
    for i in range(12):
        src_well = "A1" if i < 6 else "A2"
        p1000m.aspirate(199, diluent_source[src_well].bottom(1))
        p1000m.dispense(199, destination[f"A{i + 1}"].top(-1), push_out=20)
    p1000m.drop_tip()

    for well in destination.wells():
        p50s.pick_up_tip()
        p50s.aspirate(1, dye_source["D6"].bottom(1))
        p50s.dispense(1, well.bottom(4), push_out=2.5)
        p50s.drop_tip()

    temp_mod.set_temperature(celsius=20.0)
    temp_mod.deactivate()
