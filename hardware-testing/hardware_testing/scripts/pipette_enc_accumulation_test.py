import argparse
import asyncio

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point, Axis

from opentrons.hardware_control.ot3api import OT3API

# from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

STALL_THRESHOLD = 0.25

async def _plunger_alignment(api: OT3API, mount: OT3Mount) -> (float, float):
    print("Checking alignment...\n")
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    current_pos = await api.current_position_ot3(mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    if abs(stalled_mm) < STALL_THRESHOLD:
        print(f"=== ALIGNED: {round(stalled_mm, 2)} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
    else:
        print(f"=== STALLED: {round(stalled_mm, 2)} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
    return est, enc


async def _main(is_simulating: bool, cycles: int, mount: types.OT3Mount, slot: str) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating, stall_detection_enable=True)
    await api.cache_instruments()
    await api.home()
    await api.home_plunger(mount)

    pipette = helpers_ot3._get_pipette_from_mount(api, mount)
    test_tag = pipette.name

    test_name = "pipette-mixing-test"
    run_name = data.create_run_id()
    file_name = data.create_file_name(test_name=test_name, run_id=run_name, tag=test_tag)

    header = ['Cycle', 'Test Pipette',
              'Init Estimate Pos (mm)', 'Init Enc Pos (mm)',
              'Top Estimate Pos (mm)', 'Top Enc Pos (mm)', 'Top Pos Difference (mm)',
              'Bottom Estimate Pos (mm)', 'Bottom Enc Pos (mm)', 'Bottom Pos Difference (mm)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, run_id=run_name,file_name=file_name, data=header_str)

    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)
    pipette_ax = types.Axis.of_main_tool_actuator(mount)

    print("Move to bottom position\n")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)

    print("Take initial reading\n")

    init_pos = await api.current_position_ot3(mount, refresh=True)
    print(f"\t>> Open-loop position read: {init_pos[pipette_ax]} mm\n")

    init_encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    print(f"\t>> Encoder read: {init_encoder_pos[pipette_ax]} mm\n")

    # await api.move_rel(mount, delta=Point(z=10))

    for cycle in range(cycles):
        print(f"\n=========== Cycle {cycle + 1}/{cycles} ===========\n")

        print("Move to top plunger position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, top_pos)
        top_est, top_enc = await _plunger_alignment(api, mount)

        print("Move to bottom plunger position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
        bot_est, bot_enc = await _plunger_alignment(api, mount)

        if cycle > 0:
            test_tag = ""

        cycle_data = [cycle + 1, test_tag,
                      init_pos[pipette_ax], init_encoder_pos[pipette_ax],
                      top_est, top_enc, top_est - top_enc,
                      bot_est, bot_enc, bot_est - bot_enc]
        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        data.append_data_to_file(test_name=test_name, run_id=run_name, file_name=file_name, data=cycle_data_str)



if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument("--cycles", type=int, default=100)
    parser.add_argument("--slot", type=str, default="C2")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, args.cycles, mount, args.slot))