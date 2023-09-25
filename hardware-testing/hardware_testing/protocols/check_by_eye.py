"""Photometric OT3 P50."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "check-by-eye-dot-py"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

TEST_VOLUMES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

ASPIRATE_DEPTH = -3.0
DISPENSE_DEPTH = -1.5

ASPIRATE_FLOW_RATE = 35  # default for P50S and P50M is 35ul/sec
DISPENSE_FLOW_RATE = 57  # default for P50S and P50M is 57ul/sec

ASPIRATE_DELAY = 1.0
DISPENSE_DELAY = 0.5

PIP_CHANNELS = 8
PIP_VOLUME = 50
PIP_MOUNT = "left"
PIP_PUSH_OUT = 6

TIP_VOLUME = 50

RESERVOIR_SLOT = "D1"
RESERVOIR_NAME = "nest_1_reservoir_195ml"
RESERVOIR_WELL = "A1"

PLATE_NAME = "corning_96_wellplate_360ul_flat"

RACK_AND_PLATE_SLOTS = [  # [rack, plate]
    ["B1", "C1"],
    # ["B2", "C2"],
    # ["B3", "C3"],
    # ["A1", "D2"],
    # ["A2", "D3"]
]

ROWS = "ABCDEFGH"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    pipette = ctx.load_instrument(f"flex_{PIP_CHANNELS}channel_{PIP_VOLUME}", PIP_MOUNT)
    reservoir = ctx.load_labware(RESERVOIR_NAME, RESERVOIR_SLOT)

    combos = [
        {
            "rack": ctx.load_labware(
                f"opentrons_flex_96_tiprack_{TIP_VOLUME}uL", pair[0]
            ),
            "plate": ctx.load_labware(PLATE_NAME, pair[1]),
        }
        for pair in RACK_AND_PLATE_SLOTS
    ]

    pipette.flow_rate.aspirate = ASPIRATE_FLOW_RATE
    pipette.flow_rate.dispense = DISPENSE_FLOW_RATE
    vol_cnt = 0
    for combo in combos:
        plate = combo["plate"]
        rack = combo["rack"]
        num_trials = 12 if PIP_CHANNELS == 8 else 96
        for trial in range(num_trials):
            volume = TEST_VOLUMES[vol_cnt % len(TEST_VOLUMES)]
            vol_cnt += 1
            column = (trial % 12) + 1
            row = ROWS[int(trial / 12)]
            well_name = f"{row}{column}"
            pipette.configure_for_volume(volume)
            pipette.pick_up_tip(rack[well_name])
            pipette.aspirate(volume, reservoir[RESERVOIR_WELL].top(ASPIRATE_DEPTH))
            ctx.delay(seconds=ASPIRATE_DELAY)
            pipette.move_to(plate[well_name].top(5))
            ctx.delay(seconds=1)  # visual check
            pipette.dispense(
                volume, plate[well_name].top(DISPENSE_DEPTH), push_out=PIP_PUSH_OUT
            )
            ctx.delay(seconds=ASPIRATE_DELAY)
            pipette.move_to(plate[well_name].top(5))
            ctx.delay(seconds=1)  # visual check
            pipette.drop_tip(home_after=False)
