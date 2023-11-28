"""Gripper Tip Rack Lid Test."""
import asyncio
import argparse
import string
import time

from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Tip Rack Lid Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=10)
    arg_parser.add_argument('-f', '--force', type=int, required=False, help='Sets the gripper force in Newtons', default=10)
    arg_parser.add_argument('-g', '--height', type=float, required=False, help='Sets the gripper height in mm', default=100)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Sets the tiprack slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_TipRack_Lid_Test:
    def __init__(
        self, simulate: bool, cycles: int, force: int, height: float, slot: int
    ) -> None:
        self.simulate = simulate
        self.cycles = cycles
        self.grip_forces = [5, 10, 15]
        self.grip_heights = [98, 88]
        self.slots = [4, 5, 6]
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.current_state = None
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
        self.gripper_axes = [Axis.G, Axis.Z_G]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "Grip Force":"None",
            "Grip Height":"None",
            "State":"None",
            "Jaw State":"None",
            "Jaw Displacement":"None",
        }
        self.states = {
            "HOLD":"Holding",
            "PICK":"Picking",
            "DROP":"Dropping",
        }

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        await self.gripper_setup()
        print(f"\nStarting Gripper Center Test!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"{self.cycles}cycles"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, run_id=self.test_id, file_name=self.test_file, data=self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    async def gripper_setup(self):
        await self.api.cache_instruments()
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _get_jaw_state(self):
        jaw_state = self.api._gripper_handler.gripper.state
        return jaw_state

    def _get_jaw_displacement(self):
        jaw_displacement = self.api._gripper_handler.gripper.current_jaw_displacement
        return jaw_displacement

    async def _record_data(self):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(self.cycle)
        self.test_data["State"] = str(self.current_state)
        self.test_data["Jaw State"] = str(self._get_jaw_state()).split('.')[1]
        self.test_data["Jaw Displacement"] = str(self._get_jaw_displacement())
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, run_id=self.test_id, file_name=self.test_file, data=test_data)

    async def _move_gripper(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        self.nominal_center = Point(*get_calibration_square_position_in_slot(slot))
        self.test_data["Slot"] = str(slot)
        # Home gripper
        await api.home_z()
        await api.home_gripper_jaw()
        # Move above slot center
        current_position = await api.gantry_position(mount)
        above_slot_center = self.nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_slot_center)
        time.sleep(1.0)

    async def _grip(
        self, api: OT3API, mount: OT3Mount, force: int, height: float
    ) -> None:
        self.test_data["Grip Force"] = str(force)
        self.test_data["Grip Height"] = str(height)
        await self._pick(api, mount, force, height)
        await self._hold(api, mount)
        await self._drop(api, mount, height)

    async def _pick(
        self, api: OT3API, mount: OT3Mount, force: int, height: float
    ) -> None:
        self.current_state = self.states["PICK"]
        grip_height = self.nominal_center._replace(z=height)
        await api.move_to(mount, grip_height)
        await api.grip(force)
        await self._record_data()

    async def _hold(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        self.current_state = self.states["HOLD"]
        await api.home_z(mount)
        time.sleep(1.0)
        await self._record_data()

    async def _drop(
        self, api: OT3API, mount: OT3Mount, height: float
    ) -> None:
        self.current_state = self.states["DROP"]
        grip_height = self.nominal_center._replace(z=height)
        await api.move_to(mount, grip_height)
        await api.ungrip()
        await self._record_data()

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
        await api.home()
        self.home = await api.gantry_position(mount)

    async def _reset(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home gripper
        await api.home_z()
        await api.home_gripper_jaw()
        # Move next to XY home
        await api.move_to(mount, self.home + Point(x=-5, y=-5, z=0))

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                for i in range(self.cycles):
                    await self._home(self.api, self.mount)
                    for force in self.grip_forces:
                        for slot in self.slots:
                            for height in self.grip_heights:
                                self.cycle = i + 1
                                print(f"\n-> Starting Test Cycle {self.cycle}/{self.cycles} (Slot #{slot} | {force}N | {height}mm)")
                                await self._move_gripper(self.api, self.mount, slot)
                                await self._grip(self.api, self.mount, force, height)
                        await self._reset(self.api, self.mount)
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
    print("\nOT-3 Gripper Tip Rack Lid Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_TipRack_Lid_Test(args.simulate, args.cycles, args.force, args.height, args.slot)
    asyncio.run(test.run())
