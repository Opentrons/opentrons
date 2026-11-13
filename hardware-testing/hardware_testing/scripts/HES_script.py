import argparse
import asyncio
import csv
import os
import sys
import tty
import termios
import time
from typing import List, Optional, Sequence, Awaitable, Dict

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import OT3Mount, Axis, CriticalPoint, OT3AxisKind
from opentrons.types import Point
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.drivers.hall_sensor import HallEffectSensor
from hardware_testing.drivers.hall_sensor.driver import find_port_by_id
from hardware_testing.drivers.mitutoyo_digimatic_indicator import find_dial
from hardware_testing.drivers import mitutoyo_digimatic_indicator

from opentrons.config.defaults_ot3 import (
    DEFAULT_RUN_CURRENT,
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
)

Z_DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[OT3AxisKind.Z]
Z_DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.Z]
Z_DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Z]
P_DEFAULT_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[OT3AxisKind.P]
P_DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.P]
P_DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.P]

VID = 1155
PID = 14158
INCREMENT_MM = 0.06
TRAVEL_MM = 6.6
SETTLE_S = 1
PLATEAU_S = 1.0
SPEED = 5.0
HOME_LIMIT_MM = 0.0
# Pause upward pull here so an ejector-up fixture can be installed (same as Plunger_Test).
NUM_TRIALS = 5
CAL_BLOCK_POSITION = Point(177.32, 75.5, 60.0)
DIAL_LOCATION = Point(-24.28, 149.51, 143.0)
TIPRACK_LOCATION = Point(178.03, 179.33, 99.71)
DROP_TIP_LOCATION = Point(178.03, 179.33, 99.71)
HOVER_DROP_MM = 10.0
Z_MIN_SPEED = 2.0
Z_MIN_CURRENT = 0.1
# Approach to hover is far from the block, so it runs fast at full current.
Z_HOVER_SPEED = 65.0
PLUNGER_SETUP_MM = 87.0
PLUNGER_FIXTURE_SETUP_MM = 72.9
PLUNGER_SETUP_SPEED = 10.0
STALL_PLUNGER_MM = 100.0
STALL_PLUNGER_SPEED = 1.0
STALL_PLUNGER_CURRENT = 0.15
READINGS = 30
TIPS = 96
TIP_RACK_COLS = 12
TIP_OVERLAP = 10.5
TIP_LENGTH_MM = {
    "T1K": 95.5,
    "T200": 58.35,
    "T50": 57.9,
    "T20": 52.0,
}

def getch() -> str:
    """This functions gets a single input keyboard character from the user.

    fd: file descriptor stdout, stdin, stderr
    """
    ch = ""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch

async def jog(
    api: OT3API, position: Dict[Axis, float], cp: CriticalPoint
) -> Dict[Axis, float]:
    """Jog the given axis a specified distance (mm)."""
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    xy_speed = 60
    za_speed = 65
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0

        elif input == "\r":
            sys.stdout.flush()
            position = await api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            print("\r\n")
            return position
            
        position = await api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )
        print(
            "Coordinates: ",
            round(position[Axis.X], 2),
            ",",
            round(position[Axis.Y], 2),
            ",",
            round(position[Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )

        print("\r", end="")

async def lift_z_clear(api: OT3API, mount: OT3Mount, cp: CriticalPoint) -> float:
    """Raise Z to travel height without moving XY. Returns that Z (mm)."""
    home_z = api.get_instrument_max_height(mount, cp) - 10
    pos = await api.current_position_ot3(mount, refresh=True, critical_point=cp)
    await api.move_to(
        mount, Point(pos[Axis.X], pos[Axis.Y], home_z), speed=Z_HOVER_SPEED
    )
    return home_z


async def move_to_point(
    api: OT3API,
    mount: OT3Mount,
    point: Point,
    cp: CriticalPoint,
    z_speed: Optional[float] = None,
) -> None:
    """Lift, slide XY, then lower. Lift stays at Z_HOVER_SPEED; descent uses z_speed."""
    descent_speed = Z_HOVER_SPEED if z_speed is None else z_speed
    home_z = await lift_z_clear(api, mount, cp)
    pos = await api.current_position_ot3(mount, refresh=True, critical_point=cp)
    await api.move_to(mount, Point(point.x, point.y, home_z))
    pos = await api.current_position_ot3(mount, refresh=True, critical_point=cp)
    await api.move_to(mount, Point(pos[Axis.X], pos[Axis.Y], point.z), speed=descent_speed)

async def find_ejector_end_effector(
    api: OT3API,
    mount: OT3Mount,
    position: float,
    speed: float,
    current: float
) -> None:
    # set max currents/speeds, to make sure we're not accidentally limiting ourselves
    pipette_ax = Axis.of_main_tool_actuator(mount)
    print(f"Plunger axis: {pipette_ax}")
    await helpers_ot3.move_plunger_absolute_ot3(
            api, mount, PLUNGER_SETUP_MM, speed=PLUNGER_SETUP_SPEED)
    await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        api, pipette_ax, run_current=current
    )
    current_position = await api.current_position_ot3(mount, refresh=True)
    print(f"Plunger Current position: {current_position}")
    # move
    try:
        await helpers_ot3.move_plunger_absolute_ot3(
            api, mount, position, speed=speed, motor_current=current, expect_stalls=True
        )
    except Exception as e:
        pass
    await api._update_position_estimation()
    await api.refresh_positions()
    ejector_position = await api.current_position_ot3(mount, refresh=True)
    print(f"Ejector Current position: {ejector_position}")
    # await asyncio.sleep(2)
    # await _home_plunger(api, mount)
    # await helpers_ot3.move_plunger_absolute_ot3(
    #         api, mount, position, speed=speed, motor_current=current, expect_stalls=True
    #     )
    return ejector_position[Axis.of_main_tool_actuator(mount)]

async def _home_plunger(api: OT3API, mount: OT3Mount) -> None:
    # restore default current/speed before homing
    pipette_ax = Axis.of_main_tool_actuator(mount)
    await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
        api, pipette_ax, run_current=1.0
    )
    await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
        api,
        pipette_ax,
        default_max_speed=P_DEFAULT_SPEED / 2,
        acceleration=P_DEFAULT_ACCELERATION,
    )
    await api.home([pipette_ax])

async def get_nozzle_end_effector(api: OT3API, mount: OT3Mount, collision_position: Point, axes: Sequence[Axis]) -> float:
    z_ax = Axis.by_mount(mount)
    try:
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                                                api, z_ax, run_current=Z_MIN_CURRENT)
        # target = target_position_from_from_relative(mount, Point(z=-40), api._current_position)
        # await api._move(target, speed=Z_MIN_SPEED, expect_stalls=True)
        # await api._update_position_estimation([Axis.by_mount(mount)])
        await api.move_to(mount,
            Point(collision_position.x, collision_position.y, collision_position.z),
            speed=Z_MIN_SPEED,
            critical_point=CriticalPoint.NOZZLE,
            expect_stalls=True,
        )
    except Exception as e:
        pass
    await api._update_position_estimation(list(axes))
    await api.refresh_positions()
    nozzle_position = await api.current_position_ot3(mount, refresh=True)
    return nozzle_position[Axis.by_mount(mount)]

def average_readings(readings: List[Optional[float]]) -> Optional[float]:
    """Return the average of a list of readings, ignoring None values."""
    valid_readings = [r for r in readings if r is not None]
    if not valid_readings:
        return None
    return sum(valid_readings) / len(valid_readings)


def append_tip_overlap_csv(row: List[float]) -> None:
    """Append a single measurement row to a CSV file."""
    csv_path = "tip_overlap_results.csv"
    fieldnames = [
        "tip_number",
        "tip_result",
        "bx",
        "by",
        "bz",
        "tip_overlap",
        "hes_tip_overlap",
    ]
    file_exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow({
            "tip_number": row[0],
            "tip_result": row[1],
            "bx": row[2],
            "by": row[3],
            "bz": row[4],
            "tip_overlap": row[5],
            "hes_tip_overlap": row[6],
        })

async def record_hes_readings(api: OT3API, 
        mount: OT3Mount, sensor: HallEffectSensor)-> tuple[Optional[tuple[float, float, float]], Optional[float], float, float]:
    current_position = await api.current_position_ot3(mount, refresh=True)
    plunger_position = current_position[Axis.of_main_tool_actuator(mount)]
    current_enc_position = await api.encoder_current_position(mount, refresh=True)
    enc_plunger_position = current_enc_position[Axis.of_main_tool_actuator(mount)]
    data = sensor.get_n_samples(n=READINGS)
    magnetic_field = sensor.parse_data(data)
    angle = sensor.convert_to_angle(magnetic_field)
    return (magnetic_field[0], magnetic_field[1], magnetic_field[2], 
            angle, plunger_position, enc_plunger_position,
                current_position[Axis.by_mount(mount)], 
                current_enc_position[Axis.by_mount(mount)])

async def dynamic_recording(sensor: HallEffectSensor):
    """Record HES readings until user stops."""
    readings = []
    start_time = time.time()
    while time.time() - start_time < 10:  # Record for 30 seconds
        data = await asyncio.to_thread(sensor.get_n_samples, n=1)
        magnetic_field = sensor.parse_data(data)
        if magnetic_field is None:
            continue
        angle = sensor.convert_to_angle(magnetic_field)
        readings.append([(magnetic_field[0], magnetic_field[1], magnetic_field[2], angle)])
        print(f"{magnetic_field[0]}, {magnetic_field[1]}, "
                    f"{magnetic_field[2]}, {angle} ")
    return readings

async def pick_up_tip(api: OT3API, mount: OT3Mount) -> None:
    tip_length = TIP_LENGTH_MM[args.tip_size] - TIP_OVERLAP
    hover_z_distance = 10
    await api.pick_up_tip(
        mount,
        tip_length=tip_length,
    )
    # Lift Z axis by 10mm after pick up
    pos = await api.current_position_ot3(mount, refresh=True)
    await api.move_to(mount, 
                        Point(pos[Axis.X], 
                        pos[Axis.Y], 
                        pos[Axis.by_mount(mount)] + hover_z_distance), 
                        speed=Z_HOVER_SPEED, critical_point=CriticalPoint.TIP)
    await asyncio.sleep(SETTLE_S)
    

async def get_HES_ejector_down_range(api: OT3API, mount: OT3Mount, sensor: HallEffectSensor) -> List[Optional[float]]:
    """Get HES readings for a range of plunger positions."""
    num_steps = int(round(TRAVEL_MM / INCREMENT_MM))
    list_of_readings = []
    print(f"Step, Bx_mT, By_mT, Bz_mT, angle, "
          f"plunger_position(mm), enc_plunger_position(mm), "
          f"current_position, current_enc_position")
    for i in range(1, num_steps + 1):
        data = await record_hes_readings(api, mount, sensor)
        list_of_readings.append(data)
        print(f"{i}, {data[0]}, {data[1]}, "
              f"{data[2]}, {data[3]}, {data[4]}, {data[5]},"
              f"{data[6]}, {data[7]}")
        new_position = data[4] - INCREMENT_MM
        await helpers_ot3.move_plunger_absolute_ot3(
            api, mount, new_position, speed=1.0)
        await asyncio.sleep(SETTLE_S)
    return list_of_readings

async def get_HES_ejector_up_range(api: OT3API, mount: OT3Mount, sensor: HallEffectSensor) -> List[Optional[float]]:
    """Get HES readings for a range of plunger positions."""
    REMAINING_TRAVEL = 4.86
    num_steps = int(round(REMAINING_TRAVEL / INCREMENT_MM))
    list_of_readings = []
    print(f"Step, Bx_mT, By_mT, Bz_mT, angle, "
          f"plunger_position(mm), enc_plunger_position(mm), "
          f"current_position, current_enc_position")
    for i in range(1, num_steps + 1):
        data = await record_hes_readings(api, mount, sensor)
        list_of_readings.append(data)
        print(f"{i}, {data[0]}, {data[1]}, "
              f"{data[2]}, {data[3]}, {data[4]}, {data[5]}, "
              f"{data[6]}, {data[7]}")
        pos = await api.current_position_ot3(mount, refresh=True)
        new_position = pos[Axis.by_mount(mount)] - INCREMENT_MM
        await api.move_to(mount, Point(pos[Axis.X], pos[Axis.Y], new_position), speed=1.0, critical_point=CriticalPoint.NOZZLE)
        # await helpers_ot3.move_plunger_absolute_ot3(
        #     api, mount, new_position, speed=1.0)
        await asyncio.sleep(SETTLE_S)
    return list_of_readings

async def _main() -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    sensor_port = find_port_by_id(VID, PID)
    if not sensor_port:
        sys.exit(f"Could not find Hall Effect Sensor on USB with VID={VID} PID={PID}")
    sensor = HallEffectSensor(port=sensor_port)
    sensor.connect()
    test = args.test
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port="/dev/ttyUSB0")
    gauge.connect()
    print("Connect")
    try:
        await api.cache_instruments()
        await api.home()
        await api.home_plunger(mount)
        if test == "plunger_calibration":
            current_position = await api.current_position_ot3(mount, refresh=True)
            print(f"Current position: {current_position}")
            plunger_position = current_position[Axis.of_main_tool_actuator(mount)]
            print(f"Plunger position: {plunger_position:.3f} mm")
            start_pos = CAL_BLOCK_POSITION._replace(z=CAL_BLOCK_POSITION.z + HOVER_DROP_MM)
            await move_to_point(api, mount, start_pos, CriticalPoint.NOZZLE)
            collision_position = CAL_BLOCK_POSITION._replace(z=CAL_BLOCK_POSITION.z - 50)
            print(f"Descending to block at {collision_position} ...")
            nozzle_z = await get_nozzle_end_effector(api, mount, collision_position, [Axis.by_mount(mount)])
            await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                api, Axis.by_mount(mount), run_current=Z_DEFAULT_CURRENT
            )
            print(f"Nozzle end effector Z position: {nozzle_z:.3f} mm")
            ejector_pos = await find_ejector_end_effector(
                api,
                mount,
                position=STALL_PLUNGER_MM,
                speed=STALL_PLUNGER_SPEED,
                current=STALL_PLUNGER_CURRENT,
            )
            print(f"Ejector end effector position: {ejector_pos:.3f} mm")
            data = sensor.get_n_samples(n=READINGS)
            magnetic_field = sensor.parse_data(data)
            angle = sensor.convert_to_angle(magnetic_field)
            print(f'HES_angle_data: {angle}')
            input("Press Enter to continue after installing the ejector-up fixture...")
            await get_HES_ejector_down_range(api, mount, sensor)
            await helpers_ot3.move_plunger_absolute_ot3(
                api, mount, 71.5, speed=PLUNGER_SETUP_SPEED, motor_current=1.0)
            tiprack_pos = Point(TIPRACK_LOCATION.x, TIPRACK_LOCATION.y, 87.2)
            await move_to_point(api, mount, TIPRACK_LOCATION, CriticalPoint.NOZZLE)
            unsheath_pos = await jog(api, TIPRACK_LOCATION, CriticalPoint.NOZZLE)
            await get_HES_ejector_up_range(api, mount, sensor)
        elif test == "tip_overlap":
            await move_to_point(api, mount, DIAL_LOCATION, CriticalPoint.NOZZLE)
            dial_pos = await jog(api, DIAL_LOCATION, CriticalPoint.NOZZLE)
            nozzle_result = gauge.read_stable()
            raw_reading = sensor.get_n_samples(n=READINGS)
            magnetic_field = sensor.parse_data(raw_reading)
            angle = sensor.convert_to_angle(magnetic_field)
            print(f"{nozzle_result}, {angle}, {magnetic_field}")
            await move_to_point(api, mount, TIPRACK_LOCATION, CriticalPoint.NOZZLE)
            tiprack_pos = await jog(api, TIPRACK_LOCATION, CriticalPoint.NOZZLE)
            result = []
            spacing_x = 0
            spacing_y = 0
            for tip in range(1, TIPS+1):
                await api.pick_up_tip(
                    mount,
                    tip_length=(TIP_LENGTH_MM[args.tip_size] - TIP_OVERLAP),
                )
                await lift_z_clear(api, mount, CriticalPoint.TIP)
                await asyncio.sleep(SETTLE_S)
                raw_reading = sensor.get_n_samples(n=READINGS)
                magnetic_field = sensor.parse_data(raw_reading)
                angle = sensor.convert_to_angle(magnetic_field)
                await move_to_point(api, mount, DIAL_LOCATION, CriticalPoint.TIP)
                tip_result = gauge.read_stable()
                result.append(tip_result)
                tip_overlap = (nozzle_result - tip_result) + TIP_OVERLAP
                hes_tip_overlap = 7.7 + -0.125*angle + -0.000129*angle**2
                csv_row = [
                    tip,
                    tip_result,
                    magnetic_field[0],
                    magnetic_field[1],
                    magnetic_field[2],
                    tip_overlap,
                    hes_tip_overlap,
                ]
                append_tip_overlap_csv(csv_row)
                print(f"{tip_result}, {angle}, {magnetic_field[0]}, {magnetic_field[1]},"
                      f"{magnetic_field[2]}, {tip_overlap}, {hes_tip_overlap}")
                drop_tip_loc = Point(tiprack_pos[Axis.X] + spacing_x, 
                                        tiprack_pos[Axis.Y] + spacing_y, 
                                        tiprack_pos[Axis.by_mount(mount)])
                await move_to_point(api, mount, drop_tip_loc, CriticalPoint.TIP)
                await api.drop_tip(mount)
                # Next well: across the row, then down to the next row.
                if tip % TIP_RACK_COLS == 0:
                    spacing_x = 0
                    spacing_y -= 9
                else:
                    spacing_x += 9
                new_tip_loc = Point(tiprack_pos[Axis.X] + spacing_x, 
                                        tiprack_pos[Axis.Y] + spacing_y, 
                                        tiprack_pos[Axis.by_mount(mount)])
                await move_to_point(api, mount, new_tip_loc, CriticalPoint.TIP)
            print(f"Tip results: {result}")
        elif test == "dynamic_data_collection":
            await move_to_point(api, mount, DIAL_LOCATION, CriticalPoint.NOZZLE)
            dial_pos = await jog(api, DIAL_LOCATION, CriticalPoint.NOZZLE)
            nozzle_result = gauge.read_stable()
            raw_reading = sensor.get_n_samples(n=READINGS)
            magnetic_field = sensor.parse_data(raw_reading)
            angle = sensor.convert_to_angle(magnetic_field)
            print(f"{nozzle_result}, {angle}, {magnetic_field}")
            await move_to_point(api, mount, TIPRACK_LOCATION, CriticalPoint.NOZZLE)
            tiprack_pos = await jog(api, TIPRACK_LOCATION, CriticalPoint.NOZZLE)
            spacing_x = 0
            spacing_y = 0
            tip_length = TIP_LENGTH_MM[args.tip_size] - TIP_OVERLAP
            for tip in range(1, TIPS+1):
                # Create two tasks: one for dynamic reading and one for picking up the tip and recording
                dynamic_reading_task = asyncio.create_task(dynamic_recording(sensor))
                pick_up_task = asyncio.create_task(pick_up_tip(api, mount))
                pending_tasks = [dynamic_reading_task, pick_up_task]
                results = await asyncio.gather(*pending_tasks, return_exceptions=True)
                print(f"Tip: {tip}")
                # print(f"Dynamic readings for tip {tip}: {results}")
                # Move to the dial location and record the tip result
                await move_to_point(api, mount, DIAL_LOCATION, CriticalPoint.TIP)
                tip_result = gauge.read_stable()
                tip_overlap = (nozzle_result - tip_result) + TIP_OVERLAP
                print(f"{tip_overlap}, {tip_result}")
                # Return to the tip rack and drop the tip
                drop_tip_loc = Point(tiprack_pos[Axis.X]+ spacing_x, 
                                        tiprack_pos[Axis.Y]+ spacing_y, 
                                        tiprack_pos[Axis.by_mount(mount)])
                await move_to_point(api, mount, drop_tip_loc, CriticalPoint.TIP)
                # Drop the tip
                await api.drop_tip(mount)
                # Next well: across the row, then down to the next row.
                if tip % TIP_RACK_COLS == 0:
                    spacing_x = 0
                    spacing_y -= 9
                else:
                    spacing_x += 9
                # Move to the next tip location
                new_tip_loc = Point(tiprack_pos[Axis.X] + spacing_x, 
                                        tiprack_pos[Axis.Y] + spacing_y, 
                                        tiprack_pos[Axis.by_mount(mount)])
                await move_to_point(api, mount, new_tip_loc, CriticalPoint.TIP)
        else:
            print(f"Unknown test: {test}")
            sys.exit(1)
    except Exception as e:
        raise(e)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--dial", action="store_true")
    parser.add_argument("--mount", choices=["left", "right"], default="right")
    parser.add_argument("--test", choices=["plunger_calibration", "tip_overlap","dynamic_data_collection"], default="tip_overlap")
    parser.add_argument(
        "--tip-size",
        dest="tip_size",
        type=str,
        choices=list(TIP_LENGTH_MM.keys()),
        default="T50",
        help="Tip size for pick_up_tip (default T50)",
    )
    parser.add_argument(
        "--increment",
        type=float,
        default=INCREMENT_MM,
        help=f"mm per plunger step (default {INCREMENT_MM})",
    )
    parser.add_argument(
        "--travel-mm",
        type=float,
        default=TRAVEL_MM,
        dest="travel_mm",
        help=f"total up travel after sheath contact (default {TRAVEL_MM})",
    )
    parser.add_argument(
        "--z-current",
        type=float,
        default=Z_MIN_CURRENT,
        dest="z_current",
        help=f"Z run current (amps) during the descent onto the block "
        f"(default {Z_MIN_CURRENT})",
    )
    parser.add_argument(
        "--plunger-current",
        type=float,
        default=STALL_PLUNGER_CURRENT,
        dest="plunger_current",
        help=f"plunger run current (amps) during the ram into the block "
        f"(default {STALL_PLUNGER_CURRENT})",
    )
    parser.add_argument(
        "--settle",
        type=float,
        default=SETTLE_S,
        help=f"seconds to let the plunger stop ringing (default {SETTLE_S})",
    )
    parser.add_argument(
        "--plateau",
        type=float,
        default=PLATEAU_S,
        help=f"seconds held at each step for recording (default {PLATEAU_S})",
    )
    args = parser.parse_args()
    mount = OT3Mount.LEFT if args.mount == "left" else OT3Mount.RIGHT
    asyncio.run(_main())