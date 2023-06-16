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
PROBE_DIAMETER = 4
CUTOUT_SIZE = 20

# the capacitive readings need to be stable <0.1
# before probing anything
STABLE_CAP_PF = 0.1

# ideally these values come from either:
# 1) the API config file
# 2) or, found through manually jogging
# The Z is different from the XY probing location
# because the pipette cannot reach the bottom of the
# cutout, so we cannot probe the Z inside the cutout
ASSUMED_Z_LOCATION = types.Point(x=300, y=300, z=150)  # keep is SAFE
ASSUMED_XY_LOCATION = types.Point(x=285, y=285, z=ASSUMED_Z_LOCATION.z)

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
    sensor_threshold_pf=STABLE_CAP_PF,
)
PROBE_SETTINGS_XY_AXIS = CapacitivePassSettings(
    prep_distance_mm=CUTOUT_SIZE / 2,
    max_overrun_distance_mm=3,
    speed_mm_per_s=1,
    sensor_threshold_pf=STABLE_CAP_PF,
)


async def _probe_sequence(
    api: OT3API, mount: types.OT3Mount, stable: bool
) -> types.Point:
    z_ax = types.Axis.by_mount(mount)

    print("Align the XY axes above Z probe location...")
    home_pos_z = helpers_ot3.get_endstop_position_ot3(api, mount)[z_ax]
    await api.move_to(mount, ASSUMED_Z_LOCATION._replace(z=home_pos_z))

    if stable:
        await helpers_ot3.wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf=STABLE_CAP_PF, duration=1.0
        )
    found_z = await api.capacitive_probe(
        mount, z_ax, ASSUMED_Z_LOCATION.z, PROBE_SETTINGS_Z_AXIS
    )
    print(f"Found deck Z location = {found_z} mm")

    # move to 1mm inside the cutout
    # we know for certain we will be 1mm inside, because we just probed the deck
    updated_assumed_xy = ASSUMED_XY_LOCATION._replace(z=found_z - 1)
    print("Moving to the center of the cutout...")
    await helpers_ot3.move_to_arched_ot3(
        api, mount, updated_assumed_xy, safe_height=found_z + 10
    )

    # probe each edge of the cutout
    half_cutout = CUTOUT_SIZE / 2
    if stable:
        await helpers_ot3.wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf=STABLE_CAP_PF, duration=1.0
        )
    found_x_left = await api.capacitive_probe(
        mount,
        types.Axis.X,
        ASSUMED_XY_LOCATION.x - half_cutout,
        PROBE_SETTINGS_XY_AXIS,
    )
    if stable:
        await helpers_ot3.wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf=STABLE_CAP_PF, duration=1.0
        )
    found_x_right = await api.capacitive_probe(
        mount,
        types.Axis.X,
        ASSUMED_XY_LOCATION.x + half_cutout,
        PROBE_SETTINGS_XY_AXIS,
    )
    print(f"Found X axis cutout edges: left={found_x_left}, right={found_x_right}")
    if stable:
        await helpers_ot3.wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf=STABLE_CAP_PF, duration=1.0
        )
    found_y_front = await api.capacitive_probe(
        mount,
        types.Axis.Y,
        ASSUMED_XY_LOCATION.y - half_cutout,
        PROBE_SETTINGS_XY_AXIS,
    )
    if stable:
        await helpers_ot3.wait_for_stable_capacitance_ot3(
            api, mount, threshold_pf=STABLE_CAP_PF, duration=1.0
        )
    found_y_back = await api.capacitive_probe(
        mount,
        types.Axis.Y,
        ASSUMED_XY_LOCATION.y + half_cutout,
        PROBE_SETTINGS_XY_AXIS,
    )
    print(f"Found Y axis cutout edges: front={found_y_front}, back={found_y_back}")

    # calculate the center XYZ position of the cutout
    center_x = (found_x_right + found_x_left) / 2
    center_y = (found_y_back + found_y_front) / 2
    cutout_center = types.Point(x=center_x, y=center_y, z=found_z)
    print(f"Found cutout center = {cutout_center}")
    return cutout_center


async def _main(is_simulating: bool, cycles: int, stable: bool) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, pipette_left="p1000_single_v3.3"
    )
    mount = types.OT3Mount.LEFT
    if not api.hardware_pipettes[mount.to_mount()]:
        raise RuntimeError("No pipette attached")

    # add length to the pipette, to account for the attached probe
    await api.add_tip(mount, PROBE_LENGTH)

    await helpers_ot3.home_ot3(api)
    for c in range(cycles):
        print(f"Cycle {c + 1}/{cycles}")
        await _probe_sequence(api, mount, stable)

    # move up, "remove" the probe, then disengage the XY motors when done
    z_ax = types.Axis.by_mount(mount)
    top_z = helpers_ot3.get_endstop_position_ot3(api, mount)[z_ax]
    await api.move_to(mount, ASSUMED_XY_LOCATION._replace(z=top_z))
    await api.remove_tip(mount)
    await api.disengage_axes([types.Axis.X, types.Axis.Y])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=1)
    parser.add_argument("--stable", type=bool, default=True)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.cycles, args.stable))
