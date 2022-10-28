# Import Python modules
import os
import sys
import time
import asyncio
import argparse

# Import Opentrons api
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import ot3_calibration
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    jog_mount_ot3,
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

pass_settings_xy = CapacitivePassSettings(
    prep_distance_mm=5,
    max_overrun_distance_mm=5,
    speed_mm_per_s=1,
    sensor_threshold_pf=1.0
)

PROBE_LENGTH = 34.5
# center_pos = Point(x=225, y=150, z=100)
center_z = Point(x=239, y=162, z=1)
center_xy = Point(x=226.25, y=148, z=1)
list_axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 System Calibration Testing')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

async def run_test(api, mount):
    await api.add_tip(mount, PROBE_LENGTH)
    list_z = []
    cycle = 1
    square_width = 20
    probe_diameter = 4
    edge_dist_from_center = (square_width / 2) - (probe_diameter / 2)
    while True:
        await home_ot3(api, list_axes)

        # Move to our safe hovering point above the square
        home = await api.gantry_position(mount, refresh=True)
        above_point = center_z._replace(z=home.z)
        await api.move_to(mount, above_point)

        # Jog gantry to find target position
        # jog_position = await jog_mount_ot3(api, mount)
        # print(jog_position)

        # input("Ready for probing?")

        # Probe the Z plane
        deck_z = await api.capacitive_probe(
            mount,
            OT3Axis.by_mount(mount),
            center_z.z,
            pass_settings_z
        )
        deck_z = round(deck_z, 3)
        list_z.append(deck_z)
        print(f"Cycle {cycle}: Z = {deck_z}mm")
        print(f"Min Z = {min(list_z)}mm, Max Z = {max(list_z)}mm, Avg Z = {sum(list_z)/len(list_z)}mm")

        edge_z = deck_z - 1
        current_pos = await api.gantry_position(mount, refresh=True)
        await api.move_to(mount, center_xy._replace(z=current_pos.z), speed=20)
        await api.move_to(mount, center_xy._replace(z=edge_z), speed=20)

        # Probe the -X edge
        edge_x_minus = await api.capacitive_probe(
            mount,
            OT3Axis.X,
            center_xy.x - edge_dist_from_center,
            pass_settings_xy
        )
        edge_x_minus = round(edge_x_minus, 3)
        print(f"Cycle {cycle}: -X = {edge_x_minus}mm")

        await api.move_to(mount, center_xy._replace(z=edge_z), speed=20)

        # Probe the +X edge
        edge_x_plus = await api.capacitive_probe(
            mount,
            OT3Axis.X,
            center_xy.x + edge_dist_from_center,
            pass_settings_xy
        )
        edge_x_plus = round(edge_x_plus, 3)
        print(f"Cycle {cycle}: +X = {edge_x_plus}mm")

        await api.move_to(mount, center_xy._replace(z=edge_z), speed=20)

        # Probe the -Y edge
        edge_y_minus = await api.capacitive_probe(
            mount,
            OT3Axis.Y,
            center_xy.y - edge_dist_from_center,
            pass_settings_xy
        )
        edge_y_minus = round(edge_y_minus, 3)
        print(f"Cycle {cycle}: -Y = {edge_y_minus}mm")

        await api.move_to(mount, center_xy._replace(z=edge_z), speed=20)

        # Probe the +Y edge
        edge_y_plus = await api.capacitive_probe(
            mount,
            OT3Axis.Y,
            center_xy.y + edge_dist_from_center,
            pass_settings_xy
        )
        edge_y_plus = round(edge_y_plus, 3)
        print(f"Cycle {cycle}: +Y = {edge_y_plus}mm")

        print(f"Completed Cycle {cycle}!")

        current_pos = await api.gantry_position(mount, refresh=True)
        await api.move_to(mount, center_xy._replace(z=current_pos.z), speed=20)
        await api.move_to(mount, center_xy._replace(z=home.z))
        await api.move_to(mount, home)
        await api.move_to(mount, home + Point(x=-5, y=-5, z=-5))
        cycle += 1

async def exit_test(api, mount):
    await api.disengage_axes(list_axes)

async def main(is_simulating: bool) -> None:
    try:
        api = await build_async_ot3_hardware_api(is_simulating=is_simulating, use_defaults=True)
        mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        await run_test(api, mount)
    except Exception as e:
        await exit_test(api, mount)
        raise e
    except KeyboardInterrupt:
        await exit_test(api, mount)
        print("Test Cancelled!")
    finally:
        await exit_test(api, mount)
        print("Test Completed!")

if __name__ == '__main__':
    print("\nOpentrons OT-3 Probe Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    asyncio.run(main(args.simulate))
