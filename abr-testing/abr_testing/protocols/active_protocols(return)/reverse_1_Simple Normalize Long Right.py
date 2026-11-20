"""Reverse companion for Simple Normalize Long with LPD and Single Tip.

Water-only ABR: mixed waste is recoverable. Restores reagent-reservoir starting
volumes from liquid waste and resets tip racks so the forward protocol can rerun
without manual liquid handling.
"""

from opentrons.protocol_api import ProtocolContext

metadata = {
    "protocolName": "Reverse Simple Normalize Long with LPD and Single Tip",
    "author": "Opentrons",
    "description": "Water-only reset after the matching forward protocol.",
}
requirements = {"robotType": "Flex", "apiLevel": "2.28"}


STARTING_REAGENT_VOLUME = 10800.0


def run(protocol: ProtocolContext) -> None:
    """Physically return all mixed water to the six reagent wells."""
    tiprack_multi = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    tiprack_single_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
    tiprack_single_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A1")
    for slot in ["D3", "C2", "B2", "A2"]:
        plate = protocol.load_labware(
            "armadillo_96_wellplate_200ul_pcr_full_skirt", slot
        )
        plate.load_empty(plate.wells())

    reservoir = protocol.load_labware("opentrons_tough_12_reservoir_22ml", "B3")
    reservoir.load_empty(reservoir.wells())
    waste = protocol.load_labware(
        "opentrons_tough_1_reservoir_300ml", "C1", "Liquid Waste"
    )
    mixed_water = protocol.define_liquid(
        "Mixed water waste",
        description="Recoverable output from the water-only forward protocol.",
        display_color="#808080",
    )
    waste["A1"].load_liquid(mixed_water, STARTING_REAGENT_VOLUME * 6)

    p1000_multi = protocol.load_instrument(
        "flex_8channel_1000", "left", tip_racks=[tiprack_multi]
    )
    p1000_single = protocol.load_instrument(
        "flex_1channel_1000",
        "right",
        tip_racks=[tiprack_single_1, tiprack_single_2],
    )

    protocol.comment("Returning mixed water from waste to all reagent wells.")
    p1000_single.pick_up_tip()
    p1000_single.liquid_presence_detection = False
    for destination in reservoir.wells()[:6]:
        remaining = STARTING_REAGENT_VOLUME
        while remaining > 0:
            chunk = min(remaining, 180.0)
            p1000_single.aspirate(chunk, waste["A1"].bottom(z=0.5))
            p1000_single.dispense(chunk, destination.top())
            remaining -= chunk
    p1000_single.return_tip()

    p1000_multi.reset_tipracks()
    p1000_single.reset_tipracks()
    protocol.comment(
        "Reset complete: plates and waste are empty, reagents are restored, "
        "and every tip is back in its rack."
    )
