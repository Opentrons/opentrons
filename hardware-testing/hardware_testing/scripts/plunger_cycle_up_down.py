"""Plunger cycle up/down."""
import argparse
from asyncio import run
from threading import Thread, Event
import time
from typing import Optional

from hardware_testing import data
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount


CSV_HEADER = "time\tcycle"
TEST_NAME = "plunger-move-up-down"

MNT = OT3Mount.LEFT


async def _main(simulate: bool, num_cycles: int):

    # create OT3API
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=simulate, pipette_left="p1000_96_v3.5"
    )
    pip = api.hardware_pipettes[MNT.to_mount()]
    await api.add_tip(MNT, 60)
    api.set_pipette_speed(MNT, aspirate=15, dispense=15, blow_out=15)
    await api.home_plunger(MNT)
    await api.prepare_for_aspirate(MNT)

    # create CSV file
    run_id = data.create_run_id()
    pip_sn = helpers_ot3.get_pipette_serial_ot3(pip)
    csv = data.create_file_name(TEST_NAME, run_id, f"{pip_sn}")
    data.dump_data_to_file(TEST_NAME, run_id, csv, f"{CSV_HEADER}\n")

    # TODO: cycle up/down, and save to CSV
    try:
        cycle_count = 0
        start_time = time.time()
        for i in range(num_cycles):
            cycle_count += 1
            elapsed_time = time.time() - start_time
            new_line = f"{elapsed_time},{cycle_count}"
            print(new_line)
            data.append_data_to_file(TEST_NAME, run_id, csv, f"{new_line}\n")
            await api.aspirate(MNT, 1000)
            await api.blow_out(MNT)
            await api.prepare_for_aspirate(MNT)
    except Exception as e:
        data.append_data_to_file(TEST_NAME, run_id, csv, f"\n\n{str(e)}\n")
        raise e


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=3)
    args = parser.parse_args()
    run(_main(args.simulate, args.cycles))
