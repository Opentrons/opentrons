"""Belt Calibration OT3."""
import argparse
import asyncio

from opentrons.hardware_control.ot3api import OT3API

from opentrons.config.defaults_ot3 import DEFAULT_DECK_TRANSFORM
from opentrons.hardware_control.robot_calibration import build_temporary_identity_calibration
from opentrons.hardware_control.ot3_calibration import calibrate_belts, calibrate_pipette, _calibrate_mount

from hardware_testing.data import ui
from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3


async def _calibrate_pipette(api: OT3API, mount: types.OT3Mount) -> None:
    ui.print_header("CALIBRATE PIPETTE")
    if not api.is_simulator:
        ui.get_user_ready("calibrating pipette to slot #5")
    await calibrate_pipette(api, mount, slot=5)
    await api.move_rel(mount, types.Point(z=100))


async def _check_belt_accuracy(api: OT3API, mount: types.OT3Mount) -> None:
    ui.print_header("CHECK BELT ACCURACY")
    for slot in [1, 3, 10, 12]:
        if not api.is_simulator:
            ui.get_user_ready(f"about to find offset of slot #{slot}")
        await api.add_tip(mount, api.config.calibration.probe_length)
        slot_offset = await _calibrate_mount(api, mount, slot=slot)
        await api.remove_tip(mount)
        print(f"Slot #{slot}: {slot_offset}")
        await api.move_rel(mount, types.Point(z=100))


async def _calibrate_belts(api: OT3API, mount: types.OT3Mount) -> None:
    ui.print_header("PROBE the DECK")
    if not api.is_simulator:
        ui.get_user_ready("about to probe deck slots #3, #10, and #12")
    # NOTE: looking at "calibrate_belts()" it looks like the attitude matrix is not
    #       saved, but only returned
    await api.reset_instrument_offset(mount)
    attitude = await calibrate_belts(api, mount)
    await api.move_rel(mount, types.Point(z=100))
    if api.is_simulator:
        attitude = DEFAULT_DECK_TRANSFORM
    print("attitude:")
    print(attitude)
    new_calibration = build_temporary_identity_calibration()
    new_calibration.deck_calibration.attitude = attitude
    api.set_robot_calibration(new_calibration)


async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    ui.print_title("BELT CALIBRATION")
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating,
        pipette_left="p1000_single_v3.4",
        pipette_right="p1000_single_v3.4"
    )
    print("homing")
    await api.home()
    print("resetting robot calibration")
    await api.reset_instrument_offset(mount)
    api.reset_robot_calibration()

    await _calibrate_pipette(api, mount)
    await _check_belt_accuracy(api, mount)

    await _calibrate_belts(api, mount)

    await _calibrate_pipette(api, mount)
    await _check_belt_accuracy(api, mount)

    print("done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], required=True)
    args = parser.parse_args()
    if args.mount == "left":
        mnt = types.OT3Mount.LEFT
    else:
        mnt = types.OT3Mount.RIGHT
    asyncio.run(_main(args.simulate, mnt))
