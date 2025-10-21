# key = "drop_tip_with_location"
from dataclasses import dataclass
from typing import Optional
from opentrons.protocol_api import PARTIAL_COLUMN

# inspired by https://opentrons.atlassian.net/browse/PLAT-457

metadata = {
    "protocolName": "Invalid tip configs that should error",
    "description": "oooo",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.20",
}


@dataclass
class PartialTipConfig:
    key: str
    pipette_load_name: str
    description: str
    starting_tip: str
    starting_nozzle: str
    api_tip_config: str
    api_start: str
    api_end: Optional[str] = None


# We do not allow PARTIAL_COLUMN to start on the bottom of the tip rack
# Want to see
# "IncompatibleNozzleConfiguration: Attempted Nozzle Configuration does not match any approved map layout for the current pipette."
eight_partial_column_bottom_left = PartialTipConfig(
    key="eight_partial_column_bottom_left",
    pipette_load_name="p300_multi_gen2",
    description="8 channel 2 tip pick up bottom left of tiprack",
    starting_tip="H1",
    starting_nozzle="A1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="A1",
    api_end="B1",
)


# Want to see
# Error 4000 GENERAL_ERROR (ProtocolCommandFailedError): IncompatibleNozzleConfiguration: No entry for front right nozzle 'G12' in pipette
eight_partial_column_bottom_right = PartialTipConfig(
    key="eight_partial_column_bottom_right",
    pipette_load_name="p20_multi_gen2",
    description="8 channel 2 tip pick up bottom left of tiprack",
    starting_tip="H12",
    starting_nozzle="A1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",  # for partial column only H1
    api_end="G12",  # the author thinks this is to specify the ending tip and wants to start at bottom right for 2 tips
)


# Partial column configurations require the 'end' parameter.
eight_partial_column_no_end = PartialTipConfig(
    key="eight_partial_column_no_end",
    pipette_load_name="p20_multi_gen2",
    description="8 channel PARTIAL_COLUMN with no end",
    starting_tip="H1",
    starting_nozzle="A1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    # api_end="B1", sets the end to None
)

# If you call return_tip() while using partial tip pickup, the API will raise an error.
# Error 4000 GENERAL_ERROR (UnexpectedProtocolError): Cannot return tip to a tiprack while the pipette is configured for partial tip.
return_tip_error = PartialTipConfig(
    key="return_tip_error",
    pipette_load_name="p20_multi_gen2",
    description="8 channel 2 tip pick up top left of tiprack",
    starting_tip="A1",
    starting_nozzle="H1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="G1",  # valid 2 tip
)


# pipette.drop_tip(tiprack["B1"])  # drops tip in rack location A1
drop_tip_with_location = PartialTipConfig(
    key="drop_tip_with_location",
    pipette_load_name="p300_multi_gen2",
    description="8 channel 2 tip pick up top left of tiprack",
    starting_tip="A1",
    starting_nozzle="H1",
    api_tip_config=PARTIAL_COLUMN,
    api_start="H1",
    api_end="G1",  # valid 2 tip
)

all_partial_configs = [
    eight_partial_column_bottom_left,
    eight_partial_column_bottom_right,
    eight_partial_column_no_end,
    return_tip_error,
    drop_tip_with_location,
]


def find_partial_tip_config(key: str) -> Optional[PartialTipConfig]:
    for config in all_partial_configs:
        if config.key == key:
            return config
    raise ValueError(f"Could not find partial tip config with key {key}")


def comment_column_has_tip(ctx, tip_rack, column):
    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    wells = [f"{row}{column}" for row in range_A_to_H]
    for well in wells:
        ctx.comment(f"Tip rack in {tip_rack.parent}, well {well} has tip: {tip_rack.wells_by_name()[well].has_tip}")


def run(ctx):

    tip_rack_20 = ctx.load_labware("opentrons_96_tiprack_20ul", "1")
    tip_rack_300 = ctx.load_labware("opentrons_96_tiprack_300ul", "2")

    pipette_config = find_partial_tip_config(key)

    pipette = ctx.load_instrument(pipette_config.pipette_load_name, "left")

    tip_rack = tip_rack_20
    if pipette_config.pipette_load_name.__contains__("300"):
        tip_rack = tip_rack_300
    pipette.configure_nozzle_layout(
        style=pipette_config.api_tip_config, start=pipette_config.api_start, end=pipette_config.api_end, tip_racks=[tip_rack]
    )

    target_labware_loadname = "nest_96_wellplate_100ul_pcr_full_skirt"
    source = ctx.load_labware(target_labware_loadname, "4")
    destination = ctx.load_labware(target_labware_loadname, "5")

    if key == "return_tip_error":
        pipette.pick_up_tip()
        # this test picks up 2 tips
        comment_column_has_tip(ctx, tip_rack, 1)
        pipette.return_tip()  # this should raise an error
    elif key == "drop_tip_with_location":
        pipette.pick_up_tip()
        comment_column_has_tip(ctx, tip_rack, 1)
        pipette.drop_tip(tip_rack["A1"])  # this should raise an error
    else:
        pipette.transfer(10, source["A1"], destination["A1"])
