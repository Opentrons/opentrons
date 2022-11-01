import asyncio
import argparse

from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from opentrons.config.types import (
    CapacitivePassSettings,
)

pass_settings_z = CapacitivePassSettings(
    prep_distance_mm=5,
    max_overrun_distance_mm=5,
    speed_mm_per_s=1,
    sensor_threshold_pf=1.0
)

all_axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
center_z = Point(x=239, y=162, z=0)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Test Simulation')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

async def run(api, mount):
    await home_ot3(api, all_axes)

    home_position = await api.gantry_position(mount)
    print("HOME POSITION = ", home_position)
    above_point = center_z._replace(z=home_position.z)
    print("ABOVE POINT = ", above_point)
    await api.move_to(mount, above_point)

    deck_z = await api.capacitive_probe(
        mount,
        OT3Axis.by_mount(mount),
        center_z.z,
        pass_settings_z
    )
    deck_z = round(deck_z, 3)
    print("DECK Z-AXIS = ", deck_z)

async def main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating, use_defaults=True)
    mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
    await run(api, mount)

### python -m pipenv run python -m hardware_testing.scripts.test_simulation -s
if __name__ == '__main__':
    print("\nTest Simulation\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    asyncio.run(main(args.simulate))
