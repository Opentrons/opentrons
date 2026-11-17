import argparse
import asyncio
import time
from typing import List, Dict, Union
import sys
import json
import requests

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import GantryLoad
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point

from opentrons.hardware_control.types import CriticalPoint
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

TIP_LENGTH_MM = 57
DEFAULT_Z_CURRENT = 1.5
PARTIAL_PICK_UP_CURRENT = 0.75

MAX_TRAVEL_MM = {
    Axis.X: 427,
    Axis.Y: 408,
    Axis.Z_L: 249,
}

PREP_POSITION_BLOCK_LOCATION = 188
MIN_LEFT_X_OFFSET = -70
MIN_LEFT_Y_OFFSET = 74

MAX_REAR_Y_OFFSET = 21
MAX_RIGHT_X_OFFSET = 1

MAX_RIGHT_POINT = Point(x=MAX_TRAVEL_MM[Axis.X] - MAX_RIGHT_X_OFFSET, 
                            y=MAX_TRAVEL_MM[Axis.Y] - MAX_REAR_Y_OFFSET, 
                            z = MAX_TRAVEL_MM[Axis.Z])
MIN_LEFT_POINT = Point(
                        x=MIN_LEFT_X_OFFSET, 
                        y=MIN_LEFT_Y_OFFSET, 
                        z=MAX_RIGHT_POINT.z
                    )

BOWTIE_COORDINATES: Dict[Union[str, int], Point] = {
    0: MAX_RIGHT_POINT,  # back right and up
    1: MIN_LEFT_POINT._replace(z=MAX_RIGHT_POINT.z),  # front left and up
    2: MIN_LEFT_POINT,  # front left and down
    "Tip Pick Up - 1": Point(0, 0, 0),
    3: MIN_LEFT_POINT._replace(y=MAX_RIGHT_POINT.y),  # back left and down
    4: MAX_RIGHT_POINT._replace(x=MIN_LEFT_POINT.x),  # back left and up
    5: MAX_RIGHT_POINT._replace(y=MIN_LEFT_POINT.y),  # front right and up
    6: MIN_LEFT_POINT._replace(x=MAX_RIGHT_POINT.x),  # front right and down
    "Tip Pick Up - 2": Point(0, 0, 0),
    7: MAX_RIGHT_POINT._replace(z=MIN_LEFT_POINT.z),  # back right and down
    8: MAX_RIGHT_POINT,  # back right and up
}

HEADER = ["Cycle", "Time (H:M:S)", "Pick Up Current (A)",
            "XY Stall", "Y Stall", "Z_L Stall", "Z_R Stall", "Cycle Stalls", 
            "Total Stalls","Open-Loop Position", "Encoder Position", "Difference X (mm)", 
            "Difference Y (mm)", "Difference Z (mm)"]

TEST_DETAILS_HEADER = ["Robot Name", "Test Configuration", "Axis", "Max Speed (mm/s)", 
                        "Acceleration (mm^2/s)", "Hold Current (A)", "Run Current (A)", 
                        "Max Speed Discontinuity", "Direction Change Speed Discontinuity"]

AXES: List[Axis] = [Axis.X, Axis.Y, Axis.Z_L]

MAX_SPEED: List[int] = []
ACCEL: List[int] = []
HOLD_CURRENT: List[float] = []
RUN_CURRENT: List[float] = []
MAX_DISCONTINUITY: List[float] = []
DIRECTION_CHANGE_DISCONTINUITY: List[float] = []

def convert(seconds):
    weeks, seconds = divmod(seconds, 7 * 24 * 60 * 60)
    days, seconds = divmod(seconds, 24 * 60 * 60)
    hours, seconds = divmod(seconds, 60 * 60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)

def get_robot_name() -> str:
    response = requests.get("http://10.14.19.25:31950/health", headers={"opentrons-version": "3"})
    health_data = response.json()
    return health_data['name']

def record_test_details(
    test_name: str,
    run_id: str,
    file_name: str,
    robot_name: str,
    test_config: str,
) -> None:
    rows = [
        [TEST_DETAILS_HEADER[0], robot_name],
        [TEST_DETAILS_HEADER[1], test_config],
        [TEST_DETAILS_HEADER[2]] + [str(Axis.to_kind(axis)) for axis in AXES],
        [TEST_DETAILS_HEADER[3]] + [str(v) for v in MAX_SPEED],
        [TEST_DETAILS_HEADER[4]] + [str(v) for v in ACCEL],
        [TEST_DETAILS_HEADER[5]] + [str(v) for v in HOLD_CURRENT],
        [TEST_DETAILS_HEADER[6]] + [str(v) for v in RUN_CURRENT],
        [TEST_DETAILS_HEADER[7]] + [str(v) for v in MAX_DISCONTINUITY],
        [TEST_DETAILS_HEADER[8]] + [str(v) for v in DIRECTION_CHANGE_DISCONTINUITY],
    ]
    for row in rows:
        data.append_data_to_file(
            test_name=test_name,
            run_id=run_id,
            file_name=file_name,
            data=",".join(row) + "\n",
        )

async def _bowtie_move(api) -> tuple:
    # initialize stall counts for each axis
    stall_count = xy_count = y_count = z_l_count = z_r_count = 0

    for key in BOWTIE_COORDINATES.keys():
        if isinstance(key, int):
            print(f">> Move {key} <<\n")
            try:
                await api.move_to(OT3Mount.LEFT, BOWTIE_COORDINATES[key])
                print(f"Moved to {key} successfully\n")
            except StallOrCollisionDetectedError:
                print("--STALL DETECTED--\n")
                stall_count += 1
                print(f"Total stalls for this cycle: {stall_count}\n")
                print("------HOMING------\n")
                await api.home()
                home_z_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
                await api.move_to(
                    OT3Mount.LEFT,
                    Point(
                        BOWTIE_COORDINATES[key][0],
                        float(BOWTIE_COORDINATES[key][1]),
                        home_z_pos[Axis.Z_L],
                    ),
                )
                await api.move_to(OT3Mount.LEFT, BOWTIE_COORDINATES[key])

        else:
            print(f">> {key} <<\n")
            print("Moving mount down to calibration block...\n")
            tip_pick_up_pos = await api.current_position_ot3(
                OT3Mount.LEFT, refresh=True
            )
            print(f"tip_pick_up_pos: {tip_pick_up_pos}\n")
            await api.move_to(
                OT3Mount.LEFT,
                Point(
                    tip_pick_up_pos[Axis.X],
                    tip_pick_up_pos[Axis.Y],
                    tip_pick_up_pos[Axis.Z_L] - PREP_POSITION_BLOCK_LOCATION,
                ),
            )
            tip_len = 57
            print(f"tip_len: {tip_len}\n")
            print(f"picking up tip with mount: {OT3Mount.LEFT}\n")
            await api.pick_up_tip(OT3Mount.LEFT, tip_len, prep_after=False)
            api.remove_tip(OT3Mount.LEFT)
            print(f"Moving mount back up to previous position...\n")
            await api.move_to(
                OT3Mount.LEFT,
                Point(
                    tip_pick_up_pos[Axis.X],
                    tip_pick_up_pos[Axis.Y],
                    tip_pick_up_pos[Axis.Z_L],
                ),
            )

            # record position loss for each cycle
            open_loop_pos = await api.current_position_ot3(OT3Mount.LEFT, refresh=True)
            final_encoder_pos = await api.encoder_current_position_ot3(
                OT3Mount.LEFT, refresh=True
            )

    return (
        stall_count,
        xy_count,
        y_count,
        z_l_count,
        z_r_count,
        final_encoder_pos,
        open_loop_pos,
    )

async def _main(is_simulating: bool, cycles: int, mount: OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, stall_detection_enable=True
    )
    await api.cache_instruments()
    await api.home()
    load = api.gantry_load
    robot_name = 'TEST_ROBOT'
    test_name = f"gantry-z-lifetime-test-{robot_name}"
    test_config = load.value
    test_tag = load.value
    print(f"\ntest_config: {load.value}\n")

    rm = api.get_attached_instrument(OT3Mount.RIGHT).get("name")
    lm = api.get_attached_instrument(OT3Mount.LEFT).get("name")
    gripper = api.get_attached_instrument(OT3Mount.GRIPPER).get("name")

    if load == GantryLoad.LOW_THROUGHPUT and (rm is None or lm is None):
        sys.exit("Low throughput test requires two pipettes. Exiting test script...\n")
    else:
        print(f"Left mount: {lm}\n")
        print(f"Right mount (should be empty): {rm}\n")

    for AXIS in AXES:
        MAX_SPEED.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.default_max_speed, AXIS, load
            )
        )
        ACCEL.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.acceleration, AXIS, load
            )
        )
        HOLD_CURRENT.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.current_settings.hold_current, AXIS, load
            )
        )
        RUN_CURRENT.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.current_settings.run_current, AXIS, load
            )
        )
        MAX_DISCONTINUITY.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.max_speed_discontinuity, AXIS, load
            )
        )
        DIRECTION_CHANGE_DISCONTINUITY.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.direction_change_speed_discontinuity,
                AXIS,
                load,
            )
        )
    print(f"MAX_SPEED: {MAX_SPEED}\nACCEL: {ACCEL}\nHOLD_CURRENT: {HOLD_CURRENT}\nRUN_CURRENT: {RUN_CURRENT}\nMAX_DISCONTINUITY: {MAX_DISCONTINUITY}\nDIRECTION_CHANGE_DISCONTINUITY: {DIRECTION_CHANGE_DISCONTINUITY}\n")
    run_id = data.create_run_id()
    file_name = data.create_file_name(test_name=test_name, run_id=run_id, tag=test_tag)
    record_test_details(
        test_name=test_name,
        run_id=run_id,
        file_name=file_name,
        robot_name=robot_name,
        test_config=test_config,
    )
    header_str = ",".join(HEADER) + "\n"
    print(f"header_str: {header_str}\n")
    data.append_data_to_file(
        test_name=test_name,
        run_id=run_id,
        file_name=file_name,
        data=header_str,
    )

    start_time = time.perf_counter()
    total_stalls = 0

    await api.update_nozzle_configuration_for_mount(mount = OT3Mount.LEFT, 
        back_left_nozzle = 'A1',
        front_right_nozzle = 'H1'
    )
    for cycle in range(cycles):
        print(f"\n========== Cycle {cycle + 1}/{cycles} ==========\n")

        if (cycle + 1) % 10 == 0:
            # set current to 1.5A
            print("Setting pick up current to 1.5A\n")
            test_current = DEFAULT_Z_CURRENT
        else:
            # set current to 0.75A
            print("Setting pick up current to 0.75A\n")
            test_current = PARTIAL_PICK_UP_CURRENT

        helpers_ot3.update_pick_up_current(api, mount, test_current)

        print(f"96ch pick up current: {test_current}A\n")

        (
            stall_count,
            xy_count,
            y_count,
            z_l_count,
            z_r_count,
            final_encoder_pos,
            open_loop_pos,
        ) = await _bowtie_move(api)
        total_stalls += stall_count

        print(f"{final_encoder_pos}\n")
        print(f"{open_loop_pos}\n")
        diff_pos_x = final_encoder_pos[Axis.X] - open_loop_pos[Axis.X]
        diff_pos_y = final_encoder_pos[Axis.Y] - open_loop_pos[Axis.Y]
        diff_pos_z = final_encoder_pos[Axis.Z_L] - open_loop_pos[Axis.Z_L]
        str_open = (
            f"{open_loop_pos[Axis.X]:.3f}"
            + " "
            + f"{open_loop_pos[Axis.Y]:.3f}"
            + " "
            + f"{open_loop_pos[Axis.Z_L]:.3f}"
        )
        str_enc = (
            f"{final_encoder_pos[Axis.X]:.3f}"
            + " "
            + f"{final_encoder_pos[Axis.Y]:.3f}"
            + " "
            + f"{final_encoder_pos[Axis.Z_L]:.3f}"
        )
        
        cycle_data = [
            str(cycle + 1),
            str(convert(time.perf_counter() - start_time)),
            str(test_current),
            str(xy_count),
            str(y_count),
            str(z_l_count),
            str(z_r_count),
            str(stall_count),
            str(total_stalls),
            str_open,
            str_enc,
            str(diff_pos_x),
            str(diff_pos_y),
            str(diff_pos_z),
        ]
        # cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        cycle_data_str = ",".join(cycle_data) + "\n"
        data.append_data_to_file(
            test_name=test_name,
            run_id=run_id,
            file_name=file_name,
            data=cycle_data_str,
        )
    await api.home()


if __name__ == "__main__":
    mount_options = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument("--cycles", type=int, default=25000)
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, args.cycles, mount))
