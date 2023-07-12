"""Belt Calibration OT3."""
import argparse
import asyncio
import time

from opentrons.hardware_control.ot3api import OT3API

from opentrons.config.defaults_ot3 import DEFAULT_MACHINE_TRANSFORM
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)
from opentrons.hardware_control.ot3_calibration import (
    CalibrationStructureNotFoundError,
    calibrate_belts,
    calibrate_pipette,
    find_calibration_structure_position,
)
from hardware_testing import data
from hardware_testing.data import ui
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing.drivers import mitutoyo_digimatic_indicator

DIAL_HEIGHT = 10 # mm
DIAL_JOG_DISTANCE = 22 # mm
DIAL_JOG_SPEED = 10 # mm/s
GAUGE_BLOCK = 12 # mm
PROBE_TIP_DIA = 4 # mm

gauges = {}
gauge_slot = {
    "XL":1,
    "XR":3,
    "YF":1,
    "YB":10,
}
gauge_zero = {
    "XL":0,
    "XR":0,
    "YF":0,
    "YB":0,
}
gauge_ports = {
    "XL":"/dev/ttyUSB0",
    "XR":"/dev/ttyUSB1",
    "YF":"/dev/ttyUSB2",
    "YB":"/dev/ttyUSB3",
}
slot_center = {
    "XL":None,
    "XR":None,
    "YF":None,
    "YB":None,
}
test_data = {
    "Time":"None",
    "Cycle":"None",
    "Pipette":"None",
    "Belt Status":"None",
    "XL Zero":"None",
    "XR Zero":"None",
    "YF Zero":"None",
    "YB Zero":"None",
    "XL Gauge":"None",
    "XR Gauge":"None",
    "YF Gauge":"None",
    "YB Gauge":"None",
    "XL Position":"None",
    "XR Position":"None",
    "YF Position":"None",
    "YB Position":"None",
    "Slot 1 Offset":"None",
    "Slot 3 Offset":"None",
    "Slot 10 Offset":"None",
    "Slot 12 Offset":"None",
    "Belt Attitude":"None",
}
test_name = None
test_file = None
start_time = None
pipette_id = None

def _dict_keys_to_line(dict):
    return str.join(",", list(dict.keys()))+"\n"


def _dict_values_to_line(dict):
    return str.join(",", list(dict.values()))+"\n"


def _test_setup(api: OT3API, mount: types.OT3Mount):
    _file_setup()
    _gauge_setup()
    _deck_setup()
    _instrument_setup(api, mount)


def _file_setup():
    global test_name, test_file
    test_name = "belt_calibration"
    test_tag = f"slot5"
    test_header = _dict_keys_to_line(test_data)
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)


def _gauge_setup():
    for key, value in gauge_ports.items():
        gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
        gauges[key].connect()


def _deck_setup():
    global slot_center
    for key, value in gauge_slot.items():
        slot_center[key] = types.Point(*get_calibration_square_position_in_slot(value))._replace(z=DIAL_HEIGHT)


def _instrument_setup(api: OT3API, mount: types.OT3Mount):
    global test_data, pipette_id
    if args.simulate:
        pipette_id = "SIMULATION"
    else:
        pipette_id = api._pipette_handler.get_pipette(mount).pipette_id
    test_data["Pipette"] = str(pipette_id)


def _zero_gauges():
    global test_data
    for key, value in gauges.items():
        print(f"\nPlace Gauge Block on Deck Slot #{gauge_slot[key]}")
        input(f"\nPush block against {key} Gauge and Press ENTER\n")
        _reading = True
        while _reading:
            zeros = []
            for i in range(5):
                gauge = gauges[key].read_stable(timeout=20)
                zeros.append(gauge)
            _variance = abs(max(zeros) - min(zeros))
            print(f"Variance = {_variance}")
            if _variance < 0.1:
                _reading = False
        zero = sum(zeros) / len(zeros)
        gauge_zero[key] = zero
        test_data[f"{key} Zero"] = str(zero)
        print(f"{key} Gauge Zero = {zero}mm")
    input(f"\nRemove Gauge Block from Deck and Press ENTER\n")


def _record_data(api: OT3API, cycle: int):
    global test_data
    elapsed_time = (time.time() - start_time)/60
    test_data["Time"] = str(round(elapsed_time, 3))
    test_data["Cycle"] = str(cycle)
    test_data["Belt Attitude"] = _get_attitude(api)
    test_info = _dict_values_to_line(test_data)
    data.append_data_to_file(test_name, test_file, test_info)


async def _calibrate_pipette(api: OT3API, mount: types.OT3Mount) -> None:
    ui.print_header("CALIBRATE PIPETTE")
    await api.home()
    try:
        await calibrate_pipette(api, mount, slot=5)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not api.is_simulator:
            raise e
    finally:
        await api.home_z(mount)


async def _check_belt_accuracy_probe(api: OT3API, mount: types.OT3Mount) -> None:
    global test_data
    ui.print_header("CHECK BELT ACCURACY WITH PROBE")
    for slot in [1, 3, 10, 12]:
        await api.home()
        # if not api.is_simulator:
        #     ui.get_user_ready(f"about to find offset of slot #{slot}")
        await api.add_tip(mount, api.config.calibration.probe_length)
        nominal_pos = types.Point(*get_calibration_square_position_in_slot(slot))
        try:
            slot_offset = await find_calibration_structure_position(
                api, mount, nominal_pos
            )
        except CalibrationStructureNotFoundError as e:
            if not api.is_simulator:
                raise e
            slot_offset = types.Point()
        await api.remove_tip(mount)
        test_data[f"Slot {slot} Offset"] = str(_trunc_point(slot_offset)).replace(", ",";")
        print(f"Slot #{slot}: {slot_offset}")
        await api.home_z(mount)


async def _check_belt_accuracy_dial(api: OT3API, mount: types.OT3Mount) -> None:
    ui.print_header("CHECK BELT ACCURACY WITH DIAL")
    await api.home()
    await api.add_tip(mount, api.config.calibration.probe_length)
    await _measure_axis(api, mount, "X")
    await _measure_axis(api, mount, "Y")
    await api.home()
    await api.remove_tip(mount)


async def _measure_axis(api: OT3API, mount: types.OT3Mount, axis: str) -> None:
    global test_data, slot_center
    await api.home_z(mount)
    current_position = await api.gantry_position(mount)
    left_center = slot_center["XL"]
    right_center = slot_center["XR"]
    front_center = slot_center["YF"]
    back_center = slot_center["YB"]
    if "X" in axis:
        above_left = left_center._replace(z=current_position.z)
        await api.move_to(mount, above_left)
        await api.move_to(mount, left_center)
        # x_left_pos = await _get_position(api, mount)
        x_left_pos, x_left_gauge = await _read_gauge(api, mount, "XL")
        test_data["XL Gauge"] = str(x_left_gauge)
        test_data["XL Position"] = x_left_pos
        print(f"X-Left Gauge = {x_left_gauge} mm")
        print(f"X-Left Position = {x_left_pos}\n")
        await api.move_to(mount, right_center)
        # x_right_pos = await _get_position(api, mount)
        x_right_pos, x_right_gauge = await _read_gauge(api, mount, "XR")
        test_data["XR Gauge"] = str(x_right_gauge)
        test_data["XR Position"] = x_right_pos
        print(f"X-Right Gauge = {x_right_gauge} mm")
        print(f"X-Right Position = {x_right_pos}\n")
        await api.move_to(mount, right_center)
    elif "Y" in axis:
        above_front = front_center._replace(z=current_position.z)
        await api.move_to(mount, above_front)
        await api.move_to(mount, front_center)
        # y_front_pos = await _get_position(api, mount)
        y_front_pos, y_front_gauge = await _read_gauge(api, mount, "YF")
        test_data["YF Gauge"] = str(y_front_gauge)
        test_data["YF Position"] = y_front_pos
        print(f"Y-Front Gauge = {y_front_gauge} mm")
        print(f"Y-Front Position = {y_front_pos}\n")
        await api.move_to(mount, back_center)
        # y_back_pos = await _get_position(api, mount)
        y_back_pos, y_back_gauge = await _read_gauge(api, mount, "YB")
        test_data["YB Gauge"] = str(y_back_gauge)
        test_data["YB Position"] = y_back_pos
        print(f"Y-Back Gauge = {y_back_gauge} mm")
        print(f"Y-Back Position = {y_back_pos}\n")
        await api.move_to(mount, back_center)


async def _read_gauge(api: OT3API, mount: types.OT3Mount, axis: str) -> float:
    if "XL" in axis:
        await api.move_rel(mount, types.Point(x=-DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    elif "XR" in axis:
        await api.move_rel(mount, types.Point(x=DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    elif "YF" in axis:
        await api.move_rel(mount, types.Point(y=-DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    elif "YB" in axis:
        await api.move_rel(mount, types.Point(y=DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    position = await _get_position(api, mount)
    gauge = gauges[axis].read_stable(timeout=20)
    return position, gauge


def _get_attitude(api: OT3API) -> str:
    belt_attitude = api._robot_calibration.deck_calibration.belt_attitude
    attitude = str(belt_attitude).replace(", ",";")
    return attitude


async def _get_position(api: OT3API, mount: types.OT3Mount) -> str:
    current_position = await api.gantry_position(mount)
    trunc_position = _trunc_point(current_position)
    position = str(trunc_position).replace(", ",";")
    return position


def _trunc_point(p: types.Point) -> types.Point:

    def _trunc_float(f: float) -> float:
        return float(f'{f:.3f}')

    return types.Point(
        _trunc_float(p.x),
        _trunc_float(p.y),
        _trunc_float(p.z),
    )


async def _calibrate_belts(api: OT3API, mount: types.OT3Mount) -> None:
    ui.print_header("PROBE the DECK")
    await api.reset_instrument_offset(mount)
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip, "no pipette found"
    await api.home()
    # if not api.is_simulator:
    #     ui.get_user_ready("about to probe deck slots #3, #10, and #12")
    try:
        attitude = await calibrate_belts(api, mount, pip.pipette_id)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not api.is_simulator:
            raise e
        attitude = DEFAULT_MACHINE_TRANSFORM
    await api.home_z(mount)
    print("attitude:")
    print(attitude)


async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    ui.print_title("BELT CALIBRATION")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_single_v3.4",
    )
    print("homing...")
    await api.home()
    await api.cache_instruments()
    print("resetting instrument calibration...")
    await api.reset_instrument_offset(mount)
    print("resetting robot calibration...")
    api.reset_robot_calibration()

    if args.mode == "all":
        # SKIP calibrating the belts, then check accuracy
        await _calibrate_pipette(api, mount)
        await _check_belt_accuracy_probe(api, mount)
        # await _check_belt_accuracy_dial(api, mount)

        # DO calibrate the belts, then check accuracy
        await _calibrate_belts(api, mount)  # <-- !!!
        await _calibrate_pipette(api, mount)
        await _check_belt_accuracy_probe(api, mount)
        # await _check_belt_accuracy_dial(api, mount)
    elif args.mode == "belt":
        await _calibrate_belts(api, mount)
    elif args.mode == "probe":
        # SKIP calibrating the belts, then check accuracy
        await _calibrate_pipette(api, mount)
        await _check_belt_accuracy_probe(api, mount)

        # DO calibrate the belts, then check accuracy
        await _calibrate_belts(api, mount)  # <-- !!!
        await _calibrate_pipette(api, mount)
        await _check_belt_accuracy_probe(api, mount)
    elif args.mode == "dial":
        global start_time, test_data
        _test_setup(api, mount)
        _zero_gauges()
        start_time = time.time()
        for i in range(args.cycles):
            cycle = i + 1
            print(f"\n-> Starting Test Cycle {cycle}/{args.cycles}")
            if args.belt:
                test_data["Belt Status"] = "Calibrated"
                await _calibrate_belts(api, mount)
            else:
                test_data["Belt Status"] = "Uncalibrated"
            await _calibrate_pipette(api, mount)
            await _check_belt_accuracy_probe(api, mount)
            await _check_belt_accuracy_dial(api, mount)
            _record_data(api, cycle)

            print("resetting instrument calibration...")
            await api.reset_instrument_offset(mount)
            print("resetting robot calibration...")
            api.reset_robot_calibration()

    print("done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--simulate", action="store_true")
    parser.add_argument("-b", "--belt", action="store_true")
    parser.add_argument("-m", "--mount", type=str, choices=["left", "right"], required=True)
    parser.add_argument("-d", "--mode", type=str, choices=["belt", "probe", "dial", "all"], required=True, default="all")
    parser.add_argument("-c", "--cycles", type=int, required=False, help='Number of testing cycles', default=1)
    args = parser.parse_args()
    if args.mount == "left":
        mnt = types.OT3Mount.LEFT
    else:
        mnt = types.OT3Mount.RIGHT
    asyncio.run(_main(args.simulate, mnt))
