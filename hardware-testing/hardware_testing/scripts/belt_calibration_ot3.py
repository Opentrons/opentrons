"""Belt Calibration OT3."""
import argparse
import asyncio

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
from hardware_testing.data import ui
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing.drivers import mitutoyo_digimatic_indicator

DIAL_HEIGHT = 10
DIAL_JOG_DISTANCE = 25
DIAL_JOG_SPEED = 10

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

def _gauge_setup():
    for key, value in gauge_ports.items():
        gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
        gauges[key].connect()


def _zero_gauges():
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
        print(f"{key} Gauge Zero = {zero}mm")
    input(f"\nRemove Gauge Block from Deck and Press ENTER\n")


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
    ui.print_header("CHECK BELT ACCURACY")
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
        print(f"Slot #{slot}: {slot_offset}")
        await api.home_z(mount)


async def _check_belt_accuracy_dial(api: OT3API, mount: types.OT3Mount) -> None:
    await api.home()
    await api.add_tip(mount, api.config.calibration.probe_length)
    distance_x = await _measure_axis(api, mount, "X")
    distance_y = await _measure_axis(api, mount, "Y")
    await api.home()
    await api.remove_tip(mount)


async def _measure_axis(api: OT3API, mount: types.OT3Mount, axis: str) -> None:
    await api.home_z(mount)
    current_position = await api.gantry_position(mount)
    if "X" in axis:
        left_center = types.Point(*get_calibration_square_position_in_slot(1))._replace(z=DIAL_HEIGHT)
        right_center = types.Point(*get_calibration_square_position_in_slot(3))._replace(z=DIAL_HEIGHT)
        above_left = left_center._replace(z=current_position.z)
        await api.move_to(mount, above_left)
        await api.move_to(mount, left_center)
        x_left = await _read_gauge(api, mount, "XL")
        print(f"X Left = {x_left}mm")
        await api.move_to(mount, right_center)
        x_right = await _read_gauge(api, mount, "XR")
        print(f"Y Right = {x_right}mm")
        await api.move_to(mount, right_center)
        distance = 0
    elif "Y" in axis:
        front_center = types.Point(*get_calibration_square_position_in_slot(1))._replace(z=DIAL_HEIGHT)
        back_center = types.Point(*get_calibration_square_position_in_slot(10))._replace(z=DIAL_HEIGHT)
        above_front = front_center._replace(z=current_position.z)
        await api.move_to(mount, above_front)
        await api.move_to(mount, front_center)
        y_front = await _read_gauge(api, mount, "YF")
        print(f"Y Front = {y_front}mm")
        await api.move_to(mount, back_center)
        y_back = await _read_gauge(api, mount, "YB")
        print(f"Y Back = {y_back}mm")
        await api.move_to(mount, back_center)
        distance = 0
    return distance


async def _read_gauge(api: OT3API, mount: types.OT3Mount, axis: str) -> None:
    if "XL" in axis:
        await api.move_rel(mount, types.Point(x=-DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    elif "XR" in axis:
        await api.move_rel(mount, types.Point(x=DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    elif "YF" in axis:
        await api.move_rel(mount, types.Point(y=-DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    elif "YB" in axis:
        await api.move_rel(mount, types.Point(y=DIAL_JOG_DISTANCE), DIAL_JOG_SPEED)
    gauge = gauges[axis].read_stable(timeout=20)
    return gauge


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
    # await api.reset_instrument_offset(mount)
    print("resetting robot calibration...")
    # api.reset_robot_calibration()

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
        _gauge_setup()
        _zero_gauges()
        for i in range(args.cycles):
            cycle = i + 1
            print(f"\n-> Starting Test Cycle {cycle}/{args.cycles}")
            # SKIP calibrating the belts, then check accuracy
            # await _calibrate_pipette(api, mount)
            # await _check_belt_accuracy_dial(api, mount)

            # DO calibrate the belts, then check accuracy
            # await _calibrate_belts(api, mount)  # <-- !!!
            # await _calibrate_pipette(api, mount)
            await _check_belt_accuracy_dial(api, mount)

    print("done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-s", "--simulate", action="store_true")
    parser.add_argument("-m", "--mount", type=str, choices=["left", "right"], required=True)
    parser.add_argument("-d", "--mode", type=str, choices=["belt", "probe", "dial", "all"], required=True, default="all")
    parser.add_argument("-c", "--cycles", type=int, required=False, help='Number of testing cycles', default=1)
    args = parser.parse_args()
    if args.mount == "left":
        mnt = types.OT3Mount.LEFT
    else:
        mnt = types.OT3Mount.RIGHT
    asyncio.run(_main(args.simulate, mnt))
