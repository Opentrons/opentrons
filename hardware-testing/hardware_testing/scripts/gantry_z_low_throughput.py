import argparse
import asyncio
import time
from typing import List, Dict, Union 
import sys

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data


from opentrons.config.types import GantryLoad
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point

from opentrons.hardware_control.types import CriticalPoint
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

TIP_LENGTH_MM = 57

MIN_LEFT_X_OFFSET = -70
MIN_LEFT_Y_OFFSET = 74
MIN_Z_OFFSET = 509.15



BOWTIE_COORDINATES: Dict[Union[str, OT3Mount, int], Point] = {
        0: [Point(454.703, 396.3, 245.0), OT3Mount.LEFT, "start"],
        1: [Point(508.7, 396.3, 98.34), OT3Mount.RIGHT, "Z_R"],
        "Tip Pick Up - Right 1": ["", OT3Mount.RIGHT, "P"],
        2: [Point(0, 75.0, 245.0), OT3Mount.RIGHT, "XY"],
        3: [Point(MIN_LEFT_X_OFFSET, MIN_LEFT_Y_OFFSET, MIN_Z_OFFSET), OT3Mount.LEFT, "M"],
        4: [Point(MIN_LEFT_X_OFFSET, MIN_LEFT_Y_OFFSET, MIN_Z_OFFSET) - Point(x=0, y=0, z=150), OT3Mount.LEFT, "Z_L"],
        "Tip Pick Up - Left 1": ["", OT3Mount.LEFT, "P"],
        5: [Point(-54.0, 396.3, 245.0), OT3Mount.LEFT, "Y"],
        6: [Point(0, 396.3, 99.0), OT3Mount.RIGHT, "Z_R"],
        "Tip Pick Up - Right 2": ["", OT3Mount.RIGHT, "P"],
        7: [Point(509.0, 75.0, 245.0), OT3Mount.RIGHT, "XY"],
        8: [Point(MIN_LEFT_X_OFFSET, MIN_LEFT_Y_OFFSET, MIN_Z_OFFSET), OT3Mount.LEFT, "M"],
        9: [Point(MIN_LEFT_X_OFFSET, MIN_LEFT_Y_OFFSET, MIN_Z_OFFSET) - Point(x=0, y=0, z=150), OT3Mount.LEFT, "Z_L"],
        "Tip Pick Up - Left 2": ["", OT3Mount.LEFT, "P"],
        10: [Point(454.703, 396.3, 245.0), OT3Mount.LEFT, "Y"],
    }

HEADER = ["Cycle", "Time (H:M:S)", "XY Stall", "Y Stall", "Z_L Stall", "Z_R Stall", 
          "Cycle Stalls", "Total Stalls","Open-Loop Position", "Encoder Position", 
          "Difference X (mm)", "Difference Y (mm)", "Difference Z (mm)"]

TEST_DETAILS_HEADER = ["Robot Name", "Test Configuration", "Axis", "Max Speed (mm/s)", 
                        "Acceleration (mm^2/s)", "Hold Current (A)", "Run Current (A)", 
                        "Max Speed Discontinuity", "Direction Change Speed Discontinuity"]

AXES: List[Axis] = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]

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

def _create_points(x_pt, y_pt, z_pt):
    return {
        0: [Point(454.703, 396.3, 245.0), OT3Mount.LEFT, "start"],
        1: [Point(508.7, 396.3, 98.34), OT3Mount.RIGHT, "Z_R"],
        "Tip Pick Up - Right 1": ["", OT3Mount.RIGHT, "P"],
        2: [Point(0, 75.0, 245.0), OT3Mount.RIGHT, "XY"],
        3: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, "M"],
        4: [Point(x_pt, y_pt, z_pt) - Point(x=0, y=0, z=150), OT3Mount.LEFT, "Z_L"],
        "Tip Pick Up - Left 1": ["", OT3Mount.LEFT, "P"],
        5: [Point(-54.0, 396.3, 245.0), OT3Mount.LEFT, "Y"],
        6: [Point(0, 396.3, 99.0), OT3Mount.RIGHT, "Z_R"],
        "Tip Pick Up - Right 2": ["", OT3Mount.RIGHT, "P"],
        7: [Point(509.0, 75.0, 245.0), OT3Mount.RIGHT, "XY"],
        8: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, "M"],
        9: [Point(x_pt, y_pt, z_pt) - Point(x=0, y=0, z=150), OT3Mount.LEFT, "Z_L"],
        "Tip Pick Up - Left 2": ["", OT3Mount.LEFT, "P"],
        10: [Point(454.7, 396.3, 245.0), OT3Mount.LEFT, "Y"],
    }


async def _bowtie_move(api) -> tuple:
    stall_count = xy_count = y_count = z_l_count = z_r_count = 0

    for key in BOWTIE_COORDINATES.keys():
        if isinstance(key, int):
            print(f">> Move {key} <<\n")
            if key == 3 or key == 8:
                cur_pos = await api.current_position_ot3(
                    OT3Mount.LEFT, refresh=True
                )
                x_pt = cur_pos[Axis.X]
                y_pt = cur_pos[Axis.Y]
                z_pt = cur_pos[Axis.Z_L]
                BOWTIE_COORDINATES = _create_points(x_pt, y_pt, z_pt)
            try:
                await api.move_to(BOWTIE_COORDINATES[key][1], BOWTIE_COORDINATES[key][0])
                print(
                    f"Current position: {await api.gantry_position(BOWTIE_COORDINATES[key][1])} on Mount: {BOWTIE_COORDINATES[key][1]}"
                )
                encoder_pos = await api.encoder_current_position_ot3(
                    BOWTIE_COORDINATES[key][1], refresh=True
                )
                if BOWTIE_COORDINATES[key][1] == OT3Mount.LEFT:
                    AXIS = Axis.Z_L
                else:
                    AXIS = Axis.Z_R
                print(
                    f"Encoder position: ({encoder_pos[Axis.X]}, {encoder_pos[Axis.Y]}, {encoder_pos[AXIS]})"
                )
                if key != 10:
                    print(
                        f"Moving to: {BOWTIE_COORDINATES[key+1][0]} on {BOWTIE_COORDINATES[key+1][1]}\n"
                    )
            except StallOrCollisionDetectedError:
                print("--STALL DETECTED--\n")
                print(f"Axis/Axes stalled: {BOWTIE_COORDINATES[key][2]}\n")
                stall_count += 1
                if BOWTIE_COORDINATES[key][1] == OT3Mount.LEFT:
                    STALL_AXIS = Axis.Z_L
                    z_l_count += 1
                else:
                    STALL_AXIS = Axis.Z_R
                    z_r_count += 1
                print("------HOMING------\n")
                if "X" in BOWTIE_COORDINATES[key][2]:
                    await api.home()
                    xy_count += 1
                elif BOWTIE_COORDINATES[key][2] == "Y":
                    await api.home([Axis.Y])
                    y_count += 1
                elif "Z" in BOWTIE_COORDINATES[key][2]:
                    await api.home([STALL_AXIS])

                print(
                    f"Total stalls for this cycle: {stall_count} (XY: {xy_count}, Y: {y_count}, Z_L: {z_l_count}, Z_R: {z_r_count})\n"
                )
                # await api.home()
                home_z_pos = await api.current_position_ot3(
                    BOWTIE_COORDINATES[key][1], refresh=True
                )
                await api.move_to(
                    BOWTIE_COORDINATES[key][1],
                    Point(
                        BOWTIE_COORDINATES[key][0][0],
                        BOWTIE_COORDINATES[key][0][1],
                        home_z_pos[STALL_AXIS],
                    ),
                )
                await api.move_to(BOWTIE_COORDINATES[key][1], BOWTIE_COORDINATES[key][0])
        # This section is performs the pick routine at the coordinate
        else:
            print(f">> {key} <<\n")
            print("Moving mount down to calibration block...\n")
            tip_pick_up_pos = await api.current_position_ot3(
                BOWTIE_COORDINATES[key][1], refresh=True
            )
            await api.move_to(
                BOWTIE_COORDINATES[key][1],
                Point(tip_pick_up_pos[Axis.X], tip_pick_up_pos[Axis.Y], 70.5),
            )  # 72mm with rectangular aluminum block
            await api.pick_up_tip(BOWTIE_COORDINATES[key][1], TIP_LENGTH_MM, prep_after=False)
            await api.remove_tip(BOWTIE_COORDINATES[key][1])
            if BOWTIE_COORDINATES[key][1] == OT3Mount.LEFT:
                AXIS = Axis.Z_L
            else:
                AXIS = Axis.Z_R
            await api.home_z(Axis.by_mount(AXIS))
            await api.move_rel(BOWTIE_COORDINATES[key][1], delta=Point(z=-5))

            # record position loss for each cycle
            open_loop_pos = await api.current_position_ot3(
                OT3Mount.LEFT, refresh=True
            )
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

    robot_name = "GLT Low Throughput"
    test_name = "gantry-z-lifetime-test"
    test_config = load.value
    test_tag = load.value
    print(f"\ntest_config: {load.value}\n")

    rm = api.get_attached_instrument(OT3Mount.RIGHT).get("name")
    lm = api.get_attached_instrument(OT3Mount.LEFT).get("name")
    gripper = api.get_attached_instrument(OT3Mount.GRIPPER).get("name")

    if load == GantryLoad.LOW_THROUGHPUT and (rm is None or lm is None):
        sys.exit("Low throughput test requires two pipettes. Exiting test script...\n")

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

    for cycle in range(cycles):
        print(f"\n========== Cycle {cycle + 1}/{cycles} ==========\n")
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
