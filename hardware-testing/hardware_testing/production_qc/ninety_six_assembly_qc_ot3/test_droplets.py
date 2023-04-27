"""Test Droplets."""
from asyncio import sleep
from time import time
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point

TIP_VOLUME = 1000
NUM_SECONDS_TO_WAIT = 30
HOVER_HEIGHT_MM = 50

TIP_RACK_LABWARE = f"opentrons_ot3_96_tiprack_{TIP_VOLUME}ul"
RESERVOIR_LABWARE = "nest_1_reservoir_195ml"

TIP_RACK_SLOT = 7
RESERVOIR_SLOT = 4
TRASH_SLOT = 12

TRASH_HEIGHT = 40  # FIXME: get real value

# X moves negative (to left), Y moves positive (to rear)
OFFSET_FOR_1_WELL_LABWARE = Point(x=9 * -11 * 0.5, y=9 * 7 * 0.5)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [CSVLine("droplets", [float, CSVResult])]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    tip_rack_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        TIP_RACK_SLOT, TIP_RACK_LABWARE
    )
    reservoir_a1_nominal = helpers_ot3.get_theoretical_a1_position(
        RESERVOIR_SLOT, RESERVOIR_LABWARE
    )
    trash_nominal = helpers_ot3.get_slot_calibration_square_position_ot3(
        TRASH_SLOT
    ) + Point(z=TRASH_HEIGHT)
    # center the 96ch over the 1-well reservoir and the trash
    reservoir_a1_nominal += OFFSET_FOR_1_WELL_LABWARE
    trash_nominal += OFFSET_FOR_1_WELL_LABWARE

    ui.print_header("JOG to TIP-RACK")
    if api.is_simulator or ui.get_user_answer("PICK-UP new tips"):
        await helpers_ot3.move_to_arched_ot3(
            api, OT3Mount.LEFT, tip_rack_a1_nominal + Point(z=30)
        )
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
        print("picking up tips")
        await api.pick_up_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))
        await api.home_z(OT3Mount.LEFT)
    else:
        await api.add_tip(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(TIP_VOLUME))

    ui.print_header("JOG to LIQUID")
    print("jog tips to -5 mm below surface of liquid")
    await helpers_ot3.move_to_arched_ot3(
        api, OT3Mount.LEFT, reservoir_a1_nominal + Point(z=10)
    )
    await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)

    ui.print_header("ASPIRATE and WAIT")
    await api.aspirate(OT3Mount.LEFT)
    await api.move_rel(OT3Mount.LEFT, Point(z=HOVER_HEIGHT_MM))
    start_time = time()
    if not api.is_simulator:
        for i in range(NUM_SECONDS_TO_WAIT):
            print(f"waiting {i + 1}/{NUM_SECONDS_TO_WAIT}")
            await sleep(1)
    if not api.is_simulator:
        result = ui.get_user_answer("did 1 or more droplets form")
    else:
        result = True
    duration_seconds = time() - start_time
    print(f"waited for {duration_seconds} seconds")
    report(section, "droplets", [duration_seconds, CSVResult.from_bool(result)])
    await api.move_rel(OT3Mount.LEFT, Point(z=-HOVER_HEIGHT_MM))
    await api.blow_out(OT3Mount.LEFT)

    ui.print_header("DROP in TRASH")
    await helpers_ot3.move_to_arched_ot3(
        api, OT3Mount.LEFT, trash_nominal + Point(z=20)
    )
    await api.move_to(OT3Mount.LEFT, trash_nominal)
    await api.drop_tip(OT3Mount.LEFT)
