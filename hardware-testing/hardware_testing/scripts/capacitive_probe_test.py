"""Capacitive Probe Test."""
import asyncio
import argparse
import time

from opentrons.hardware_control.ot3api import OT3API
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    wait_for_stable_capacitance_ot3,
)
from opentrons.config.types import (
    CapacitivePassSettings,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Capacitive Probe Testing')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Capacitive_Probe_Test:
    def __init__(self, simulate: bool, cycles: int) -> None:
        self.api = None
        self.mount = None
        self.simulate = simulate
        self.cycles = cycles
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.PROBE_LENGTH = 34.5
        self.CUTOUT_SIZE = 20
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.CENTER_Z = Point(x=239, y=162, z=1)
        self.CENTER_XY = Point(x=226.25, y=148, z=self.CENTER_Z.z)
        self.PROBE_SETTINGS_Z_AXIS = CapacitivePassSettings(
            prep_distance_mm=5,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        )
        self.PROBE_SETTINGS_XY_AXIS = CapacitivePassSettings(
            prep_distance_mm=self.CUTOUT_SIZE / 2,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        )
        self.test_data ={
            "Time":None,
            "Z Height":None,
            "X Right":None,
            "X Left":None,
            "Y Back":None,
            "Y Front":None,
        }

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        await self.api.add_tip(self.mount, self.PROBE_LENGTH)
        self.start_time = time.time()

    def file_setup(self):
        self.test_name = "capacitive_probe_test"
        self.test_tag = "slot5"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    async def _probe_axis(
        self, axis: OT3Axis, target: float
    ) -> float:
        if axis == OT3Axis.by_mount(self.mount):
            settings = self.PROBE_SETTINGS_Z_AXIS
        else:
            settings = self.PROBE_SETTINGS_XY_AXIS
        await wait_for_stable_capacitance_ot3(
            self.api, self.mount, threshold_pf=0.1, duration=1.0
        )
        point = await self.api.capacitive_probe(
            self.mount, axis, target, settings
        )
        return point

    async def _probe_sequence(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
        await home_ot3(api, self.axes)

        # Move above deck Z-Axis point
        home_position = await api.gantry_position(mount)
        above_point = self.CENTER_Z._replace(z=home_position.z)
        await api.move_to(mount, above_point)

        # Probe deck Z-Axis height
        # deck_z = 0.25
        deck_z = await self._probe_axis(OT3Axis.by_mount(mount), self.CENTER_Z.z)
        print(f"Deck Z-Axis height = {deck_z} mm")
        self.test_data["Z Height"] = str(round(deck_z, 3))

        # Move inside the cutout
        below_z = deck_z - 1
        current_position = await api.gantry_position(mount)
        center_xy_above = self.CENTER_XY._replace(z=current_position.z)
        center_xy_below = self.CENTER_XY._replace(z=below_z)
        await api.move_to(mount, center_xy_above, speed=20)
        await api.move_to(mount, center_xy_below, speed=20)

        # Probe slot X-Axis right edge
        x_right = await self._probe_axis(OT3Axis.X, self.CENTER_XY.x + self.CUTOUT_HALF)
        print(f"X-Axis right edge = {x_right} mm")
        self.test_data["X Right"] = str(round(x_right, 3))

        # Probe slot X-Axis left edge
        x_left = await self._probe_axis(OT3Axis.X, self.CENTER_XY.x - self.CUTOUT_HALF)
        print(f"X-Axis left edge = {x_left} mm")
        self.test_data["X Left"] = str(round(x_left, 3))

        # Probe slot Y-Axis back edge
        y_back = await self._probe_axis(OT3Axis.Y, self.CENTER_XY.y + self.CUTOUT_HALF)
        print(f"Y-Axis back edge = {y_back} mm")
        self.test_data["Y Back"] = str(round(y_back, 3))

        # Probe slot Y-Axis front edge
        y_front = await self._probe_axis(OT3Axis.Y, self.CENTER_XY.y - self.CUTOUT_HALF)
        print(f"Y-Axis front edge = {y_front} mm")
        self.test_data["Y Front"] = str(round(y_front, 3))

        # Save data to file
        elapsed_time = time.time() - self.start_time
        self.test_data["Time"] = str(round(elapsed_time, 3))
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

        # Home Z-Axis
        current_position = await api.gantry_position(mount)
        safe_z = current_position._replace(z=deck_z + 10)
        home_z = current_position._replace(z=home_position.z)
        await api.move_to(mount, safe_z, speed=20)
        await api.move_to(mount, home_z)

        # Move next to home
        await api.move_to(mount, home_position + Point(x=-5, y=-5, z=0))

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            for c in range(self.cycles):
                print(f"\n--> Starting Cycle {c + 1}/{self.cycles}")
                await self._probe_sequence(self.api, self.mount)
        except Exception as e:
            await self.exit()
            raise e
        except KeyboardInterrupt:
            await self.exit()
            print("Test Cancelled!")
        finally:
            await self.exit()
            print("Test Completed!")

if __name__ == '__main__':
    print("\nOT-3 Capacitive Probe Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Capacitive_Probe_Test(args.simulate, args.cycles)
    asyncio.run(test.run())
