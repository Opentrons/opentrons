"""Check by Eye dot Py."""
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "check-by-eye-dot-py"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

PIP_CHANNELS = 8
PIP_VOLUME = 50
PIP_MOUNT = "left"
PIP_PUSH_OUT = 6

TIP_VOLUME = 50

# NOTE: pipette will loop through volumes
#       circling back to the first, regardless of which well it is at
#       so number of volumes can be any length you like (example: [1])
TEST_VOLUMES = [1, 2, 3, 4]

# FIXME: operator must LPC to liquid-surface in reservoir in order for this to work
#        need to get liquid-probing working ASAP to fix this hack
ASPIRATE_DEPTH = -3.0
DISPENSE_DEPTH = -1.5

ASPIRATE_FLOW_RATE = 35  # default for P50S and P50M is 35ul/sec
DISPENSE_FLOW_RATE = 57  # default for P50S and P50M is 57ul/sec

ASPIRATE_PRE_DELAY = 1.0
ASPIRATE_POST_DELAY = 1.0
DISPENSE_PRE_DELAY = 0.0
DISPENSE_POST_DELAY = 0.5

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

HEIGHT_OF_200UL_IN_PLATE_MM = 6.04  # height of 200ul in a Corning 96-well flat-bottom


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
            # CHOOSE VOLUME
            volume = TEST_VOLUMES[vol_cnt % len(TEST_VOLUMES)]
            vol_cnt += 1

            # CHOOSE WELL
            column = (trial % 12) + 1
            row = "ABCDEFGH"[int(trial / 12)]
            well_name = f"{row}{column}"

            # PICK-UP TIP
            pipette.configure_for_volume(volume)
            pipette.pick_up_tip(rack[well_name])

            # ASPIRATE
            aspirate_pos = reservoir[RESERVOIR_WELL].top(ASPIRATE_DEPTH)
            pipette.move_to(aspirate_pos)
            ctx.delay(seconds=ASPIRATE_PRE_DELAY)
            pipette.aspirate(volume, aspirate_pos)
            ctx.delay(seconds=ASPIRATE_POST_DELAY)
            pipette.move_to(plate[well_name].top(5))
            ctx.pause()  # visual check

            # DISPENSE
            dispense_pos = plate[well_name].bottom(
                HEIGHT_OF_200UL_IN_PLATE_MM + DISPENSE_DEPTH
            )
            pipette.move_to(dispense_pos)
            ctx.delay(seconds=DISPENSE_PRE_DELAY)
            pipette.dispense(volume, dispense_pos, push_out=PIP_PUSH_OUT)
            ctx.delay(seconds=DISPENSE_POST_DELAY)
            pipette.move_to(plate[well_name].top(5))
            ctx.pause()  # visual check

            # DROP TIP
            pipette.drop_tip(home_after=False)
