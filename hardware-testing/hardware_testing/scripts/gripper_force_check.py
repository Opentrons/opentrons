"""Gripper Force Check."""
import asyncio
import argparse
import string
import time

import logging
from logging.config import dictConfig

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)
from opentrons_hardware.hardware_control.gripper_settings import (
    set_error_tolerance,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)
from opentrons.hardware_control.motion_utilities import (
    target_position_from_relative,
)
from hardware_testing.drivers import (
    mark10,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Force Check')
    arg_parser.add_argument('-m', '--mode', choices=['force','pwm'], required=False, help='Sets the test mode', default='force')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Sets the number of testing cycles', default=10)
    arg_parser.add_argument('-f', '--force', type=int, nargs='+', required=False, help='Sets the gripper force in Newtons', default=[20])
    arg_parser.add_argument('-p', '--pwm', type=int, nargs='+', required=False, help='Sets the gripper PWM duty cycle in percentage', default=[25])
    arg_parser.add_argument('-t', '--hold_time', type=int, required=False, help='Sets the gripper hold time in seconds', default=10)
    arg_parser.add_argument('-u', '--open_time', type=int, required=False, help='Sets the gripper open time in seconds', default=1)
    arg_parser.add_argument('-n', '--part_number', type=str, required=False, help='Sets the gripper part number', default="DVT-00")
    arg_parser.add_argument('-i', '--continuous', action="store_true", required=False, help='Continuous grip')
    arg_parser.add_argument('-b', '--backlash', action="store_true", required=False, help='Backlash test')
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Sets the slider slot number', default=6)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Force_Check:
    def __init__(
        self, simulate: bool, continuous: bool, backlash: bool, mode: str, cycles: int, force: int, pwm: int, hold_time: float, open_time: float, part_number: str, slot: int
    ) -> None:
        self.simulate = simulate
        self.continuous = continuous
        self.backlash = backlash
        self.mode = mode
        self.cycles = cycles
        self.grip_force = force
        self.grip_pwm = pwm
        self.hold_time = hold_time
        self.open_time = open_time
        self.part_number = part_number
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.cycle = None
        self.force = None
        self.force_list = []
        self.above_gauge_position = Point(-105, -220, 0) # mm
        self.gauge_height = Point(0, 0, -100) # mm
        self.axes = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
        self.test_data = {
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Part Number":"None",
            "Serial Number":"None",
            "Input Force":"None",
            "Input PWM":"None",
            "Output Force":"None",
            "Jaw Displacement":"None",
        }
        self.force_gauge = None
        self.force_gauge_port = "/dev/ttyUSB0"
        self.class_name = self.__class__.__name__

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        await self.deck_setup()
        await self.gripper_setup()
        print(f"\nStarting Gripper-on-Robot Force Check!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        if self.mode == "force":
            if len(self.grip_force) > 1:
                force = "list"
            else:
                force = self.grip_force[0]
            self.test_tag = f"force_{force}"
        else:
            if len(self.grip_pwm) > 1:
                pwm = "list"
            else:
                pwm = self.grip_pwm[0]
            self.test_tag = f"pwm_{pwm}"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    def gauge_setup(self):
        self.force_gauge = mark10.Mark10.create(port=self.force_gauge_port)
        self.force_gauge.connect()

    async def gripper_setup(self):
        self.api.cache_instruments()
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Part Number"] = str(self.part_number)
        self.test_data["Serial Number"] = str(self.gripper_id)
        await set_error_tolerance(self.api._backend._messenger, 15, 15)

    async def deck_setup(self):
        self.deck_definition = load("ot3_standard", version=3)
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        self.test_data["Slot"] = str(self.slot)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _get_jaw_displacement(self):
        jaw_displacement = self.api._gripper_handler.gripper.current_jaw_displacement
        return jaw_displacement

    def _get_stable_force(self) -> float:
        _reading = True
        _try = 1
        while _reading:
            forces = []
            for i in range(5):
                if self.simulate:
                    data = 0.0
                else:
                    data = self.force_gauge.read_force()
                forces.append(data)
            _variance = round(abs(max(forces) - min(forces)), 5)
            print(f"Try #{_try} Variance = {_variance}")
            _try += 1
            if _variance < 0.1:
                _reading = False
        force = sum(forces) / len(forces)
        return force

    def _get_average(self):
        self.force_list.append(self.force)
        average = sum(self.force_list) / len(self.force_list)
        range = (max(self.force_list) - min(self.force_list)) / 2
        print("-->> Gripper Average Output Force = {:.3f} mm ± {:.3f} mm".format(average, range))

    async def _record_data(self):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(self.cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)
        self._get_average()

    async def _read_gripper(
        self, api: OT3API, input: int
    ) -> None:
        if self.mode == "force":
            print(f"Cycle #{self.cycle}: Input = {input} N")
            self.test_data["Input Force"] = str(input)
            await api.grip(input)
            time.sleep(self.hold_time)
        else:
            print(f"Cycle #{self.cycle}: Input = {input} %")
            self.test_data["Input PWM"] = str(input)
            await api._grip(input)
            time.sleep(self.hold_time)
        self.jaw_displacement = round(self._get_jaw_displacement(), 3)
        self.test_data["Jaw Displacement"] = str(self.jaw_displacement)
        self.force = self._get_stable_force()
        self.test_data["Output Force"] = str(self.force)
        print(f"Cycle #{self.cycle}: Output Force = {self.force} N")
        print(f"Cycle #{self.cycle}: Jaw Displacement = {self.jaw_displacement} mm")
        if not self.continuous:
            await api.ungrip()
            time.sleep(self.open_time)

    async def _move_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.move_rel(mount, self.above_gauge_position)
        await api.move_rel(mount, self.gauge_height)
        time.sleep(1.0)

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home_gripper_jaw()
        await api.home_z(mount)
        await api.home()
        self.home = await api.gantry_position(mount)

    async def exit(self):
        print("\nExiting...")
        if self.api and self.mount:
            await self._home_gripper(self.api, self.mount)
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                await self._home_gripper(self.api, self.mount)
                await self._move_gripper(self.api, self.mount)
                if self.mode == "force":
                    input_list = self.grip_force
                else:
                    input_list = self.grip_pwm
                if self.backlash:
                    self.continuous = True
                    for i in range(self.cycles):
                        for input in input_list:
                            self.cycle = i + 1
                            print(f"\n-> Starting Test Cycle {self.cycle}/{self.cycles}")
                            await self._read_gripper(self.api, input)
                            await self._record_data()
                            time.sleep(1.0)
                        await self.api.ungrip()
                        time.sleep(self.open_time)
                else:
                    for input in input_list:
                        for i in range(self.cycles):
                            self.cycle = i + 1
                            print(f"\n-> Starting Test Cycle {self.cycle}/{self.cycles}")
                            await self._read_gripper(self.api, input)
                            await self._record_data()
                            time.sleep(1.0)
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
    print("\nOT-3 Gripper Force Check\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Force_Check(args.simulate, args.continuous, args.backlash, args.mode, args.cycles, args.force, args.pwm, args.hold_time, args.open_time, args.part_number, args.slot)
    asyncio.run(test.run())
