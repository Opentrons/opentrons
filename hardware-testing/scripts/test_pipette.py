"""Test OT3 Pipette."""
import argparse
import asyncio

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis
from hardware_testing.opentrons_api.helpers_ot3 import (
    ThreadManagedHardwareAPI,
    build_ot3_hardware_api,
    GantryLoadSettings,
    home_ot3,
    set_gantry_load_per_axis_settings_ot3
)

MOUNT = OT3Mount.LEFT
if MOUNT == OT3Mount.LEFT:
    Z_AXIS = OT3Axis.Z_L
    PLUNGER_AXIS = OT3Axis.P_L
else:
    Z_AXIS = OT3Axis.Z_R
    PLUNGER_AXIS = OT3Axis.P_R
LOAD = GantryLoad.LOW_THROUGHPUT
MAX_SPEED_XY = 5000
MAX_SPEED_Z = 200
MAX_SPEED_PIP = 20

SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=MAX_SPEED_XY,
        acceleration=2000,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=MAX_SPEED_XY,
        acceleration=2000,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=MAX_SPEED_Z,
        acceleration=1500,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=MAX_SPEED_Z,
        acceleration=1500,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.P_L: GantryLoadSettings(
        max_speed=MAX_SPEED_PIP,
        acceleration=40,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.P_R: GantryLoadSettings(
        max_speed=MAX_SPEED_PIP,
        acceleration=40,
        max_start_stop_speed=0,
        max_change_dir_speed=0,
        hold_current=0.1,
        run_current=1.4,
    ),
}


async def _main(api: ThreadManagedHardwareAPI) -> None:
    await api.set_gantry_load(gantry_load=LOAD)
    set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)

    attached_pips = api.get_attached_pipettes()
    assert attached_pips[MOUNT.to_mount()]

    await home_ot3(api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    await api.home_plunger(mount=MOUNT)

    input("Press ENTER to move the plunger:")
    await api.add_tip(mount=MOUNT, tip_length=0.1)
    await api.prepare_for_aspirate(mount=MOUNT)
    for vol in [50, 25, 1]:
        print(vol)
        await api.aspirate(mount=MOUNT, volume=vol)
        await api.dispense(mount=MOUNT, volume=vol)
    # TODO:
    #       ** 1) move plunger
    #       ** 2) enable/disable plunger
    #       ** 3) set plunger acceleration
    #       4) set plunger current
    #       5) read limit switch
    #       6) read encoder
    #       7) read capacitive sensor
    #       8) read air-pressure sensor
    #       9) read temp/humidity sensor
    await api.disengage_axes([OT3Axis.X, OT3Axis.Y,
                              OT3Axis.Z_L, OT3Axis.Z_R,
                              PLUNGER_AXIS])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    hw_api = build_ot3_hardware_api(is_simulating=args.simulate)
    asyncio.run(_main(hw_api))
    hw_api.clean_up()
    input('Done. Press ENTER to exit:')
    print("###########################################")
    print("###########################################")
    print("###########################################")

