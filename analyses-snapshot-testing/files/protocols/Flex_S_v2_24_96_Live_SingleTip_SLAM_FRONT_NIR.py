from dataclasses import dataclass
from typing import Any, Optional
from opentrons.protocol_api import SINGLE, COLUMN, PARTIAL_COLUMN, ROW, ALL

requirements = {"robotType": "Flex", "apiLevel": "2.24"}
metadata = {"protocolName": "96 Channel Slam Front"}

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


def add_parameters(parameters):
    parameters.add_str(
        display_name="Liquid Class",
        variable_name="liquid_class",
        default="water",
        description="Which Liquid Class to use.",
        choices=[
            {"display_name": "H₂O", "value": "water"},
            {"display_name": "80%% ethanol solution", "value": "ethanol_80"},
            {"display_name": "50%% glycerol solution", "value": "glycerol_50"},
        ],
    )

    parameters.add_str(
        display_name="Partial Tip Configuration",
        variable_name="partial_tip_config_key",
        default="ninety_six_single_front_right",
        description="Partial tip configurations described by pickup nozzle and tip count",
        choices=[  # value of each choice maps to the key of the partial tip config dataclass we defined
            {"display_name": "96 SINGLE nozzle H12", "value": "ninety_six_single_back_left"},
            {"display_name": "96 SINGLE nozzle H1", "value": "ninety_six_single_back_right"},
            {"display_name": "96 SINGLE nozzle A12", "value": "ninety_six_single_front_left"},
            {"display_name": "96 SINGLE nozzle A1", "value": "ninety_six_single_front_right"},
            {"display_name": "96 COLUMN 1", "value": "ninety_six_column_left"},
            {"display_name": "96 COLUMN 12", "value": "ninety_six_column_right"},
            {"display_name": "96 ROW A", "value": "ninety_six_row_back"},
            {"display_name": "96 ROW H", "value": "ninety_six_row_front"},
            {"display_name": "8 SINGLE", "value": "eight_single"},
            {"display_name": "8 PARTIAL 2 tips", "value": "eight_partial_back_2_tips"},
            {"display_name": "8 PARTIAL 3 tips", "value": "eight_partial_back_3_tips"},
            {"display_name": "8 PARTIAL 4 tips", "value": "eight_partial_back_4_tips"},
            {"display_name": "8 PARTIAL 5 tips", "value": "eight_partial_back_5_tips"},
            {"display_name": "8 PARTIAL 6 tips", "value": "eight_partial_back_6_tips"},
            {"display_name": "8 PARTIAL 7 tips", "value": "eight_partial_back_7_tips"},
            {"display_name": "No Partial tip config", "value": "no_tip_config"},
        ],
    )


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
    liquid_class_name = ctx.params.liquid_class
    liquid_class = ctx.get_liquid_class(liquid_class_name)
    volume = 105
    new_tip = "once"
    tip_config = find_partial_tip_config(ctx.params.partial_tip_config_key)
    ctx.comment(f"Running with {tip_config}")
    ctx.comment(f"This test uses the liquid class: {liquid_class_name}.")
    ctx.comment(f"It will transfer, consolidate, and distribute liquid using the 96 channel pipette.")
    ctx.comment(f"The volume we are using is {volume} μl and is less than the max volume of the 200 μl tip.")
    ctx.comment(f"The tip strategy is {new_tip}.")

    tiprack_B2 = ctx.load_labware(opentrons_flex_96_filtertiprack_200ul, "B2")
    tip_racks = [tiprack_B2]
    waste_chute_D3 = ctx.load_waste_chute()
    pipette_96 = ctx.load_instrument("flex_96channel_1000", "right", tip_racks=tip_racks)
    set_configure_nozzle_layout(ctx=ctx, pipette=pipette_96, tip_racks=tip_racks, tip_config=tip_config)

    # Liquids to transfer
    # Using a 15 mL reservoir as source
    # 1 row, 12 columns
    # https://labware.opentrons.com/#/?loadName=nest_12_reservoir_15ml
    source_A2 = ctx.load_labware("nest_12_reservoir_15ml", "A2", "source")
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
    water_source_well = source_A2.wells_by_name()[WATER_SOURCE_WELL]
    water_source_column = source_A2.columns()[0]
    ethanol_source_well = source_A2.wells_by_name()[ETHANOL_SOURCE_WELL]
    ethanol_source_column = source_A2.columns()[1]
    glycerol_source_well = source_A2.wells_by_name()[GLYCEROL_SOURCE_WELL]
    glycerol_source_column = source_A2.columns()[2]
    water_source_wells = [source_A2.wells_by_name()[well] for well in WATER_SOURCE_WELLS]
    water_source_column_wells = [source_A2.columns()[col] for col in WATER_SOURCE_COLUMNS]
    ethanol_source_wells = [source_A2.wells_by_name()[well] for well in ETHANOL_SOURCE_WELLS]
    ethanol_source_column_wells = [source_A2.columns()[col] for col in ETHANOL_SOURCE_COLUMNS]
    glycerol_source_wells = [source_A2.wells_by_name()[well] for well in GLYCEROL_SOURCE_WELLS]
    glycerol_source_column_wells = [source_A2.columns()[col] for col in GLYCEROL_SOURCE_COLUMNS]

    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")

    # Load liquids into source wells
    source_start_volume = 14000

    source_A2.load_liquid(wells=water_source_wells, liquid=water, volume=source_start_volume)
    source_A2.load_liquid(wells=ethanol_source_wells, liquid=ethanol, volume=source_start_volume)
    source_A2.load_liquid(wells=glycerol_source_wells, liquid=glycerol, volume=source_start_volume)

    # dest
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    dest_D2 = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")

    WATER_DEST_WELL = "H1"
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
    water_dest_well = dest_D2.wells_by_name()[WATER_DEST_WELL]
    ethanol_dest_well = dest_D2.wells_by_name()[ETHANOL_DEST_WELL]
    glycerol_dest_well = dest_D2.wells_by_name()[GLYCEROL_DEST_WELL]
    water_dest_column = dest_D2.columns()[WATER_DEST_COLUMN]
    ethanol_dest_column = dest_D2.columns()[ETHANOL_DEST_COLUMN]
    glycerol_dest_column = dest_D2.columns()[GLYCEROL_DEST_COLUMN]

    # Multi well and column variables
    water_dest_wells = [dest_D2.wells_by_name()[well] for well in WATER_DEST_WELLS]
    ethanol_dest_wells = [dest_D2.wells_by_name()[well] for well in ETHANOL_DEST_WELLS]
    glycerol_dest_wells = [dest_D2.wells_by_name()[well] for well in GLYCEROL_DEST_WELLS]
    water_dest_columns = [dest_D2.columns()[col] for col in WATER_DEST_COLUMNS]
    ethanol_dest_columns = [dest_D2.columns()[col] for col in ETHANOL_DEST_COLUMNS]
    glycerol_dest_columns = [dest_D2.columns()[col] for col in GLYCEROL_DEST_COLUMNS]

    # displays black in deck map
    dest_D2.load_empty(wells=dest_D2.wells())

    # Load liquids into source wells
    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")
    filled = ctx.define_liquid(name="Has Liquid", description="Not Empty", display_color="#FF69B4")

    if liquid_class_name == "water":
        liquid_type = water
        source_well = water_source_well
        source_column = water_source_column
        source_wells = water_source_wells
        source_column_wells = water_source_column_wells
        dest_well = water_dest_well
        dest_column = water_dest_column
        dest_wells = water_dest_wells
        dest_column_wells = water_dest_columns
    elif liquid_class_name == "ethanol_80":
        liquid_type = ethanol
        source_well = ethanol_source_well
        source_column = ethanol_source_column
        source_wells = ethanol_source_wells
        source_column_wells = ethanol_source_column_wells
        dest_well = ethanol_dest_well
        dest_column = ethanol_dest_column
        dest_wells = ethanol_dest_wells
        dest_column_wells = ethanol_dest_columns
    elif liquid_class_name == "glycerol_50":
        liquid_type = glycerol
        source_well = glycerol_source_well
        source_column = glycerol_source_column
        source_wells = glycerol_source_wells
        source_column_wells = glycerol_source_column_wells
        dest_well = glycerol_dest_well
        dest_column = glycerol_dest_column
        dest_wells = glycerol_dest_wells
        dest_column_wells = glycerol_dest_columns
    else:
        raise ValueError(f"Unknown liquid class: {liquid_class_name}")

    pipette_96.pick_up_tip()

    pipette_96.move_to(water_dest_well.top())

    pipette_96.drop_tip()
