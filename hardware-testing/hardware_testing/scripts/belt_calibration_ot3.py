"""Belt Calibration OT3."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API

from opentrons.config.defaults_ot3 import DEFAULT_MACHINE_TRANSFORM
from opentrons_shared_data.deck import get_calibration_square_position_in_slot
from opentrons.hardware_control.ot3_calibration import (
    CalibrationStructureNotFoundError,
    calibrate_belts,
    calibrate_pipette,
    find_calibration_structure_position,
)

from hardware_testing.data import ui
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


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


async def _check_belt_accuracy(api: OT3API, mount: types.OT3Mount) -> None:
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


async def _main(is_simulating: bool, mount: types.OT3Mount, test: bool) -> None:
    ui.print_title("BELT CALIBRATION")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_single_v3.4",
    )
    try:
        print("homing")
        await api.home()
        attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(2)
        current_pos = await api.gantry_position(mount)
        await api.move_to(mount, attach_pos._replace(z=current_pos.z))
        if not api.is_simulator:
            ui.get_user_ready("ATTACH a probe")
        print("resetting robot calibration")
        await api.reset_instrument_offset(mount)
        api.reset_robot_calibration()
        if test:
            # check accuracy of gantry-to-deck
            await _calibrate_pipette(api, mount)
            await _check_belt_accuracy(api, mount)
        # calibrate the belts
        await _calibrate_belts(api, mount)  # <-- !!!
        if test:
            # check accuracy of gantry-to-deck
            await _calibrate_pipette(api, mount)
            await _check_belt_accuracy(api, mount)
        print("done")
    finally:
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
