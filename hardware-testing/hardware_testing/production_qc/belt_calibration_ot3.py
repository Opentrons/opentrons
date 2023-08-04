"""Belt Calibration OT3."""
import argparse
import asyncio
from dataclasses import dataclass
from typing import Optional, Dict, Tuple, Any
from pprint import pprint

from opentrons.hardware_control.ot3api import OT3API

from opentrons.config.defaults_ot3 import DEFAULT_MACHINE_TRANSFORM
from opentrons.calibration_storage.types import AttitudeMatrix
from opentrons.hardware_control.ot3_calibration import (
    CalibrationStructureNotFoundError,
    calibrate_belts,
    calibrate_pipette,
    find_pipette_offset,
)

from hardware_testing.data import ui
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


TEST_SLOTS = [1, 3, 9, 10]


@dataclass
class TestBeltCalibrationData:
    pipette_offset: types.Point
    deck_offsets: Dict[int, types.Point]


async def _calibrate_pipette(
    api: OT3API, mount: types.OT3Mount
) -> Optional[types.Point]:
    ui.print_header("CALIBRATE PIPETTE")
    await api.home()
    try:
        offset = await calibrate_pipette(api, mount)  # type: ignore[arg-type]
    except CalibrationStructureNotFoundError as e:
        if not api.is_simulator:
            raise e
        offset = types.Point(x=0, y=0, z=0)
    finally:
        await api.retract(mount)
    print(f"pipette offset: {offset}")
    return offset


async def _check_belt_accuracy(
    api: OT3API, mount: types.OT3Mount
) -> Dict[int, Optional[types.Point]]:
    ui.print_header("CHECK BELT ACCURACY")
    ret = {}
    for slot in TEST_SLOTS:
        await api.home()
        try:
            slot_offset = await find_pipette_offset(api, mount, slot=slot)
            ret[slot] = slot_offset
            print(f"Slot #{slot}: {slot_offset}")
        except CalibrationStructureNotFoundError as e:
            if api.is_simulator:
                ret[slot] = types.Point(x=0, y=0, z=0)
            else:
                raise e
        await api.home_z(mount)

    def _short(num: float, decimals: int = 2) -> str:
        _short_num = str(round(num, decimals))
        _append = {1: ".00", 2: "00", 3: "0"}.get(len(_short_num), "")
        return _short_num + _append

    def _p_str(_s: int) -> str:
        _p = ret.get(_s)
        if not _p:
            return "(                )"
        return f"({_short(_p.x)}, {_short(_p.y)}, {_short(_p.z)})"

    print(f"Deck Row A: {_p_str(10)} | {_p_str(11)} | trash")
    print(f"Deck Row B: {_p_str(7)} | {_p_str(8)} | {_p_str(9)}")
    print(f"Deck Row C: {_p_str(4)} | {_p_str(5)} | {_p_str(6)}")
    print(f"Deck Row D: {_p_str(1)} | {_p_str(2)} | {_p_str(3)}")
    return ret


async def _calibrate_belts(api: OT3API, mount: types.OT3Mount) -> Tuple[AttitudeMatrix, Dict[str, Any]]:
    ui.print_header("PROBE the DECK")
    await api.reset_instrument_offset(mount)
    pip = api.hardware_pipettes[mount.to_mount()]
    assert pip, "no pipette found"
    await api.home()
    try:
        pip_id = pip.pipette_id if pip and pip.pipette_id else "unknown"
        attitude, details = await calibrate_belts(api, mount, pip_id)
    except CalibrationStructureNotFoundError as e:
        if not api.is_simulator:
            raise e
        attitude = DEFAULT_MACHINE_TRANSFORM
        details = {}
    print("new attitude:")
    pprint(attitude)
    print("details")
    pprint(details)
    return attitude, details


async def run_belt_calibration(
    api: OT3API, mount: types.OT3Mount, test: bool
) -> Tuple[
    Optional[TestBeltCalibrationData], AttitudeMatrix, Dict[str, Any], Optional[TestBeltCalibrationData]
]:
    """Run belt calibration."""
    # setup
    print("homing")
    await api.home()
    ui.print_header("ATTACH PROBE")
    attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(2)
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, attach_pos._replace(z=current_pos.z))
    if not api.is_simulator:
        ui.get_user_ready("ATTACH a probe to pipette")

    without_data = None
    with_data = None

    # calibrate belts
    ui.print_header("CALIBRATE BELTS")
    attitude, details = await _calibrate_belts(api, mount)

    # test after
    if test:
        ui.print_header("TEST WITH CALIBRATION")
        with_data = TestBeltCalibrationData(
            pipette_offset=await _calibrate_pipette(api, mount),
            deck_offsets=await _check_belt_accuracy(api, mount),
        )
        ui.print_header("TEST WITHOUT CALIBRATION")
        print("resetting robot calibration")
        await api.reset_instrument_offset(mount)
        api.reset_robot_calibration()
        without_data = TestBeltCalibrationData(
            pipette_offset=await _calibrate_pipette(api, mount),
            deck_offsets=await _check_belt_accuracy(api, mount),
        )

    # remove probe
    await api.retract(mount)
    current_pos = await api.gantry_position(mount)
    await api.move_to(mount, attach_pos._replace(z=current_pos.z))
    if not api.is_simulator:
        ui.get_user_ready("REMOVE probe from pipette")
    return without_data, attitude, details, with_data


async def _main(is_simulating: bool, mount: types.OT3Mount, test: bool) -> None:
    ui.print_title("BELT CALIBRATION")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_single_v3.4",
    )
    try:
        await run_belt_calibration(api, mount, test)
    finally:
        print("done")
        await api.retract(mount)
        if not api.is_simulator:
            print("restarting opentrons-robot-server")
            helpers_ot3.start_server_ot3()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--test", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    args = parser.parse_args()
    if args.mount == "left":
        mnt = types.OT3Mount.LEFT
    else:
        mnt = types.OT3Mount.RIGHT
    asyncio.run(_main(args.simulate, mnt, args.test))
