from dataclasses import dataclass
from typing import Any, Optional
from opentrons.protocol_api import SINGLE, PARTIAL_COLUMN
import math

requirements = {"robotType": "Flex", "apiLevel": "2.24"}
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
    WATER_SOURCE_COLUMN = 0
    ETHANOL_SOURCE_WELL = "A2"
    ETHANOL_SOURCE_COLUMN = 1
    GLYCEROL_SOURCE_WELL = "A3"
    GLYCEROL_SOURCE_COLUMN = 2

    WATER_SOURCE_WELLS = [
        WATER_SOURCE_WELL,
        "A4",
        "A5",
        "A6",
    ]
    WATER_SOURCE_COLUMNS = [
        WATER_SOURCE_COLUMN,
        3,
        4,
        5,
    ]
    ETHANOL_SOURCE_WELLS = [
        ETHANOL_SOURCE_WELL,
        "A7",
        "A8",
        "A9",
    ]
    ETHANOL_SOURCE_COLUMNS = [
        ETHANOL_SOURCE_COLUMN,
        6,
        7,
        8,
    ]
    GLYCEROL_SOURCE_WELLS = [
        GLYCEROL_SOURCE_WELL,
        "A10",
        "A11",
        "A12",
    ]
    GLYCEROL_SOURCE_COLUMNS = [
        GLYCEROL_SOURCE_COLUMN,
        9,
        10,
        11,
    ]

    # the actual well(s) as variables
    water_source_well = source.wells_by_name()[WATER_SOURCE_WELL]
    water_source_column = source.columns()[0]
    ethanol_source_well = source.wells_by_name()[ETHANOL_SOURCE_WELL]
    ethanol_source_column = source.columns()[1]
    glycerol_source_well = source.wells_by_name()[GLYCEROL_SOURCE_WELL]
    glycerol_source_column = source.columns()[2]
    water_source_wells = [source.wells_by_name()[well] for well in WATER_SOURCE_WELLS]
    water_source_column_wells = [source.columns()[col] for col in WATER_SOURCE_COLUMNS]
    ethanol_source_wells = [source.wells_by_name()[well] for well in ETHANOL_SOURCE_WELLS]
    ethanol_source_column_wells = [source.columns()[col] for col in ETHANOL_SOURCE_COLUMNS]
    glycerol_source_wells = [source.wells_by_name()[well] for well in GLYCEROL_SOURCE_WELLS]
    glycerol_source_column_wells = [source.columns()[col] for col in GLYCEROL_SOURCE_COLUMNS]

    # Load liquids into source wells
    source_start_volume = 14000

    source.load_liquid(wells=water_source_wells, liquid=water, volume=source_start_volume)
    source.load_liquid(wells=ethanol_source_wells, liquid=ethanol, volume=source_start_volume)
    source.load_liquid(wells=glycerol_source_wells, liquid=glycerol, volume=source_start_volume)

    # dest
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    dest = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")

    WATER_DEST_WELL = "A1"
    WATER_DEST_COLUMN = 0
    ETHANOL_DEST_WELL = "A2"
    ETHANOL_DEST_COLUMN = 1
    GLYCEROL_DEST_WELL = "A3"
    GLYCEROL_DEST_COLUMN = 2

    WATER_DEST_WELLS = [WATER_DEST_WELL, "H4", "H5"]
    ETHANOL_DEST_WELLS = [ETHANOL_DEST_WELL, "H6", "H7"]
    GLYCEROL_DEST_WELLS = [GLYCEROL_DEST_WELL, "H8", "H9"]
    WATER_DEST_COLUMNS = [WATER_DEST_COLUMN, 3, 4]
    ETHANOL_DEST_COLUMNS = [ETHANOL_DEST_COLUMN, 6, 7]
    GLYCEROL_DEST_COLUMNS = [GLYCEROL_DEST_COLUMN, 9, 10]

    # Single well and column variables
    water_dest_well = dest.wells_by_name()[WATER_DEST_WELL]
    ethanol_dest_well = dest.wells_by_name()[ETHANOL_DEST_WELL]
    glycerol_dest_well = dest.wells_by_name()[GLYCEROL_DEST_WELL]
    water_dest_column = dest.columns()[WATER_DEST_COLUMN]
    ethanol_dest_column = dest.columns()[ETHANOL_DEST_COLUMN]
    glycerol_dest_column = dest.columns()[GLYCEROL_DEST_COLUMN]

    # Multi well and column variables
    water_dest_wells = [dest.wells_by_name()[well] for well in WATER_DEST_WELLS]
    ethanol_dest_wells = [dest.wells_by_name()[well] for well in ETHANOL_DEST_WELLS]
    glycerol_dest_wells = [dest.wells_by_name()[well] for well in GLYCEROL_DEST_WELLS]
    water_dest_columns = [dest.columns()[col] for col in WATER_DEST_COLUMNS]
    ethanol_dest_columns = [dest.columns()[col] for col in ETHANOL_DEST_COLUMNS]
    glycerol_dest_columns = [dest.columns()[col] for col in GLYCEROL_DEST_COLUMNS]

    # displays black in deck map
    dest.load_empty(wells=dest.wells())

    pipette_50 = ctx.load_instrument("flex_1channel_50", "right", tip_racks=filter_tipracks)
    pipette_8ch_50 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=tipracks)

    # Stock liquid classes
    water_class = ctx.get_liquid_class("water")
    ethanol_class = ctx.get_liquid_class("ethanol_80")
    glycerol_class = ctx.get_liquid_class("glycerol_50")

    volume = 44

    pipette_50.transfer_with_liquid_class(
        liquid_class=water_class,
        volume=volume,
        source=water_source_well,
        dest=water_dest_well,
        new_tip="once",
        trash_location=trash,
        group_wells=False,
    )

    dest_volume = water_dest_well.current_liquid_volume()
    assert math.isclose(volume, dest_volume, rel_tol=0.1, abs_tol=0.1), f"Expected volume {volume}, got {dest_volume}"

    actual_source_volume = water_source_well.current_liquid_volume()
    expected_source_volume = source_start_volume - volume
    assert math.isclose(
        expected_source_volume, actual_source_volume, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_source_volume}, got {actual_source_volume}"

    comment_labware_well_volume_status(ctx, dest)

    pipette_8ch_50.transfer_with_liquid_class(
        liquid_class=ethanol_class,
        volume=volume,
        source=ethanol_source_column,
        dest=ethanol_dest_column,
        new_tip="once",
        trash_location=trash,
    )

    for well in ethanol_dest_column:
        dest_volume = well.current_liquid_volume()
    assert math.isclose(volume, dest_volume, rel_tol=0.1, abs_tol=0.1), f"Expected volume {volume}, got {dest_volume}"

    actual_source_volume = ethanol_source_well.current_liquid_volume()
    expected_source_volume = source_start_volume - (volume * 8)
    assert math.isclose(
        expected_source_volume, actual_source_volume, rel_tol=0.1, abs_tol=0.1
    ), f"Expected volume {expected_source_volume}, got {actual_source_volume}"

    comment_labware_well_volume_status(ctx, dest)

    pipette_8ch_50.distribute_with_liquid_class(
        liquid_class=glycerol_class,
        volume=volume,
        source=water_source_column,
        dest=water_dest_columns,
        new_tip="once",
        trash_location=trash,
    )

    color_wells_with_liquid(dest, filled)
    comment_labware_well_volume_status(ctx, dest)
