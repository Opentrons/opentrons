from dataclasses import dataclass
from typing import Any, Optional
from opentrons.protocol_api import SINGLE, PARTIAL_COLUMN
import math

requirements = {"robotType": "Flex", "apiLevel": "2.23"}
metadata = {"protocolName": "P50 8ch partial tip - transfer, distribute, consolidate, _liquid"}


def comment_labware_well_volume_status(ctx, labware):
    """
    Log the volume status for each well in a labware.

    Each row will print a line with the well name and its volume in microliters.

    Args:
        ctx: The protocol context, used to call `comment()`.
        labware: The labware object containing wells with volume info.
    """
    ctx.comment(f"Labware: {labware.name} on {labware.parent}")  # More readable identifier

    # Iterate over each row by index
    for row_index, row in enumerate(labware.rows()):
        status_line = ""
        for col_index, column in enumerate(labware.columns()):
            well = column[row_index]
            try:
                volume = well.current_liquid_volume()
            except:
                volume = "❌"
            status_line += f"{well.display_name.split(' of ')[0]}: {volume}  "
        ctx.comment(status_line)


def color_wells_with_liquid(labware, liquid):
    """
    Color the wells of a labware with a specific liquid.

    Args:
        labware: The labware object containing wells to be colored.
        liquid: The liquid object used to color the wells.
    """
    for well in labware.wells():
        try:
            volume = well.current_liquid_volume()
            if volume > 0:
                well.load_liquid(liquid=liquid, volume=volume)
        except:
            pass



def run(ctx):

    tiprack_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    tiprack_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B3")
    tiprack_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    filter_tiprack_1 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C1")
    filter_tiprack_2 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C2")
    filter_tiprack_3 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C3")
    tipracks = [tiprack_1, tiprack_2, tiprack_3]
    filter_tipracks = [filter_tiprack_1, filter_tiprack_2, filter_tiprack_3]
    trash = ctx.load_trash_bin("A3")

    # Liquids to transfer
    # Using a 15 mL reservoir as source
    # 1 row, 12 columns
    # https://labware.opentrons.com/#/?loadName=nest_12_reservoir_15ml
    source = ctx.load_labware("nest_12_reservoir_15ml", "B1", "source")

    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")
    filled = ctx.define_liquid(name="Has Liquid", description="Not Empty", display_color="#FF69B4")

    # Load liquids into source wells

    WATER_SOURCE_WELL = "A1"
    ETHANOL_SOURCE_WELL = "A2"
    GLYCEROL_SOURCE_WELL = "A3"

    WATER_SOURCE_WELLS = [
        "A4",
        "A5",
        "A6",
    ]
    ETHANOL_SOURCE_WELLS = [
        "A7",
        "A8",
        "A9",
    ]
    GLYCEROL_SOURCE_WELLS = [
        "A10",
        "A11",
        "A12",
    ]

    # Load liquids into source wells
    source_start_volume = 14000
    for well in WATER_SOURCE_WELLS + [WATER_SOURCE_WELL]:
        source.load_liquid(wells=[source.wells()], liquid=water, volume=source_start_volume)
    for well in ETHANOL_SOURCE_WELLS + [ETHANOL_SOURCE_WELL]:
        source.wells_by_name()[well].load_liquid(liquid=ethanol, volume=source_start_volume)
    for well in GLYCEROL_SOURCE_WELLS + [GLYCEROL_SOURCE_WELL]:
        source.wells_by_name()[well].load_liquid(liquid=glycerol, volume=source_start_volume)


    # dest
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    dest = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")

    WATER_TARGET_WELL = "A1"
    ETHANOL_TARGET_WELL = "A2"
    GLYCEROL_TARGET_WELL = "A3"

    WATER_TARGET_WELLS = ["H4", "H5"]
    ETHANOL_TARGET_WELLS = ["H6", "H7"]
    GLYCEROL_TARGET_WELLS = ["H8", "H9"]

    # displays black in deck map
    dest.load_empty(wells=dest.wells())

    pipette_50 = ctx.load_instrument("flex_1channel_50", "right", tip_racks=filter_tipracks)
    pipette_8ch_50 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=tipracks)


        # Stock liquid classes
    water_class = ctx.define_liquid_class("water")
    ethanol_class = ctx.define_liquid_class("ethanol_80")
    glycerol_class = ctx.define_liquid_class("glycerol_50")

    volume = 44

    pipette_50.transfer_liquid(
        liquid_class=water_class,
        volume=volume,
        source=source.wells_by_name()["A1"],
        dest=dest.wells_by_name()["A1"],
        new_tip="always",
        trash_location=trash,
        visit_every_well=True,
    )

    comment_labware_well_volume_status(ctx, dest)

    pipette_8ch_50.transfer_liquid(
        liquid_class=water_class,
        volume=volume,
        source=source.wells_by_name()["A1"],
        dest=dest.wells_by_name()["A2"],
        new_tip="always",
        trash_location=trash,
        visit_every_well=True,
    )

    comment_labware_well_volume_status(ctx, dest)

    pipette_8ch_50.consolidate_liquid(

    color_wells_with_liquid(dest, filled)
