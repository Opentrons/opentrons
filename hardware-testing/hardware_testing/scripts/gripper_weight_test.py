"""Gripper Weight Test."""
import asyncio
import argparse
import time
import string
import numpy as np

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import (
    GripperJawState,
)
from opentrons.hardware_control.motion_utilities import (
    target_position_from_relative,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from opentrons_hardware.hardware_control.gripper_settings import (
    set_pwm_param,
    set_reference_voltage,
    get_gripper_jaw_motor_param,
)
from hardware_testing.drivers import (
    mark10,
    rohde_schwarz_rtm3004,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Gripper Weight Test')
    arg_parser.add_argument('-u', '--input', choices=['dc','force'], required=False, help='Input type to be tested', default='dc')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-t', '--time', type=float, required=False, help='Time to hold the weight in minutes', default=10)
    arg_parser.add_argument('-g', '--height', type=float, required=False, help='Height to hold the weight from deck in mm', default=20)
    arg_parser.add_argument('-i', '--interval', type=float, required=False, help='Interval for recording data in seconds', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Weight_Test:
    def __init__(
        self, simulate: bool, input: string, cycles: int, time: float, height: float, interval: float
    ) -> None:
        self.api = None
        self.mount = None
        self.gripper_id = None
        self.simulate = simulate
        self.input = input
        self.cycles = cycles
        self.time = time
        self.height = height
        self.vref_default = 1.0 # Volts
        self.vref = 2.0 # Volts
        self.dc = 50 # %
        self.force = 26 # Newtons
        self.grip_position = Point(0, 0, -78)
        self.hold_position = Point(0, 0, -self.height)
        self.measurement_data = {
            "RMS":"None",
            "Peak Plus":"None",
            "Peak Minus":"None",
            "PWM Duty Cycle":"None",
            "PWM Frequency":"None",
        }
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Trial":"None",
            "Gripper":"None",
            "Vref":"None",
            "Firmware Vref":"None",
            "Input DC":"None",
            "Input Force":"None",
        }
        self.oscilloscope = None
        self.oscilloscope_port = "/dev/ttyACM0"

    async def test_setup(self):
        self.file_setup()
        self.oscilloscope_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        await self._update_vref(self.api, self.vref_default)
        gripper_config = await get_gripper_jaw_motor_param(self.api._backend._messenger)
        print(f"Initial Gripper Config: {gripper_config}")
        self.start_time = time.time()
        print(f"\nStarting Gripper Weight Test: (Input = {self.input.upper()})\n")

    def file_setup(self):
        class_name = self.__class__.__name__
        test_data = self.test_data.copy()
        test_data.update(self.measurement_data)
        self.test_name = class_name.lower()
        self.test_tag = self.input
        self.test_header = self.dict_keys_to_line(test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    def oscilloscope_setup(self):
        self.oscilloscope = rohde_schwarz_rtm3004.Rohde_Schwarz_RTM3004(port=self.oscilloscope_port)
        self.oscilloscope.connect()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _read_oscilloscope(self):
        for index, key in enumerate(self.measurement_data):
            self.measurement_data[key] = str(self.oscilloscope.get_measurement(index+1))
        print(self.measurement_data)

    async def _record_data(self, cycle: int, trial: int, vref: float, input_dc: int = 0, input_force: float = 0):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        self.test_data["Trial"] = str(trial)
        self.test_data["Vref"] = str(vref)
        self.test_data["Input DC"] = str(input_dc)
        self.test_data["Input Force"] = str(input_force)
        test_data = self.test_data.copy()
        test_data.update(self.measurement_data)
        test_data = self.dict_values_to_line(test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _move_gripper_jaw(
        self, api: OT3API, mount: OT3Mount, input_dc: int = 0, input_force: float = 0
    ) -> None:
        if input_dc > 0:
            await api._grip(input_dc)
        else:
            await api.grip(input_force)
        api._gripper_handler.set_jaw_state(GripperJawState.GRIPPING)
        time.sleep(self.interval)

        self._read_oscilloscope()

        await api.ungrip()
        time.sleep(self.interval)

    async def _hold_weight(
        self, api: OT3API, mount: OT3Mount, input_dc: int = 0, input_force: float = 0
    ) -> None:
        await api.move_rel(mount, self.grip_position)
        time.sleep(5)
        if input_dc > 0:
            await api._grip(input_dc)
            api._gripper_handler.set_jaw_state(GripperJawState.GRIPPING)
        else:
            await api.grip(input_force)
        time.sleep(5)
        await api.move_rel(mount, self.hold_position)

    async def _drop_weight(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.move_rel(mount, self.grip_position)
        await api.ungrip()

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home_z(mount)
        await api.home_gripper_jaw()
        self.home = await api.gantry_position(mount)

    async def _update_vref(
        self, api: OT3API, vref: float
    ) -> None:
        await set_reference_voltage(api._backend._messenger, vref)
        gripper_config = await get_gripper_jaw_motor_param(api._backend._messenger)
        print(f"New Gripper Config: {gripper_config}")
        fw_vref = round(gripper_config.reference_voltage, 3)
        self.test_data["Firmware Vref"] = str(fw_vref)

    async def exit(self):
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
                    await self._update_vref(self.api, self.vref)
                    if self.input == 'dc':
                        await self._hold_weight(self.api, self.mount, input_dc=self.dc)
                        # await self._record_data(cycle, input_dc=pwm)
                    else:
                        await self._hold_weight(self.api, self.mount, input_force=self.force)
                        # await self._record_data(cycle, input_dc=pwm)
                    time.sleep(10)
                    await self._drop_weight(self.api, self.mount)
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
    print("\nOT-3 Gripper Weight Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Weight_Test(args.simulate, args.input, args.cycles, args.time, args.height, args.interval)
    asyncio.run(test.run())
