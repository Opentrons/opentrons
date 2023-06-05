"""Gripper Width Test."""
import asyncio
import argparse
import string
import time

import logging
from logging.config import dictConfig

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper_jaw,
    calibrate_gripper,
    find_calibration_structure_height,
    _probe_deck_at,
)
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)
from opentrons_hardware.hardware_control.gripper_settings import (
    set_error_tolerance,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Width Test')
    arg_parser.add_argument('-a', '--calibrate', action="store_true", required=False, help='Calibrates gripper')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Sets the number of testing cycles', default=10)
    arg_parser.add_argument('-f', '--force', type=int, required=False, help='Sets the gripper force in Newtons', default=10)
    arg_parser.add_argument('-t', '--time', type=int, required=False, help='Sets the gripper hold time in seconds', default=10)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Sets the staircase slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Width_Test:
    def __init__(
        self, simulate: bool, calibrate: bool, cycles: int, force: int, time: float, slot: int
    ) -> None:
        self.simulate = simulate
        self.calibrate = calibrate
        self.cycles = cycles
        self.grip_force = force
        self.hold_time = time
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.cycle = None
        self.nominal_center = None
        self.jaw_length = 94.55 # mm
        self.step_error = 0.5 # mm
        self.step_height = 10 # mm
        self.steps = [88, 80, 72, 64]
        self.axes = self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.test_data = {
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "Input Force":"None",
            "Step":"None",
            "Step Width":"None",
            "Gripper Width":"None",
            "Absolute Error":"None",
        }
        self.class_name = self.__class__.__name__

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        await self.deck_setup()
        await self.instrument_setup()
        print(f"\nStarting Gripper Width Test!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"force_{self.grip_force}"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    async def deck_setup(self):
        self.deck_definition = load("ot3_standard", version=3)
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        self.test_data["Slot"] = str(self.slot)

    async def instrument_setup(self):
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Input Force"] = str(self.grip_force)
        await set_error_tolerance(self.api._backend._messenger, 15, 15)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _get_jaw_displacement(self):
        jaw_displacement = self.api._gripper_handler.gripper.current_jaw_displacement
        return jaw_displacement

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _grip_staircase(self, api, mount, step):
        step_width = self.steps[step-1]
        self.test_data["Step"] = str(step)
        self.test_data["Step Width"] = str(step_width)
        # Move to staircase step
        gripper_height = self.step_height*step
        current_position = await api.gantry_position(mount)
        above_staircase = self.nominal_center._replace(z=gripper_height)
        await api.move_to(mount, above_staircase)
        # Grip staircase step
        await api.grip(self.grip_force)
        time.sleep(self.hold_time)
        # Get gripper jaw displacement
        jaw_displacement = self._get_jaw_displacement()
        gripper_width = round((self.jaw_length - jaw_displacement*2), 3)
        abs_error = round((step_width - self.step_error) - gripper_width, 3)
        self.test_data["Gripper Width"] = str(gripper_width)
        self.test_data["Absolute Error"] = str(abs_error)
        print(f"-->> Step {step} ({step_width}mm): Displacement = {jaw_displacement}, Width = {gripper_width}, Error = {abs_error}")
        await api.ungrip()
        time.sleep(1)

    async def _move_gripper(self, api, mount):
        # Move gripper above staircase
        current_position = await api.gantry_position(mount)
        above_staircase = self.nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_staircase)

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Home gantry
        await api.home()
        # Move above slot estimated center
        nominal_center = Point(*get_calibration_square_position_in_slot(slot))
        current_position = await api.gantry_position(mount)
        above_slot_center = nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_slot_center)
        # Calibrate gripper
        for position, probe in self.gripper_probes.items():
            await api.home_z()
            input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
            self.gripper_offsets[position] = await calibrate_gripper_jaw(api, probe, slot)

        self.offset = await calibrate_gripper(api, self.gripper_offsets["Front"], self.gripper_offsets["Rear"])

        print(f"New Gripper Offset: {self.offset}")

        await api.home_z()
        input(f"Remove calibration probe, then press ENTER: ")

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
        await api.home_gripper_jaw()
        await api.home_z()
        await api.home()
        self.home = await api.gantry_position(mount)

    async def _reset(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home Z-Axis
        current_position = await api.gantry_position(mount)
        home_z = current_position._replace(z=self.home.z)
        await api.move_to(mount, home_z)
        # Move next to XY home
        await api.move_to(mount, self.home + Point(x=-5, y=-5, z=0))

    async def exit(self):
        print("\nExiting...")
        if self.api and self.mount:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                await self._home(self.api, self.mount)
                if self.calibrate:
                    await self._calibrate_slot(self.api, self.mount, 6)
                await self._move_gripper(self.api, self.mount)
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Running Test Cycle {cycle}/{self.cycles}")
                    for j in range(len(self.steps)):
                        step = j + 1
                        await self._grip_staircase(self.api, self.mount, step)
                        await self._record_data(cycle)
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
    print("\nOT-3 Gripper Width Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Width_Test(args.simulate, args.calibrate, args.cycles, args.force, args.time, args.slot)
    asyncio.run(test.run())
