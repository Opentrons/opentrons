"""Gripper Lifetime Test."""
import asyncio
import argparse
import string
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Lifetime Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Lifetime_Test:
    def __init__(
        self, simulate: bool, cycles: int
    ) -> None:
        self.simulate = simulate
        self.cycles = cycles
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.GRIP_FORCE = 20 # N
        self.START_HEIGHT = 3 # mm
        self.axes = [OT3Axis.G, OT3Axis.Z_G]
        self.engage_position = Point(0, 0, -50)
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Gripper":"None",
            "Position":"None",
        }
        self.class_name = self.__class__.__name__
        print(self.class_name)

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.deck_definition = load("ot3_standard", version=3)
        print(f"\nStarting Gripper Lifetime Test!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"force_"
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

    def _encoder_tolist(self, encoder_position):
        encoders = []
        for key in encoder_position:
            encoders.append(round(encoder_position[key], 3))
        return encoders

    async def _get_encoder(self):
        encoder_position = await self.api.encoder_current_position(self.mount)
        return self._encoder_tolist(encoder_position)

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _engage_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.move_rel(mount, self.engage_position)

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home(self.axes)

    async def exit(self):
        print("Exiting...")
        if self.api and self.mount:
            await self._home_gripper(self.api, self.mount)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._home_gripper(self.api, self.mount)
                    await self._engage_gripper(self.api, self.mount)
                    print(f"\n-> Completed Test Cycle {cycle}/{self.cycles}")
        except Exception as e:
            await self.exit()
            raise e
        except KeyboardInterrupt:
            await self.exit()
            print("Test Cancelled!")
        finally:
            # await self.exit()
            print("Test Completed!")

if __name__ == '__main__':
    print("\nOT-3 Gripper Lifetime Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Lifetime_Test(args.simulate, args.cycles)
    asyncio.run(test.run())
