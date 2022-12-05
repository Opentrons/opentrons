"""Gripper Force Test."""
import asyncio
import argparse
import time

from opentrons.hardware_control.ot3api import OT3API
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Gripper Force Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-t', '--trials', type=int, required=False, help='Number of trials', default=5)
    arg_parser.add_argument('-f', '--force', type=float, required=False, help='Grip force in Newtons', default=20)
    arg_parser.add_argument('-i', '--interval', type=float, required=False, help='Interval between grip trials in seconds', default=2)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Force_Test:
    def __init__(
        self, simulate: bool, cycles: int, trials: int, force: float, interval: float
    ) -> None:
        self.api = None
        self.mount = None
        self.gripper_id = None
        self.simulate = simulate
        self.cycles = cycles
        self.trials = trials
        self.force = force
        self.interval = interval
        self.engage_position = Point(0, 0, -80)
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Trial":"None",
            "Gripper":"None",
            "Force":"None",
            "Current":"None",
        }

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        self.start_time = time.time()
        print(f"\nStarting Gripper Force Test:\n")

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        # self.test_tag = f"slot{self.slot}"
        self.test_tag = "vref"
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

    async def _measure_force(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.grip(self.force)
        time.sleep(self.interval)
        await api.ungrip()
        time.sleep(self.interval)

    async def _engage_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.move_rel(mount, self.engage_position)

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home_gripper_jaw()
        await api.home_z(mount)
        self.home = await api.gantry_position(mount)

    async def exit(self):
        if self.api and self.mount:
            await self._home_gripper(self.api, self.mount)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Cycle {cycle}/{self.cycles}")
                    await self._home_gripper(self.api, self.mount)
                    await self._engage_gripper(self.api, self.mount)
                    for j in range(self.trials):
                        trial = j + 1
                        print(f"\n-->> Measuring Trial {trial}/{self.trials}")
                        await self._measure_force(self.api, self.mount)
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
    print("\nOT-3 Gripper Force Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Force_Test(args.simulate, args.cycles, args.trials, args.force, args.interval)
    asyncio.run(test.run())
