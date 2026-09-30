"""Reverse companion for Olink Target 48/96.

Water-only ABR: cross-contamination is acceptable. Replays the recoverable forward
transfers in reverse order, then moves every used column out of the used-tip racks
and back into the well it was picked from, so the next forward run starts from full
source racks and empty used-tip racks with no operator step in between.
"""

from typing import List

from opentrons.protocol_api import (
    ALL,
    COLUMN,
    SINGLE,
    Labware,
    ParameterContext,
    ProtocolContext,
    Well,
)

metadata = {
    "protocolName": "Reverse Olink Target 96/48 v3 Deck Safe",
    "author": "Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.28"}

# Must match the forward protocol.
USED_TIP_SLOTS = ["D2", "A4", "C4"]
PARK_SLOT = "D2"
SOURCE_PIPETTING_SLOT = "A1"
HOLDING_SLOTS = ("D3", "A4", "C4", "B4")


def add_parameters(parameters: ParameterContext) -> None:
    """Mirror the original run-selection parameters."""
    parameters.add_bool(
        variable_name="mmx_to_sample_plate",
        display_name="Original Step 1 Ran?",
        default=True,
    )
    parameters.add_bool(
        variable_name="ep_to_sample_plate",
        display_name="Original Step 2 Ran?",
        default=True,
    )
    parameters.add_bool(
        variable_name="primer_to_chip",
        display_name="Original Step 3 Ran?",
        default=True,
    )
    parameters.add_bool(
        variable_name="sample_to_chip",
        display_name="Original Step 4 Ran?",
        default=True,
    )
    parameters.add_int(
        variable_name="num_samples",
        display_name="Original Number of Samples",
        default=96,
        choices=[
            {"display_name": "96", "value": 96},
            {"display_name": "48", "value": 48},
        ],
    )
    parameters.add_int(
        variable_name="mm_col",
        display_name="Original Mastermix Column",
        default=0,
        choices=[
            {"display_name": str(index + 1), "value": index} for index in range(9)
        ],
    )
    parameters.add_bool(
        variable_name="waste_chute",
        display_name="Use Waste Chute?",
        default=False,
        description="Kept for RTP parity with the forward protocol; unused.",
    )


def run(protocol: ProtocolContext) -> None:
    """Return recoverable volumes, then restock the source tip racks."""
    ninety_six = protocol.params.num_samples == 96  # type: ignore[attr-defined]
    mmx_ran = protocol.params.mmx_to_sample_plate  # type: ignore[attr-defined]
    ep_ran = protocol.params.ep_to_sample_plate  # type: ignore[attr-defined]
    primer_ran = protocol.params.primer_to_chip  # type: ignore[attr-defined]
    sample_ran = protocol.params.sample_to_chip  # type: ignore[attr-defined]
    mm_col = protocol.params.mm_col  # type: ignore[attr-defined]

    pipette = protocol.load_instrument("flex_96channel_1000")

    tip_rack_homes: dict[Labware, str] = {}

    # Source racks are empty after the forward run; they receive the used tips.
    source_racks = []
    for index, slot in enumerate(["A1", "B3"] + (["B4"] if ninety_six else [])):
        rack = protocol.load_labware(
            "opentrons_flex_96_filtertiprack_50ul",
            slot,
            f"Tips per Column #{index + 1}",
        )
        rack.set_empty()
        source_racks.append(rack)
        tip_rack_homes[rack] = slot

    # Used-tip racks hold the columns the forward run consumed.
    used_tip_racks = []
    for index, slot in enumerate(USED_TIP_SLOTS[: 3 if ninety_six else 2]):
        rack = protocol.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", slot, f"Used Tips #{index + 1}"
        )
        used_tip_racks.append(rack)
        tip_rack_homes[rack] = slot

    full_tip = None
    if ninety_six:
        adapter = protocol.load_adapter("opentrons_flex_96_tiprack_adapter", "A3")
        full_tip_rack = adapter.load_labware(
            "opentrons_flex_96_filtertiprack_50ul", "Full 96 ch Tips"
        )
        full_tip = full_tip_rack["A1"]

    primer_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "B1", "Primer Plate"
    )
    sample_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "Sample Plate"
    )
    ifp_plate = protocol.load_labware(
        "biorad_384_wellplate_50ul" if ninety_six else "fluidigm_ifp_48.48",
        "C2",
        "IFP Chip",
    )
    product_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt",
        "C1",
        "Extension Product Plate",
    )
    mm_plate = protocol.load_labware(
        "opentrons_96_wellplate_200ul_pcr_full_skirt", "C3", "Mastermix Plate"
    )

    source_order = (
        [0, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5, 11] if ninety_six else [0, 3, 1, 4, 2, 5]
    )
    primer_sources = [primer_plate.rows()[0][index] for index in source_order]
    sample_sources = [sample_plate.rows()[0][index] for index in source_order]
    primer_dest_indices = (
        [0, 1, 16, 17, 32, 33, 48, 49, 64, 65, 80, 81]
        if ninety_six
        else [0, 1, 16, 17, 32, 33]
    )
    sample_dest_indices = (
        [96, 97, 112, 113, 128, 129, 144, 145, 160, 161, 176, 177]
        if ninety_six
        else [48, 49, 64, 65, 80, 81]
    )
    primer_chip_sources = [ifp_plate.wells()[i] for i in primer_dest_indices]
    sample_chip_sources = [ifp_plate.wells()[i] for i in sample_dest_indices]
    mastermix_destinations = sample_plate.rows()[0][: 12 if ninety_six else 6]
    mastermix_source = mm_plate.wells()[8 * mm_col]

    # Nominal recoverable volumes from the forward protocol (ifc_vol / EP / MM).
    ifc_vol = 5
    ep_vol = 2.8

    # Rebuild the forward pick/park order: one column for mastermix, then one per
    # IFP transfer for primers and samples, taken A1→A12 across the source racks.
    columns_per_step = 12 if ninety_six else 6
    used_columns = (
        (1 if mmx_ran else 0)
        + (columns_per_step if primer_ran else 0)
        + (columns_per_step if sample_ran else 0)
    )
    source_columns: List[Well] = []
    for rack in source_racks:
        source_columns.extend(rack.rows()[0])
    park_columns: List[Well] = []
    for rack in used_tip_racks:
        park_columns.extend(rack.rows()[0])

    chip_sample = protocol.define_liquid(
        name="IFP sample mixture",
        description="Original end-state sample aliquot",
        display_color="#0088FF",
    )
    chip_primer = protocol.define_liquid(
        name="IFP primer mixture",
        description="Original end-state primer aliquot",
        display_color="#00FF00",
    )
    sample_mix = protocol.define_liquid(
        name="Sample plate mixture",
        description="Mastermix and extension-product mixture",
        display_color="#FF8800",
    )
    for well in sample_chip_sources if sample_ran else []:
        well.load_liquid(chip_sample, ifc_vol)
    for well in primer_chip_sources if primer_ran else []:
        well.load_liquid(chip_primer, ifc_vol)
    for i, well in enumerate(mastermix_destinations):
        volume = (9.1 + i * 0.15 if mmx_ran else 0) + (ep_vol if ep_ran else 0)
        if volume:
            well.load_liquid(sample_mix, volume)

    def slot_of(rack: Labware) -> str:
        return str(rack.parent).strip()

    def free_holding_slot() -> str:
        occupied = {slot_of(rack) for rack in tip_rack_homes}
        for slot in HOLDING_SLOTS:
            if slot not in occupied:
                return slot
        raise RuntimeError("No free holding slot available for a tip rack")

    def place_on(rack: Labware, slot: str) -> None:
        """Put a tip rack on a slot, moving whatever sits there out of the way."""
        if slot_of(rack) == slot:
            return
        for other in tip_rack_homes:
            if other is not rack and slot_of(other) == slot:
                protocol.move_labware(other, free_holding_slot(), use_gripper=True)
                break
        protocol.move_labware(rack, slot, use_gripper=True)

    def restore_tip_rack_slots() -> None:
        """Return every tip rack to its home slot, breaking any move cycle."""
        for _ in range(2 * len(tip_rack_homes) + 4):
            misplaced = [r for r, home in tip_rack_homes.items() if slot_of(r) != home]
            if not misplaced:
                return
            progressed = False
            for rack in misplaced:
                home = tip_rack_homes[rack]
                if all(slot_of(o) != home for o in tip_rack_homes if o is not rack):
                    protocol.move_labware(rack, home, use_gripper=True)
                    progressed = True
            if not progressed:
                protocol.move_labware(
                    misplaced[0], free_holding_slot(), use_gripper=True
                )
        raise RuntimeError("Could not restore tip racks to their home slots")

    def working_tip() -> Well:
        """First used column — always reachable, and returned after each use."""
        tip = park_columns[0]
        place_on(tip.parent, PARK_SLOT)  # type: ignore[arg-type]
        return tip

    def reverse_column_transfers(
        sources: list, destinations: list, volume: float
    ) -> None:
        """Reuse the first used column (water ABR) and put it back afterwards."""
        tip = working_tip()
        pipette.configure_nozzle_layout(
            style=COLUMN, start="A12", tip_racks=used_tip_racks
        )
        pipette.pick_up_tip(tip)
        for source, destination in zip(reversed(sources), reversed(destinations)):
            pipette.aspirate(volume, source.bottom(1))
            pipette.dispense(volume, destination.bottom(1))
        pipette.return_tip()

    # Exact reverse dependency order of the original optional steps.
    if sample_ran:
        reverse_column_transfers(sample_chip_sources, sample_sources, ifc_vol)
    if primer_ran:
        reverse_column_transfers(primer_chip_sources, primer_sources, ifc_vol)

    if ep_ran:
        if ninety_six:
            pipette.configure_nozzle_layout(style=ALL)
            pipette.pick_up_tip(full_tip)
        else:
            tip = working_tip()
            pipette.configure_nozzle_layout(
                style=SINGLE, start="A1", tip_racks=used_tip_racks
            )
            pipette.pick_up_tip(tip)
        pipette.aspirate(ep_vol, sample_plate["A1"].bottom(1))
        pipette.dispense(ep_vol, product_plate["A1"].bottom(1))
        pipette.return_tip()

    if mmx_ran:
        tip = working_tip()
        pipette.configure_nozzle_layout(
            style=COLUMN, start="A12", tip_racks=used_tip_racks
        )
        pipette.pick_up_tip(tip)
        for i in reversed(range(12 if ninety_six else 6)):
            volume = 9.1 + i * 0.15
            pipette.aspirate(volume, mastermix_destinations[i].bottom(1))
            pipette.dispense(volume, mastermix_source.bottom(1))
        pipette.return_tip()

    # Restock: every used column goes back to the well the forward run took it
    # from. Both racks empty and fill left to right, so each move stays reachable.
    protocol.comment(f"\nRestocking {used_columns} used columns\n")
    pipette.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=used_tip_racks)
    for index in range(used_columns):
        park_well = park_columns[index]
        origin = source_columns[index]
        place_on(park_well.parent, PARK_SLOT)  # type: ignore[arg-type]
        if slot_of(origin.parent).endswith("4"):  # type: ignore[arg-type]
            place_on(origin.parent, SOURCE_PIPETTING_SLOT)  # type: ignore[arg-type]
        pipette.pick_up_tip(park_well)
        pipette.drop_tip(origin)

    restore_tip_rack_slots()
    pipette.reset_tipracks()
    protocol.comment(
        "Volumes returned and tips restocked; forward protocol can rerun as-is."
    )
