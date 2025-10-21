"""Capacitive probe OT3."""
import argparse
import asyncio

from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

# distance added to the pipette shaft
# when the calibration probe is attached
PROBE_LENGTH = 34.5

# the capacitive readings need to be stable <0.1
# before probing anything
STABLE_CAP_PF = 0.1

# capacitance relative threshold in picofarads
CAP_REL_THRESHOLD_PF = 10.0

# ideally these values come from either:
# 1) the API config file
# 2) or, found through manually jogging
# The Z is different from the XY probing location
# because the pipette cannot reach the bottom of the
# cutout, so we cannot probe the Z inside the cutout
ASSUMED_Z_LOCATION = types.Point(x=228, y=150, z=80)  # C2 slot center
ASSUMED_XY_LOCATION = types.Point(x=228, y=150, z=ASSUMED_Z_LOCATION.z)

# configure how the probing motion behaves
# capacitive_probe will always automatically do the following:
# 1) move to the "prep" distance away from the assumed location
# 2) set the capacitive threshold
#   a) the value is sent over CAN to the pipette's MCU
#   b) the pipette will trigger the SYNC line when the threshold is reached
# 3) move along the specified axis, at the specified speed
#   a) the max distance probed = prep + max_overrun
# 4) movement will stop when (either/or):
#   a) the sensor is triggered
#   b) or, the max distance is reached
# 5) move to the "prep" distance away from the assumed location
PROBE_SETTINGS_Z_AXIS = CapacitivePassSettings(
    prep_distance_mm=10,
    max_overrun_distance_mm=3,
    speed_mm_per_s=1,
    sensor_threshold_pf=CAP_REL_THRESHOLD_PF,
)
PROBE_SETTINGS_Z_AXIS_OUTPUT = CapacitivePassSettings(
    prep_distance_mm=10,
    max_overrun_distance_mm=3,
    speed_mm_per_s=1,
    sensor_threshold_pf=CAP_REL_THRESHOLD_PF,
)


async def _probe_sequence(api: OT3API, mount: types.OT3Mount, stable: bool) -> float:
    z_ax = types.Axis.by_mount(mount)

    print("Align the XY axes above Z probe location...")
    home_pos_z = helpers_ot3.get_endstop_position_ot3(api, mount)[z_ax]
    await api.move_to(mount, ASSUMED_Z_LOCATION._replace(z=home_pos_z))

    if stable:
        await helpers_ot3.wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf=STABLE_CAP_PF, duration=1.0
        )
    found_z, _ = await api.capacitive_probe(
        mount, z_ax, ASSUMED_Z_LOCATION.z, PROBE_SETTINGS_Z_AXIS
    )
    print(f"Found deck Z location = {found_z} mm")
    return found_z


async def _main(is_simulating: bool, cycles: int, stable: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, pipette_left="p1000_single_v3.3"
    )
    mount = types.OT3Mount.LEFT
    if not api.hardware_pipettes[mount.to_mount()]:
        raise RuntimeError("No pipette attached")

    # add length to the pipette, to account for the attached probe
    api.add_tip(mount, PROBE_LENGTH)

    await helpers_ot3.home_ot3(api)
    for c in range(cycles):
        print(f"Cycle {c + 1}/{cycles}")
        await _probe_sequence(api, mount, stable)

    # move up, "remove" the probe, then disengage the XY motors when done
    z_ax = types.Axis.by_mount(mount)
    top_z = helpers_ot3.get_endstop_position_ot3(api, mount)[z_ax]
    await api.move_to(mount, ASSUMED_XY_LOCATION._replace(z=top_z))
    api.remove_tip(mount)
    await api.disengage_axes([types.Axis.X, types.Axis.Y])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--stable", type=bool, default=True)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.cycles, args.stable))
