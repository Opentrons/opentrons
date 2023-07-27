"""Latency."""
import argparse
import asyncio
from statistics import mean, median, mode
from time import perf_counter

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3

SPEED = 10  # mm/sec


async def _main(is_simulating: bool, trials: int) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    print("homing")
    await api.home()
    print(f"setting discontinuity to be same as speed ({SPEED}mm/sec)")
    for axis in [types.Axis.X, types.Axis.Y, types.Axis.Z_L, types.Axis.Z_R]:
        await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
            api,
            axis,
            default_max_speed=SPEED,
            max_speed_discontinuity=SPEED,
        )
    # move for exactly 1 second (10mm @ 10mm/sec)
    vector = types.Point(x=SPEED, y=SPEED, z=SPEED)
    # start moving away from home position
    direction = -1.0
    # record time before each movement starts
    timestamps = []
    print(f"starting test (duration = {trials} seconds)")
    for trial in range(trials):
        timestamps.append(perf_counter())
        await api.move_rel(types.OT3Mount.LEFT, vector * direction)
        direction *= -1.0  # change direction
    expected_ms = 0 if api.is_simulator else 1000
    processing_millis = [
        int((future - past) * 1000.0) - expected_ms
        for past, future in zip(timestamps[:-1], timestamps[1:])
    ]
    print(f"min: {min(processing_millis)}")
    print(f"max: {max(processing_millis)}")
    print(f"mean: {round(mean(processing_millis))}")
    print(f"median: {median(processing_millis)}")
    print(f"mode: {mode(processing_millis)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trials", type=int, default=10)
    args = parser.parse_args()
    asyncio.run(_main(args.simulate, args.trials))
