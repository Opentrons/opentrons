requirements = {"robotType": "Flex", "apiLevel": "2.24"}
metadata = {"protocolName": "96 Channel Full Config Live Test NEVER"}


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


def run(ctx):
    # Stock liquid classes

    volume = 105
    new_tip = "never"

    ctx.comment(f"It will transfer, consolidate, and distribute liquid using the 96 channel pipette.")
    ctx.comment(f"The volume we are using is {volume} μl and is less than the max volume of the 200 μl tip.")
    ctx.comment(f"The tip strategy is {new_tip}.")

    tiprack_A1 = ctx.load_labware(opentrons_flex_96_filtertiprack_200ul, "A1", adapter="opentrons_flex_96_tiprack_adapter")
    tip_racks = [
        tiprack_A1,
    ]
    waste_chute_D3 = ctx.load_waste_chute()
    pipette_96 = ctx.load_instrument("flex_96channel_1000", "right", tip_racks=tip_racks)

    # Load liquids into source wells
    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")
    filled = ctx.define_liquid(name="Has Liquid", description="Not Empty", display_color="#FF69B4")

    liquid_class_names = [
        "water",
        "ethanol_80",
        "glycerol_50",
    ]

    pipette_96.pick_up_tip()

    for liquid_class_name in liquid_class_names:
        ctx.comment(f"Liquid class: {liquid_class_name}")
        liquid_class = ctx.get_liquid_class(liquid_class_name)
        if liquid_class_name == "water":
            liquid_type = water
        elif liquid_class_name == "ethanol_80":
            liquid_type = ethanol
        elif liquid_class_name == "glycerol_50":
            liquid_type = glycerol
        else:
            raise ValueError(f"Unknown liquid class: {liquid_class_name}")

        source_B1 = ctx.load_labware(nest_1_reservoir_290ml, "B1", liquid_class_name)
        source_B2 = ctx.load_labware(nest_1_reservoir_290ml, "B2", liquid_class_name)
        sources = [
            source_B1,
            source_B2,
        ]
        SOURCE_WELL = "A1"  # These are single well reservoirs

        for source in sources:
            source.load_liquid(wells=source.wells(), liquid=liquid_type, volume=200000)

        dest_C1 = ctx.load_labware("nest_96_wellplate_2ml_deep", "C1", f"{liquid_class_name} destination C1")
        dest_C2 = ctx.load_labware("nest_96_wellplate_2ml_deep", "C2", f"{liquid_class_name} destination C2")

        destinations = [dest_C1, dest_C2]
        for dest in destinations:
            dest.load_empty(wells=dest.wells())

        pipette_96.transfer_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=source_B1.wells(),
            dest=dest_C1.wells(),
            new_tip=new_tip,
            trash_location=waste_chute_D3,
        )

        comment_labware_well_volume_status(ctx, source_B1)
        comment_labware_well_volume_status(ctx, dest_C1)

        pipette_96.consolidate_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=[source_B1.wells(), source_B2.wells()],
            dest=dest_C2.wells(),
            new_tip=new_tip,
            trash_location=waste_chute_D3,
        )

        comment_labware_well_volume_status(ctx, source_B1)
        comment_labware_well_volume_status(ctx, source_B2)
        comment_labware_well_volume_status(ctx, dest_C2)

        pipette_96.distribute_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=source_B1.wells(),
            dest=[dest_C1.wells(), dest_C2.wells()],
            new_tip=new_tip,
            trash_location=waste_chute_D3,
        )

        comment_labware_well_volume_status(ctx, source_B1)
        comment_labware_well_volume_status(ctx, dest_C1)
        comment_labware_well_volume_status(ctx, dest_C2)

        for dest in destinations:
            color_wells_with_liquid(dest, filled)

    pipette_96.return_tip()
