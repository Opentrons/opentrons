from dataclasses import dataclass
from typing import Any, Optional, Union
from opentrons.protocol_api import SINGLE, COLUMN, PARTIAL_COLUMN, ROW

metadata = {
    "protocolName": "RTP template for partial tip config",
    "description": "These are all the viable partial tip configurations for the Flex 96 and 8 channel pipettes",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}

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
eight_single_back = PartialTipConfig(
    key="eight_single_back",
    description="8 channel single picking up from the back left of the tiprack",
    starting_tip="A1",
    starting_nozzle="H1",
    api_tip_config=SINGLE,
    api_start="H1",
    api_end=None,
)

eight_single_front = PartialTipConfig(
    key="eight_single_front",
    description="8 channel single picking up from the front left of the tiprack",
    starting_tip="H1",
    starting_nozzle="A1",
    api_tip_config=SINGLE,
    api_start="A1",
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
    eight_single_back,
    eight_single_front,
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


def add_parameters(p):
    p.add_str(
        display_name="Partial Tip Configuration",
        variable_name="partial_tip_config_key",
        default="eight_partial_back_5_tips",
        description="Partial tip configurations described relative to the tiprack.",
        choices=[  # value of each choice maps to the key of the partial tip config dataclass we defined
            {"display_name": "96 SINGLE back left", "value": "ninety_six_single_back_left"},
            {"display_name": "96 SINGLE back right", "value": "ninety_six_single_back_right"},
            {"display_name": "96 SINGLE front left", "value": "ninety_six_single_front_left"},
            {"display_name": "96 SINGLE front right", "value": "ninety_six_single_front_right"},
            {"display_name": "96 COLUMN left", "value": "ninety_six_column_left"},
            {"display_name": "96 COLUMN right", "value": "ninety_six_column_right"},
            {"display_name": "96 ROW back", "value": "ninety_six_row_back"},
            {"display_name": "96 ROW front", "value": "ninety_six_row_front"},
            {"display_name": "8 SINGLE back left", "value": "eight_single_back"},
            {"display_name": "8 SINGLE front left", "value": "eight_single_front"},
            {"display_name": "8 PARTIAL back left - 2 tips", "value": "eight_partial_back_2_tips"},
            {"display_name": "8 PARTIAL back left - 3 tips", "value": "eight_partial_back_3_tips"},
            {"display_name": "8 PARTIAL back left - 4 tips", "value": "eight_partial_back_4_tips"},
            {"display_name": "8 PARTIAL back left - 5 tips", "value": "eight_partial_back_5_tips"},
            {"display_name": "8 PARTIAL back left - 6 tips", "value": "eight_partial_back_6_tips"},
            {"display_name": "8 PARTIAL back left - 7 tips", "value": "eight_partial_back_7_tips"},
        ],
    )


####### END RTP DEFINITIONS #######


def set_configure_nozzle_layout(pipette, tipracks, tip_config):
    """Convenience function to set the nozzle layout of a pipette
    with the given tip config we have mapped to a RTP."""
    pipette.configure_nozzle_layout(style=tip_config.api_tip_config, start=tip_config.api_start, end=tip_config.api_end, tip_racks=tipracks)


def comment_column_has_tip(ctx, tip_rack, column):
    """Print out the tip status of a column in a tip rack."""
    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    wells = [f"{row}{column}" for row in range_A_to_H]
    for well in wells:
        ctx.comment(f"Tip rack in {tip_rack.parent}, well {well} has tip: {tip_rack.wells_by_name()[well].has_tip}")


def run(ctx):
    # get the key from the parameters
    tip_config = find_partial_tip_config(ctx.params.partial_tip_config_key)
    # print out the tip config
    ctx.comment(f"Running with {tip_config}")
    # example code on Flex for a pipette
    # comment shows we picked up the tips we expected
    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B2")
    pipette = ctx.load_instrument("flex_8channel_1000", "left")
    # use this convenience function to set the nozzle layout
    set_configure_nozzle_layout(pipette=pipette, tipracks=[tip_rack], tip_config=tip_config)
    pipette.pick_up_tip()
    # our config picked up from column 1 of the tip rack
    # print out the tip status of column 1 of the tip rack
    # to confirm we picked up the tip(s) we expected
    comment_column_has_tip(ctx, tip_rack, "1")
