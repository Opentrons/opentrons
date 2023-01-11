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
    arg_parser.add_argument('-p', '--pwm', type=int, required=False, help='Grip PWM duty-cycle in percentage', default=50)
    arg_parser.add_argument('-f', '--force', type=float, required=False, help='Grip force value in Newtons', default=26)
    arg_parser.add_argument('-i', '--interval', type=float, required=False, help='Interval for recording data in seconds', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Weight_Test:
    def __init__(
        self, simulate: bool, weight: string, input: string, cycles: int, time: float, height: float, pwm: int, force: float, interval: float
    ) -> None:
        self.api = None
        self.mount = None
        self.gripper_id = None
        self.simulate = simulate
        self.weight = weight
        self.input = input
        self.cycles = cycles
        self.time = time # minutes
        self.height = height # mm
        self.interval = interval # seconds
        self.dc = pwm # %
        self.force = force # Newtons
        self.vref_default = 1.0 # Volts
        self.vref = 2.0 # Volts
        self.grip_position = Point(0, 0, -135)
        self.hold_position = Point(0, 0, self.height)
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
        if self.input == "dc":
            input_value = srt(self.dc)
        else:
            input_value = str(self.force)
        self.test_name = class_name.lower()
        self.test_tag = self.input + input_value + "_" + self.weight + "g"
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

    def _record_data(self, elapsed_time: float, cycle: int, vref: float, input_dc: int = 0, input_force: float = 0):
        self._read_oscilloscope()
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        self.test_data["Vref"] = str(vref)
        self.test_data["Input DC"] = str(input_dc)
        self.test_data["Input Force"] = str(input_force)
        test_data = self.test_data.copy()
        test_data.update(self.measurement_data)
        test_data = self.dict_values_to_line(test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _hold_weight(
        self, api: OT3API, mount: OT3Mount, input_dc: int = 0, input_force: float = 0
    ) -> None:
        await api.move_rel(mount, self.grip_position)
        time.sleep(3)
        if input_dc > 0:
            await api._grip(input_dc)
            api._gripper_handler.set_jaw_state(GripperJawState.GRIPPING)
        else:
            await api.grip(input_force)
        time.sleep(3)
        await api.home_z(mount)

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
            await self._drop_weight(self.api, self.mount)
            await self._home_gripper(self.api, self.mount)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                for i in range(self.cycles):
                    cycle = i + 1
                    vref = round(self.vref, 1)
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._home_gripper(self.api, self.mount)
                    await self._update_vref(self.api, self.vref)
                    if self.input == 'dc':
                        print(f"\n-->> Applying Duty-Cycle {self.dc}%")
                        await self._hold_weight(self.api, self.mount, input_dc=self.dc)
                    else:
                        print(f"\n-->> Applying Force {self.force}N")
                        await self._hold_weight(self.api, self.mount, input_force=self.force)
                    elapsed_time = 0
                    record_time = 0
                    stop_time = self.time*60
                    start_time = time.time()
                    while elapsed_time < stop_time:
                        if record_time == self.interval:
                            record_time = 0
                            if self.input == 'dc':
                                self._record_data(elapsed_time, cycle, vref, input_dc=self.dc)
                            else:
                                self._record_data(elapsed_time, cycle, vref, input_force=self.force)
                        time.sleep(1)
                        record_time += 1
                        elapsed_time += 1
                        print(f"Elapsed Time: {round(elapsed_time/60,2)}/{self.time} minutes")
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
    weight = str(input("Specify weight (grams): ") or 500)
    test = Gripper_Weight_Test(
        simulate=args.simulate,
        weight=weight,
        input=args.input,
        cycles=args.cycles,
        time=args.time,
        height=args.height,
        pwm=args.pwm,
        force=args.force,
        interval=args.interval)
    asyncio.run(test.run())
