from dataclasses import dataclass
from typing import Optional
from opentrons.protocol_api import SINGLE, COLUMN, PARTIAL_COLUMN, ROW

metadata = {
    "protocolName": "Too tall labware on pickup tip",
    "description": "oooo",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


@dataclass
class PartialTipConfig:
    key: str
    description: str
    startingTip: str
    startingNozzle: str
    apiTipConfig: str
    apiStart: str
    apiEnd: Optional[str]


# flex_96channel_1000 SINGLE

ninety_six_single_top_left = PartialTipConfig(
    key="ninety_six_single_top_left",
    description="96 single picking up top left of tiprack",
    startingTip="A1",
    startingNozzle="H12",
    apiTipConfig=SINGLE,
    apiStart="H12",
    apiEnd=None,
)

ninety_six_single_top_right = PartialTipConfig(
    key="ninety_six_single_top_right",
    description="96 single picking up top right of tiprack",
    startingTip="A12",
    startingNozzle="H1",
    apiTipConfig=SINGLE,
    apiStart="H1",
    apiEnd=None,
)

ninety_six_single_bottom_left = PartialTipConfig(
    key="ninety_six_single_bottom_left",
    description="96 single picking up bottom left of tiprack",
    startingTip="H1",
    startingNozzle="A12",
    apiTipConfig=SINGLE,
    apiStart="A12",
    apiEnd=None,
)

ninety_six_single_bottom_right = PartialTipConfig(
    key="ninety_six_single_bottom_right",
    description="96 single picking up bottom right of tiprack",
    startingTip="H12",
    startingNozzle="A1",
    apiTipConfig=SINGLE,
    apiStart="A1",
    apiEnd=None,
)

# flex_96channel_1000 COLUMN

ninety_six_column_left = PartialTipConfig(
    key="ninety_six_column_left",
    description="96 column picking up left column of tiprack",
    startingTip="Column 1",
    startingNozzle="Column 12",
    apiTipConfig=COLUMN,
    apiStart="A12",
    apiEnd=None,
)


ninety_six_column_right = PartialTipConfig(
    key="ninety_six_column_right",
    description="96 column picking up right column of tiprack",
    startingTip="Row 12",
    startingNozzle="Row 1",
    apiTipConfig=COLUMN,
    apiStart="A1",
    apiEnd=None,
)

# flex_96channel_1000 ROW

ninety_six_row_top = PartialTipConfig(
    key="ninety_six_row_top",
    description="96 row picking up top row of tiprack",
    startingTip="Row A",
    startingNozzle="Row H",
    apiTipConfig=ROW,
    apiStart="H1",
    apiEnd=None,
)

ninety_six_row_bottom = PartialTipConfig(
    key="ninety_six_row_bottom",
    description="96 row picking up bottom row of tiprack",
    startingTip="Row H",
    startingNozzle="Row A",
    apiTipConfig=ROW,
    apiStart="A1",
    apiEnd=None,
)

# pipette = protocol.load_instrument(instrument_name="flex_8channel_50", mount="right")
# works for all 8 channel pipettes
eight_single_top = PartialTipConfig(
    key="eight_single_top",
    description="8 channel single picking up from the top of the tiprack",
    startingTip="A1",
    startingNozzle="H1",
    apiTipConfig=SINGLE,
    apiStart="H1",
    apiEnd=None,
)

eight_single_bottom = PartialTipConfig(
    key="eight_single_bottom",
    description="8 channel single picking up from the bottom of the tiprack",
    startingTip="H1",
    startingNozzle="A1",
    apiTipConfig=SINGLE,
    apiStart="A1",
    apiEnd=None,
)


eight_partial_top_2_tips = PartialTipConfig(
    key="eight_partial_top_2_tips",
    description="8 partial bottom 2 tips",
    startingTip="H1",
    startingNozzle="B1",
    apiTipConfig=PARTIAL_COLUMN,
    apiStart="H1",
    apiEnd="B1",
)

eight_partial_top_3_tips = PartialTipConfig(
    key="eight_partial_top_3_tips",
    description="8 partial bottom 3 tips",
    startingTip="H1",
    startingNozzle="C1",
    apiTipConfig=PARTIAL_COLUMN,
    apiStart="H1",
    apiEnd="C1",
)
eight_partial_top_4_tips = PartialTipConfig(
    key="eight_partial_top_4",
    description="8 partial bottom 4 tips",
    startingTip="H1",
    startingNozzle="D1",
    apiTipConfig=PARTIAL_COLUMN,
    apiStart="H1",
    apiEnd="D1",
)
eight_partial_top_5_tips = PartialTipConfig(
    key="eight_partial_top_5",
    description="8 partial bottom 5 tips",
    startingTip="H1",
    startingNozzle="E1",
    apiTipConfig=PARTIAL_COLUMN,
    apiStart="H1",
    apiEnd="E1",
)
eight_partial_top_6_tips = PartialTipConfig(
    key="eight_partial_top_6",
    description="8 partial bottom 6 tips",
    startingTip="H1",
    startingNozzle="F1",
    apiTipConfig=PARTIAL_COLUMN,
    apiStart="H1",
    apiEnd="F1",
)

eight_partial_top_7_tips = PartialTipConfig(
    key="eight_partial_top_7",
    description="8 partial bottom 7 tips",
    startingTip="H1",
    startingNozzle="G1",
    apiTipConfig=PARTIAL_COLUMN,
    apiStart="H1",
    apiEnd="G1",
)

all_partial_configs = [
    ninety_six_single_top_left,
    ninety_six_single_top_right,
    ninety_six_single_bottom_left,
    ninety_six_single_bottom_right,
    ninety_six_column_left,
    ninety_six_column_right,
    ninety_six_row_top,
    ninety_six_row_bottom,
    eight_single_top,
    eight_single_bottom,
    eight_partial_top_2_tips,
    eight_partial_top_3_tips,
    eight_partial_top_4_tips,
    eight_partial_top_5_tips,
    eight_partial_top_6_tips,
    eight_partial_top_7_tips,
]


def find_partial_tip_config(key: str) -> Optional[PartialTipConfig]:
    for config in all_partial_configs:
        if config.key == key:
            return config
    raise ValueError(f"Could not find partial tip config with key {key}")


@dataclass
class TestCase:
    key: str
    description: str
    pipette_config_key: str
    collision_slot: Optional[str] = None
    tip_rack_slot: Optional[str] = None
    movement: Optional[str] = None
    source_slot: Optional[str] = None
    source_well: Optional[str] = None
    destination_slot: Optional[str] = None
    destination_well: Optional[str] = None


north = TestCase(
    key="north",
    description="North too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_top_left",
    collision_slot="B2",
)

north_west = TestCase(
    key="north_west",
    description="NW too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_top_left",
    collision_slot="B1",
)

west = TestCase(
    key="west",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_top_left",
    collision_slot="C1",
)

south_west = TestCase(
    key="south_west",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_bottom_left",
    collision_slot="D1",
)

south = TestCase(
    key="south",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_bottom_left",
    collision_slot="D2",
)

south_east = TestCase(
    key="south_east",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_bottom_right",
    collision_slot="D3",
)
east = TestCase(
    key="east",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_single_bottom_right",
    collision_slot="C3",
)

east_column = TestCase(
    key="east_column",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_column_left",
    collision_slot="C1",
)
west_column = TestCase(
    key="west_column",
    description="west too tall labware on pickup tip",
    pipette_config_key="ninety_six_column_right",
    collision_slot="C3",
)

north_row = TestCase(
    key="north_row",
    description="north row too tall labware on pickup tip",
    pipette_config_key="ninety_six_row_top",
    collision_slot="B2",
)

south_row = TestCase(
    key="south_row",
    description="south row too tall labware on pickup tip",
    pipette_config_key="ninety_six_row_bottom",
    collision_slot="D2",
)

top_edge = TestCase(key="top_edge", description="top edge of robot", pipette_config_key="ninety_six_single_top_left", tip_rack_slot="A1")

bottom_left_edge = TestCase(
    key="bottom_left_edge", description="bottom left edge of robot", pipette_config_key="ninety_six_single_bottom_left", tip_rack_slot="D1"
)

bottom_right_edge = TestCase(
    key="bottom_right_edge",
    description="bottom right edge of robot",
    pipette_config_key="ninety_six_single_bottom_right",
    tip_rack_slot="D3",
)

c3_right_edge = TestCase(
    key="c3_right_edge", description="right edge of c2", pipette_config_key="ninety_six_single_bottom_right", tip_rack_slot="C3"
)

transfer_destination_collision = TestCase(
    key="transfer_destination_collision",
    description="transfer north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    destination_slot="D3",
    destination_well="A1",
    movement="transfer",
    collision_slot="C3",
)

transfer_source_collision = TestCase(
    key="transfer_source_collision",
    description="transfer north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    destination_slot="D3",
    destination_well="A1",
    movement="transfer",
    collision_slot="C1",
)

mix_collision = TestCase(
    key="mix_collision",
    description="mix north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    movement="mix",
    collision_slot="C1",
)

consolidate_source_collision = TestCase(
    key="consolidate_source_collision",
    description="consolidate north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    destination_slot="D3",
    destination_well="A1",
    movement="consolidate",
    collision_slot="C1",
)

consolidate_destination_collision = TestCase(
    key="consolidate_destination_collision",
    description="consolidate north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    destination_slot="D3",
    destination_well="A1",
    movement="consolidate",
    collision_slot="C3",
)

distribute_source_collision = TestCase(
    key="distribute_source_collision",
    description="distribute north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    destination_slot="D3",
    destination_well="A1",
    movement="distribute",
    collision_slot="C1",
)

distribute_destination_collision = TestCase(
    key="distribute_destination_collision",
    description="distribute north",
    pipette_config_key="ninety_six_single_top_left",
    tip_rack_slot="B2",
    source_slot="D2",
    source_well="A1",
    destination_slot="D3",
    destination_well="A1",
    movement="distribute",
    collision_slot="C3",
)

# all have been tested manually and throw an error as expected JTM 20240814
test_cases = [
    transfer_source_collision,
    transfer_destination_collision,
    c3_right_edge,
    north,
    north_west,
    west,
    south_west,
    south,
    south_east,
    east,
    east_column,
    west_column,
    north_row,
    south_row,
    top_edge,
    bottom_left_edge,
    bottom_left_edge,
    bottom_right_edge,
    mix_collision,
    consolidate_source_collision,
    consolidate_destination_collision,
    distribute_source_collision,
    distribute_destination_collision,
]


def get_test_case(key: str) -> Optional[TestCase]:
    for test_case in test_cases:
        if test_case.key == key:
            return test_case
    raise ValueError(f"Could not find test case with key {key}")


def run(ctx):
    tall_labware_loadname = "opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical"
    test_case = get_test_case(key)

    if test_case.tip_rack_slot and test_case.tip_rack_slot != "C2":
        tip_rack = ctx.load_labware("opentrons_96_tiprack_1000ul", test_case.tip_rack_slot)
    else:
        tip_rack = ctx.load_labware("opentrons_96_tiprack_1000ul", "C2")

    pipette_config = find_partial_tip_config(test_case.pipette_config_key)

    pipette = ctx.load_instrument("flex_96channel_1000")

    pipette.configure_nozzle_layout(pipette_config.apiTipConfig, pipette_config.apiStart, tip_racks=[tip_rack])

    if test_case.collision_slot:
        ctx.load_labware(tall_labware_loadname, test_case.collision_slot)

    target_labware_loadname = "nest_96_wellplate_100ul_pcr_full_skirt"
    if test_case.source_slot:
        source = ctx.load_labware(target_labware_loadname, test_case.source_slot)

    if test_case.destination_slot:
        destination = ctx.load_labware(target_labware_loadname, test_case.destination_slot)

    if not test_case.movement:
        None  # No movement simply pickup tip from the tip rack
        pipette.pick_up_tip()
    elif test_case.movement == "transfer":
        trash = ctx.load_trash_bin("A3")
        pipette.transfer(10, source[test_case.source_well], destination[test_case.destination_well])
    elif test_case.movement == "mix":
        trash = ctx.load_trash_bin("A3")
        well = source[test_case.source_well]
        pipette.pick_up_tip()
        pipette.move_to(well.bottom(z=2))
        pipette.mix(10, 10)
        pipette.move_to(well.top(z=5))
        pipette.blow_out()
        pipette.drop_tip()
    elif test_case.movement == "consolidate":
        trash = ctx.load_trash_bin("A3")
        pipette.consolidate(
            [10, 10],
            [source[test_case.source_well], source[test_case.source_well]],
            destination[test_case.destination_well],
        )
    elif test_case.movement == "distribute":
        trash = ctx.load_trash_bin("A3")
        pipette.distribute(
            20,
            source[test_case.source_well],
            [destination[test_case.destination_well], destination[test_case.destination_well]],
        )
