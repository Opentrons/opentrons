"""Smoke Test v3.0 """
from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - API 2.16 - Aspirate Dispense Mix with 0 Volume",
    "author": "Opentrons Engineering <engineering@opentrons.com>",
    "source": "Software Testing Team",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.16"}


def perform_check(
    method_sig: str,
    actual: float,
    expected: float,
):
    """Perform a check on the pipette's current volume."""
    assert actual == expected, f"pipette volume after {method_sig} is {actual} instead of {expected}"


def run(ctx: protocol_api.ProtocolContext) -> None:
    """This method is run by the protocol engine."""

    ctx.set_rail_lights(True)

    # deck positions
    tips_300ul_position = "5"
    tips_20ul_position = "4"
    dye_source_position = "3"

    # 300ul tips
    tips_300ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_300ul",
            location=tips_300ul_position,
            label="300ul tips",
        )
    ]

    # 20ul tips
    tips_20ul = [
        ctx.load_labware(
            load_name="opentrons_96_tiprack_20ul",
            location=tips_20ul_position,
            label="20ul tips",
        )
    ]

    # pipettes
    ctx.load_instrument(instrument_name="p300_multi_gen2", mount="left", tip_racks=tips_300ul)

    pipette_right = ctx.load_instrument(instrument_name="p20_single_gen2", mount="right", tip_racks=tips_20ul)

    dye_container = ctx.load_labware(
        load_name="nest_12_reservoir_15ml",
        location=dye_source_position,
        label="dye container",
    )

    water = ctx.define_liquid(
        name="water", description="H₂O", display_color="#42AB2D"
    )  # subscript 2 https://www.compart.com/en/unicode/U+2082

    dye_container.wells_by_name()["A1"].load_liquid(liquid=water, volume=20)

    pipette_right.pick_up_tip()

    # Testing that volume=0 is a no-op
    # In API versions previous to 2.16, volume=0 would use the pipette's entire volume

    # Aspirate nothing, then dispense everything (Which in this case means nothing)
    pipette_right.aspirate(volume=0, location=dye_container.wells_by_name()["A1"])
    perform_check(
        method_sig="aspirate(volume=0)",
        actual=pipette_right.current_volume,
        expected=0.0,
    )

    pipette_right.dispense(location=dye_container.wells_by_name()["A1"])
    perform_check(
        method_sig="dispense(volume=0)",
        actual=pipette_right.current_volume,
        expected=0.0,
    )

    # Aspirate full pipette volume, dispense nothing, mix nothing
    pipette_right.aspirate(volume=20, location=dye_container.wells_by_name()["A1"])
    perform_check(
        method_sig="aspirate(volume=20)",
        actual=pipette_right.current_volume,
        expected=20.0,
    )

    pipette_right.dispense(volume=0, location=dye_container.wells_by_name()["A1"])
    perform_check(
        method_sig="dispense(volume=0)",
        actual=pipette_right.current_volume,
        expected=20.0,
    )

    pipette_right.mix(volume=0, location=dye_container.wells_by_name()["A1"])
    perform_check(
        method_sig="mix(volume=0)",
        actual=pipette_right.current_volume,
        expected=20.0,
    )
