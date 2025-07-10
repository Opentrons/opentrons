from opentrons import protocol_api


requirements = {"robotType": "Flex", "apiLevel": "2.23"}
metadata = {"protocolName": "Change Me"}


def comment_tip_rack_status(ctx, tip_rack):
    """
    Print out the tip status for each row in a tip rack.
    Each row (A-H) will print the well statuses for columns 1-12 in a single comment,
    with a '🟢' for present tips and a '❌' for missing tips.
    """
    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    range_1_to_12 = range(1, 13)

    ctx.comment(f"Tip rack in {tip_rack.parent}")

    for row in range_A_to_H:
        status_line = f"{row}: "
        for col in range_1_to_12:
            well = f"{row}{col}"
            has_tip = tip_rack.wells_by_name()[well].has_tip
            status_emoji = "🟢" if has_tip else "❌"
            status_line += f"{well} {status_emoji}  "

        # Print the full status line for the row
        ctx.comment(status_line)


def is_tip_rack_empty(tip_rack):
    """
    Check if a tip rack is completely empty.

    Args:
        tip_rack: An Opentrons tip rack labware object

    Returns:
        bool: True if the tip rack has no tips, False if it has at least one tip
    """
    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    range_1_to_12 = range(1, 13)

    for row in range_A_to_H:
        for col in range_1_to_12:
            well = f"{row}{col}"
            if tip_rack.wells_by_name()[well].has_tip:
                return False

    return True


def is_missing_tips(tip_rack):
    """
    Check if a tip rack is missing any tips.

    Args:
        tip_rack: An Opentrons tip rack labware object

    Returns:
        bool: True if the tip rack is missing at least one tip, False if all tips are present
    """
    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    range_1_to_12 = range(1, 13)

    for row in range_A_to_H:
        for col in range_1_to_12:
            well = f"{row}{col}"
            if not tip_rack.wells_by_name()[well].has_tip:
                return True

    return False


def using_96_channel(ctx) -> bool:
    """Check if a 96-channel pipette is loaded in the protocol."""
    for instrument in ctx.loaded_instruments.values():
        if instrument.channels == 96:
            ctx.comment("9️⃣6️⃣ channel pipette is loaded")
            return True
    return False


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


# Flex tiprack loadnames

opentrons_flex_96_tiprack_50ul = "opentrons_flex_96_tiprack_50ul"
opentrons_flex_96_filtertiprack_50ul = "opentrons_flex_96_filtertiprack_50ul"
opentrons_flex_96_tiprack_200ul = "opentrons_flex_96_tiprack_200ul"
opentrons_flex_96_filtertiprack_200ul = "opentrons_flex_96_filtertiprack_200ul"
opentrons_flex_96_tiprack_1000ul = "opentrons_flex_96_tiprack_1000ul"
opentrons_flex_96_filtertiprack_1000ul = "opentrons_flex_96_filtertiprack_1000ul"

# Flex pipette adapter for 96 channel loadname
opentrons_flex_96_tiprack_adapter = "opentrons_flex_96_tiprack_adapter"

# Flex pipette loadnames
flex_96channel_1000 = "flex_96channel_1000"
flex_1channel_50 = "flex_1channel_50"
flex_1channel_1000 = "flex_1channel_1000"
flex_8channel_1000 = "flex_8channel_1000"
flex_8channel_50 = "flex_8channel_50"

# Labware loadnames
# 1 row, 12 columns
# https://labware.opentrons.com/#/?loadName=nest_12_reservoir_15ml
nest_12_reservoir_15ml = "nest_12_reservoir_15ml"
# https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
nest_96_wellplate_2ml_deep = "nest_96_wellplate_2ml_deep"
# https://labware.opentrons.com/#/?loadName=nest_1_reservoir_290ml
nest_1_reservoir_290ml = "nest_1_reservoir_290ml"


def run(ctx: protocol_api.ProtocolContext):

    trash = ctx.load_trash_bin("A3")

    source = ctx.load_labware("nest_12_reservoir_15ml", "B1", "source")

    # Here are some liquid definitions to use so that liquids show up on the deck map.
    # These have nothing to do with Liquid Classes!!!
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

    # source variables to use
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

    # This colors the wells AND  makes liquid tracking possible
    source.load_liquid(wells=water_source_wells, liquid=water, volume=source_start_volume)
    source.load_liquid(wells=ethanol_source_wells, liquid=ethanol, volume=source_start_volume)
    source.load_liquid(wells=glycerol_source_wells, liquid=glycerol, volume=source_start_volume)

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

    # When using the full 96-channel pipette
    # We must use the whole plate

    water_source_1 = ctx.load_labware(nest_1_reservoir_290ml, "B1", "water")
    water_source_2 = ctx.load_labware(nest_1_reservoir_290ml, "C1", "water")
    water_source_3 = ctx.load_labware(nest_1_reservoir_290ml, "D1", "water")

    water_dest_1 = ctx.load_labware(nest_96_wellplate_2ml_deep, "B2", "water")
    water_dest_2 = ctx.load_labware(nest_96_wellplate_2ml_deep, "C2", "water")
    water_dest_3 = ctx.load_labware(nest_96_wellplate_2ml_deep, "D2", "water")
