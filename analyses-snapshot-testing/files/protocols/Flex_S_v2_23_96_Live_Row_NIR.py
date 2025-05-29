from dataclasses import dataclass
from typing import Any, Optional
from opentrons.protocol_api import SINGLE, COLUMN, PARTIAL_COLUMN, ROW, ALL

requirements = {"robotType": "Flex", "apiLevel": "2.23"}
metadata = {"protocolName": "96 Channel Row"}

####### RTP DEFINITIONS #######
# NozzleConfigurationType is from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType
# do not want to import that as that interface or location might change
# type is not in shared-data
# cannot do the below
# ApiTipConfigType = Union[SINGLE, COLUMN, PARTIAL_COLUMN, ROW]


@dataclass
class PartialTipConfig:
    """Dataclass to hold a partial tip configuration descriptively."""

    key: str
    description: str
    starting_tip: str
    starting_nozzle: str
    api_tip_config: Any
    api_start: str
    api_end: Optional[str]

    def __str__(self):
        return (
            f"🔑 Key: {self.key} | 📝 Description: {self.description} | "
            f"💉 Starting Tip: {self.starting_tip} | 🔧 Starting Nozzle: {self.starting_nozzle} | "
            f"📜 API Tip Config: {self.api_tip_config} | 🚀 API Start: {self.api_start} | "
            f"🛑 API End: {self.api_end if self.api_end else 'None'}"
        )


#### Define all viable partial tip configurations.

# flex_96channel_1000 SINGLE
# names and descriptions describe where relative to the tiprack the pipette will pick up tips

ninety_six_single_back_left = PartialTipConfig(
    key="ninety_six_single_back_left",
    description="96 single picking up back left of tiprack",
    starting_tip="A1",
    starting_nozzle="H12",
    api_tip_config=SINGLE,
    api_start="H12",
    api_end=None,
)

ninety_six_single_back_right = PartialTipConfig(
    key="ninety_six_single_back_right",
    description="96 single picking up back right of tiprack",
    starting_tip="A12",
    starting_nozzle="H1",
    api_tip_config=SINGLE,
    api_start="H1",
    api_end=None,
)

ninety_six_single_front_left = PartialTipConfig(
    key="ninety_six_single_front_left",
    description="96 single picking up front left of tiprack",
    starting_tip="H1",
    starting_nozzle="A12",
    api_tip_config=SINGLE,
    api_start="A12",
    api_end=None,
)

ninety_six_single_front_right = PartialTipConfig(
    key="ninety_six_single_front_right",
    description="96 single picking up front right of tiprack",
    starting_tip="H12",
    starting_nozzle="A1",
    api_tip_config=SINGLE,
    api_start="A1",
    api_end=None,
)

# flex_96channel_1000 COLUMN

ninety_six_column_left = PartialTipConfig(
    key="ninety_six_column_left",
    description="96 column picking up left column of tiprack",
    starting_tip="Column 1",
    starting_nozzle="Column 12",
    api_tip_config=COLUMN,
    api_start="A12",
    api_end=None,
)


ninety_six_column_right = PartialTipConfig(
    key="ninety_six_column_right",
    description="96 column picking up right column of tiprack",
    starting_tip="Row 12",
    starting_nozzle="Row 1",
    api_tip_config=COLUMN,
    api_start="A1",
    api_end=None,
)

# flex_96channel_1000 ROW

ninety_six_row_back = PartialTipConfig(
    key="ninety_six_row_back",
    description="96 row picking up back row of tiprack",
    starting_tip="Row A",
    starting_nozzle="Row H",
    api_tip_config=ROW,
    api_start="H1",
    api_end=None,
)

ninety_six_row_front = PartialTipConfig(
    key="ninety_six_row_front",
    description="96 row picking up front row of tiprack",
    starting_tip="Row H",
    starting_nozzle="Row A",
    api_tip_config=ROW,
    api_start="A1",
    api_end=None,
)

# 8 channel SINGLE
eight_single = PartialTipConfig(
    key="eight_single",
    description="8 channel single picking up from the back left of the tiprack",
    starting_tip="A1",
    starting_nozzle="H1",
    api_tip_config=SINGLE,
    api_start="H1",
    api_end=None,
)

# PARTIAL_COLUMN
eight_partial_back_7_tips = PartialTipConfig(
    key="eight_partial_back_7_tips",
    description="8 channel picking up 7 tips",
    starting_tip="H1",
    starting_nozzle="B1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="B1",
)

eight_partial_back_6_tips = PartialTipConfig(
    key="eight_partial_back_6_tips",
    description="8 channel picking up 6 tips",
    starting_tip="H1",
    starting_nozzle="C1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="C1",
)
eight_partial_back_5_tips = PartialTipConfig(
    key="eight_partial_back_5_tips",
    description="8 channel picking up 5 tips",
    starting_tip="H1",
    starting_nozzle="D1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="D1",
)
eight_partial_back_4_tips = PartialTipConfig(
    key="eight_partial_back_4_tips",
    description="8 channel picking up 4 tips",
    starting_tip="H1",
    starting_nozzle="E1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="E1",
)
eight_partial_back_3_tips = PartialTipConfig(
    key="eight_partial_back_3_tips",
    description="8 channel picking up 3 tips",
    starting_tip="H1",
    starting_nozzle="F1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="F1",
)

eight_partial_back_2_tips = PartialTipConfig(
    key="eight_partial_back_2_tips",
    description="8 channel picking up 2 tips",
    starting_tip="H1",
    starting_nozzle="G1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="G1",
)

no_tip_config = PartialTipConfig(
    key="no_tip_config",
    description="Will discard and not set a partial tip config",
    starting_tip="",
    starting_nozzle="",
    api_tip_config=ALL,
    api_start="",
    api_end="",
)

# make a list of all the partial tip configurations

all_partial_configs = [
    ninety_six_single_back_left,
    ninety_six_single_back_right,
    ninety_six_single_front_left,
    ninety_six_single_front_right,
    ninety_six_column_left,
    ninety_six_column_right,
    ninety_six_row_back,
    ninety_six_row_front,
    eight_single,
    eight_partial_back_2_tips,
    eight_partial_back_3_tips,
    eight_partial_back_4_tips,
    eight_partial_back_5_tips,
    eight_partial_back_6_tips,
    eight_partial_back_7_tips,
    no_tip_config,
]


def find_partial_tip_config(key: str) -> Optional[PartialTipConfig]:
    """Find a partial tip config by key."""
    for config in all_partial_configs:
        if config.key == key:
            return config
    raise ValueError(f"Could not find partial tip config with key {key}")


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


def set_configure_nozzle_layout(ctx, pipette, tip_racks, tip_config):
    """Convenience function to set the nozzle layout of a pipette
    with the given tip config we have mapped to a RTP."""
    ctx.comment(f"Setting nozzle layout for {pipette}")
    ctx.comment(f"Tip config: {tip_config}")
    if tip_config.api_end:
        pipette.configure_nozzle_layout(
            style=tip_config.api_tip_config, start=tip_config.api_start, end=tip_config.api_end, tip_racks=tip_racks
        )
    else:
        pipette.configure_nozzle_layout(style=tip_config.api_tip_config, start=tip_config.api_start, tip_racks=tip_racks)


def run(ctx):
    # Stock liquid classes

    volume = 105
    new_tip = "never"
    # hardcode, don't RTP the tip config.
    tip_config = find_partial_tip_config("ninety_six_row_front")
    ctx.comment(f"Running with {tip_config}")
    ctx.comment(f"It will transfer, consolidate, and distribute liquid using the 96 channel pipette.")
    ctx.comment(f"The volume we are using is {volume} μl and is less than the max volume of the 200 μl tip.")
    ctx.comment(f"The tip strategy is {new_tip}.")

    tiprack_A3 = ctx.load_labware(opentrons_flex_96_filtertiprack_200ul, "A3")
    tip_racks = [tiprack_A3]
    waste_chute_D3 = ctx.load_waste_chute()
    pipette_96 = ctx.load_instrument("flex_96channel_1000", "right", tip_racks=tip_racks)
    set_configure_nozzle_layout(ctx=ctx, pipette=pipette_96, tip_racks=tip_racks, tip_config=tip_config)

    # Liquids to transfer
    # Using a 15 mL reservoir as source
    # 1 row, 12 columns
    # https://labware.opentrons.com/#/?loadName=nest_12_reservoir_15ml
    source_A2 = ctx.load_labware("nest_96_wellplate_2ml_deep", "A2", "source")
    # Load liquids into source wells

    WATER_SOURCE_ROW = 0
    ETHANOL_SOURCE_ROW = 2
    GLYCEROL_SOURCE_ROW = 4

    WATER_SOURCE_ROWS = [
        0,
        1,
    ]
    ETHANOL_SOURCE_ROWS = [2, 3]
    GLYCEROL_SOURCE_ROWS = [4, 5]

    water_source_row = source_A2.rows()[WATER_SOURCE_ROW]
    ethanol_source_row = source_A2.rows()[ETHANOL_SOURCE_ROW]
    glycerol_source_row = source_A2.rows()[GLYCEROL_SOURCE_ROW]
    water_source_rows = [source_A2.rows()[row] for row in WATER_SOURCE_ROWS]
    ethanol_source_rows = [source_A2.rows()[row] for row in ETHANOL_SOURCE_ROWS]
    glycerol_source_rows = [source_A2.rows()[row] for row in GLYCEROL_SOURCE_ROWS]

    # dest
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    dest_B2 = ctx.load_labware("nest_96_wellplate_2ml_deep", "B2")

    WATER_DEST_ROW = 0
    ETHANOL_DEST_ROW = 2
    GLYCEROL_DEST_ROW = 4

    WATER_DEST_ROWS = [WATER_DEST_ROW, 1]
    ETHANOL_DEST_ROWS = [ETHANOL_DEST_ROW, 3]
    GLYCEROL_DEST_ROWS = [GLYCEROL_DEST_ROW, 5]

    # Single well and column variables
    water_dest_row = dest_B2.rows()[WATER_DEST_ROW]
    ethanol_dest_row = dest_B2.rows()[ETHANOL_DEST_ROW]
    glycerol_dest_row = dest_B2.rows()[GLYCEROL_DEST_ROW]

    water_dest_rows = [dest_B2.rows()[row] for row in WATER_DEST_ROWS]
    ethanol_dest_rows = [dest_B2.rows()[row] for row in ETHANOL_DEST_ROWS]
    glycerol_dest_rows = [dest_B2.rows()[row] for row in GLYCEROL_DEST_ROWS]

    liquid_class_names = [
        "water",
        "ethanol_80",
        "glycerol_50",
    ]

    pipette_96.pick_up_tip()

    for liquid_class_name in liquid_class_names:
        ctx.comment(f"Liquid class: {liquid_class_name}")
        liquid_class = ctx.define_liquid_class(liquid_class_name)

        if liquid_class_name == "water":
            source_row = water_source_row
            source_rows = water_source_rows
            dest_row = water_dest_row
            dest_rows = water_dest_rows
        elif liquid_class_name == "ethanol_80":
            source_row = ethanol_source_row
            source_rows = ethanol_source_rows
            dest_row = ethanol_dest_row
            dest_rows = ethanol_dest_rows
        elif liquid_class_name == "glycerol_50":
            source_row = glycerol_source_row
            source_rows = glycerol_source_rows
            dest_row = glycerol_dest_row
            dest_rows = glycerol_dest_rows
        else:
            raise ValueError(f"Unknown liquid class: {liquid_class_name}")

        pipette_96.transfer_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=source_row,
            dest=dest_row,
            new_tip=new_tip,
            trash_location=waste_chute_D3,
        )

        pipette_96.consolidate_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=source_rows,
            dest=dest_row,
            new_tip=new_tip,
            trash_location=waste_chute_D3,
        )

        pipette_96.distribute_with_liquid_class(
            liquid_class=liquid_class,
            volume=volume,
            source=source_row,
            dest=dest_rows,
            new_tip=new_tip,
            trash_location=waste_chute_D3,
        )

    pipette_96.drop_tip()
