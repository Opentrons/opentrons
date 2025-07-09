from dataclasses import dataclass
from typing import Any, Optional
from opentrons.protocol_api import SINGLE, PARTIAL_COLUMN

requirements = {"robotType": "Flex", "apiLevel": "2.24"}
metadata = {"protocolName": "P50 8ch partial tip - transfer, distribute, consolidate, _liquid"}

# tip_config_key = "eight_single"
# tip_config_key = "eight_partial_back_2_tips"
# tip_config_key = "eight_partial_back_3_tips"
# tip_config_key = "eight_partial_back_4_tips"
# tip_config_key = "eight_partial_back_5_tips"
# tip_config_key = "eight_partial_back_6_tips"
# tip_config_key = "eight_partial_back_7_tips"


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


all_partial_configs = [
    eight_single,
    eight_partial_back_2_tips,
    eight_partial_back_3_tips,
    eight_partial_back_4_tips,
    eight_partial_back_5_tips,
    eight_partial_back_6_tips,
    eight_partial_back_7_tips,
]


def find_partial_tip_config(key: str) -> Optional[PartialTipConfig]:
    """Find a partial tip config by key."""
    for config in all_partial_configs:
        if config.key == key:
            return config
    raise ValueError(f"Could not find partial tip config with key {key}")


def set_configure_nozzle_layout(ctx, pipette, tipracks, tip_config):
    """Convenience function to set the nozzle layout of a pipette
    with the given tip config we have mapped to a RTP."""
    ctx.comment(f"Setting nozzle layout for {pipette}")
    ctx.comment(f"Tip config: {tip_config}")
    if tip_config.api_end:
        pipette.configure_nozzle_layout(
            style=tip_config.api_tip_config, start=tip_config.api_start, end=tip_config.api_end, tip_racks=tipracks
        )
    else:
        pipette.configure_nozzle_layout(style=tip_config.api_tip_config, start=tip_config.api_start, tip_racks=tipracks)


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


def well_name(well) -> str:
    """Extract the well name from a full display name string.

    Args:
        display_name (str): A string like "A1 of Corning 96 Well Plate..."

    Returns:
        str: The well name (e.g., "A1")
    """
    return well.display_name.split(" of ")[0]


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
                volume = "???"
            status_line += f"{well.display_name.split(' of ')[0]}: {volume} μl  "
        ctx.comment(status_line)


def run(ctx):
    # Stock liquid classes
    water_class = ctx.get_liquid_class("water")
    ethanol_class = ctx.get_liquid_class("ethanol_80")
    glycerol_class = ctx.get_liquid_class("glycerol_50")

    tiprack_1 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    tiprack_2 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B3")
    tiprack_3 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    filter_tiprack_1 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C1")
    filter_tiprack_2 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C2")
    filter_tiprack_3 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C3")
    tipracks = [tiprack_1, tiprack_2, tiprack_3]
    # tipracks = [tiprack_2]
    filter_tipracks = [filter_tiprack_1, filter_tiprack_2, filter_tiprack_3]
    trash = ctx.load_trash_bin("A3")
    # tall_labware_loadname = "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical"
    # tall_labware = ctx.load_labware(tall_labware_loadname, "A2")
    # Liquids to transfer
    # Using a 15 mL reservoir as source
    # 1 row, 12 columns
    # https://labware.opentrons.com/#/?loadName=nest_12_reservoir_15ml
    source = ctx.load_labware("nest_12_reservoir_15ml", "B1", "source")
    WATER_SOURCE_WELL = "A1"
    WATER_SOURCE_COLUMN_WELLS = source.columns()[0]
    ETHANOL_SOURCE_WELL = "A2"
    ETHANOL_SOURCE_COLUMN_WELLS = source.columns()[1]
    GLYCEROL_SOURCE_WELL = "A3"
    GLYCEROL_SOURCE_COLUMN_WELLS = source.columns()[2]

    WATER_SOURCE_WELLS = [WATER_SOURCE_WELL, "A5", "A6", "A7"]
    WATER_SOURCE_COLUMNS_WELLS = [source.columns()[0], source.columns()[4], source.columns()[5], source.columns()[6]]
    ETHANOL_SOURCE_WELLS = [ETHANOL_SOURCE_WELL, "A8", "A9", "A10", "A11"]
    ETHANOL_SOURCE_COLUMNS_WELLS = [
        source.columns()[1],
        source.columns()[7],
        source.columns()[8],
        source.columns()[9],
        source.columns()[10],
    ]
    GLYCEROL_SOURCE_WELLS = [GLYCEROL_SOURCE_WELL, "A12"]
    GLYCEROL_SOURCE_COLUMNS_WELLS = [source.columns()[2], source.columns()[11]]

    water = ctx.define_liquid(name="Aqueous", description="H₂O", display_color="#738ee6")
    ethanol = ctx.define_liquid(name="Volatile", description="80%% ethanol solution", display_color="#59c0f0")
    glycerol = ctx.define_liquid(name="Viscous", description="50%% glycerol solution", display_color="#D4D4D4")
    empty = ctx.define_liquid(name="Empty", description="Empty", display_color="#8B4513")

    # Load liquids into source wells
    for well in WATER_SOURCE_WELLS:
        source.wells_by_name()[well].load_liquid(liquid=water, volume=14000)
    for well in ETHANOL_SOURCE_WELLS:
        source.wells_by_name()[well].load_liquid(liquid=ethanol, volume=14000)
    for well in GLYCEROL_SOURCE_WELLS:
        source.wells_by_name()[well].load_liquid(liquid=glycerol, volume=14000)

    # dest
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    dest = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")

    # This is not liked
    # for well in dest.wells():
    #     well.load_liquid(liquid=empty, volume=0)
    # comment_labware_well_volume_status(ctx, source)

    WATER_DEST_COLUMN_WELLS = dest.columns()[0]
    WATER_DEST_WELL = "A1"
    ETHANOL_DEST_COLUMN_WELLS = dest.columns()[1]
    ETHANOL_DEST_WELL = "A2"
    GLYCEROL_DEST_COLUMN_WELLS = dest.columns()[2]
    GLYCEROL_DEST_WELL = "A3"

    WATER_DEST_COLUMNS_WELLS = [dest.columns()[3], dest.columns()[4]]
    ETHANOL_DEST_COLUMNS_WELLS = [dest.columns()[5], dest.columns()[6]]
    GLYCEROL_DEST_COLUMNS_WELLS = [dest.columns()[7], dest.columns()[8]]

    # Transfer with regular tips

    # volume = 41.5
    volume = 77.33
    # new_tip = "per source"
    # new_tip = "never"
    new_tip = "once"
    # new_tip = "always"

    ################  single tip transfer  ################
    tip_config_key = "eight_single"
    tip_config = find_partial_tip_config(tip_config_key)
    pipette_8ch_50 = ctx.load_instrument("flex_8channel_50", "left")
    set_configure_nozzle_layout(ctx=ctx, pipette=pipette_8ch_50, tipracks=tipracks, tip_config=tip_config)

    pipette_50 = ctx.load_instrument("flex_1channel_50", "right", tip_racks=filter_tipracks)

    dest.wells_by_name()["A1"].load_liquid(liquid=empty, volume=0)
    pipette_50.pick_up_tip()
    pipette_50.aspirate(44, source.wells_by_name()["A1"])
    pipette_50.dispense(44, dest.wells_by_name()["A1"])
    pipette_50.drop_tip()

    # comment_labware_well_volume_status(ctx, dest)

    # pipette_8ch_50.pick_up_tip()
    # pipette_8ch_50.drop_tip()

    if new_tip == "never":
        pipette_8ch_50.pick_up_tip()

    # pipette_50.transfer_with_liquid_class(
    #     liquid_class=water_class,
    #     volume=volume,
    #     source=source.wells_by_name()[WATER_SOURCE_WELL],
    #     dest=dest.wells_by_name()[WATER_DEST_WELL],
    #     new_tip=new_tip,
    #     trash_location=trash,
    #     group_wells=False,
    # )
    comment_labware_well_volume_status(ctx, dest)
    # comment_tip_rack_status(ctx, pipette_8ch_50.tip_racks[0])

    # pipette_8ch_50.transfer_with_liquid_class(
    #     liquid_class=ethanol_class,
    #     volume=volume,
    #     source=source.wells_by_name()[ETHANOL_SOURCE_WELL],
    #     dest=dest.wells_by_name()[ETHANOL_DEST_WELL],
    #     new_tip=new_tip,
    #     trash_location=trash,
    #     group_wells=False,
    # )

    # comment_tip_rack_status(ctx, pipette_8ch_50.tip_racks[0])

    # pipette_8ch_50.transfer_with_liquid_class(
    #     liquid_class=glycerol_class,
    #     volume=volume,
    #     source=source.wells_by_name()[GLYCEROL_SOURCE_WELL],
    #     dest=dest.wells_by_name()[GLYCEROL_DEST_WELL],
    #     new_tip=new_tip,
    #     trash_location=trash,
    #     group_wells=False,
    # )

    # comment_tip_rack_status(ctx, pipette_8ch_50.tip_racks[0])

    #####################  GOOOOOOD ^^^^^^

    # # Distribute with regular tips

    # pipette_8ch_50.distribute_with_liquid_class(
    #     liquid_class=water_class,
    #     volume=volume,
    #     source=source.wells_by_name()[WATER_SOURCE_WELL],
    #     dest=WATER_DEST_COLUMNS_WELLS[:1][:2],
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # #ctx.comment(dest.wells_by_name()["A1"].current_liquid_volume())
    # comment_labware_well_volume_status(ctx, dest)

    # comment_tip_rack_status(ctx, pipette_8ch_50.tip_racks[0])

    # pipette_8ch_50.distribute_with_liquid_class(
    #     liquid_class=ethanol_class,
    #     volume=volume,
    #     source=ETHANOL_SOURCE_COLUMN_WELLS,
    #     dest=ETHANOL_DEST_COLUMNS_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.distribute_with_liquid_class(
    #     liquid_class=glycerol_class,
    #     volume=volume,
    #     source=GLYCEROL_SOURCE_COLUMN_WELLS,
    #     dest=GLYCEROL_DEST_COLUMNS_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # # Consolidate with regular tips
    # volume = 244
    # pipette_8ch_50.consolidate_with_liquid_class(
    #     liquid_class=water_class,
    #     volume=volume,
    #     source=WATER_SOURCE_COLUMNS_WELLS,
    #     dest=WATER_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.consolidate_with_liquid_class(
    #     liquid_class=ethanol_class,
    #     volume=volume,
    #     source=ETHANOL_SOURCE_COLUMNS_WELLS,
    #     dest=ETHANOL_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.consolidate_with_liquid_class(
    #     liquid_class=glycerol_class,
    #     volume=volume,
    #     source=GLYCEROL_SOURCE_COLUMNS_WELLS,
    #     dest=GLYCEROL_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # # Now with filter tips !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    # pipette_8ch_50.tip_racks = filter_tipracks
    # volume = 33
    # new_tip = "once"
    # # new_tip = "always"

    # pipette_8ch_50.transfer_with_liquid_class(
    #     liquid_class=water_class,
    #     volume=volume,
    #     source=WATER_SOURCE_COLUMN_WELLS,
    #     dest=WATER_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.transfer_with_liquid_class(
    #     liquid_class=ethanol_class,
    #     volume=volume,
    #     source=ETHANOL_SOURCE_COLUMN_WELLS,
    #     dest=ETHANOL_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.transfer_with_liquid_class(
    #     liquid_class=glycerol_class,
    #     volume=volume,
    #     source=GLYCEROL_SOURCE_COLUMN_WELLS,
    #     dest=GLYCEROL_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # # Distribute with filter tips

    # pipette_8ch_50.distribute_with_liquid_class(
    #     liquid_class=water_class,
    #     volume=volume,
    #     source=WATER_SOURCE_COLUMN_WELLS,
    #     dest=WATER_DEST_COLUMNS_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.distribute_with_liquid_class(
    #     liquid_class=ethanol_class,
    #     volume=volume,
    #     source=ETHANOL_SOURCE_COLUMN_WELLS,
    #     dest=ETHANOL_DEST_COLUMNS_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.distribute_with_liquid_class(
    #     liquid_class=glycerol_class,
    #     volume=volume,
    #     source=GLYCEROL_SOURCE_COLUMN_WELLS,
    #     dest=GLYCEROL_DEST_COLUMNS_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # # Consolidate with filter tips
    # volume = 15
    # pipette_8ch_50.consolidate_with_liquid_class(
    #     liquid_class=water_class,
    #     volume=volume,
    #     source=WATER_SOURCE_COLUMNS_WELLS,
    #     dest=WATER_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.consolidate_with_liquid_class(
    #     liquid_class=ethanol_class,
    #     volume=volume,
    #     source=ETHANOL_SOURCE_COLUMNS_WELLS,
    #     dest=ETHANOL_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    # pipette_8ch_50.consolidate_with_liquid_class(
    #     liquid_class=glycerol_class,
    #     volume=volume,
    #     source=GLYCEROL_SOURCE_COLUMNS_WELLS,
    #     dest=GLYCEROL_DEST_COLUMN_WELLS,
    #     new_tip=new_tip,
    #     trash_location=trash,
    # )

    if new_tip == "never":
        pipette_8ch_50.drop_tip()
