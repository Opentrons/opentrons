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

from opentrons_hardware.hardware_control.gripper_settings import (
    set_pwm_param,
    set_reference_voltage,
)

from hardware_testing.drivers import (
    mark10,
    rohde_schwarz_rtm3004,
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
        self.measurement_data = {
            "RMS":0,
            "Peak Plus":0,
            "Peak Minus":0,
            "PWM Duty Cycle":0,
            "PWM Frequency":0,
        }
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Trial":"None",
            "Gripper":"None",
            "Force":"None",
            "Current":"None",
        }
        self.force_gauge = None
        self.oscilloscope = None
        self.force_gauge_port = "/dev/ttyUSB0"
        self.oscilloscope_port = "/dev/ttyACM0"

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.oscilloscope_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.start_time = time.time()
        print(f"\nStarting Gripper Force Test:\n")

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = "vref"
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

    def oscilloscope_setup(self):
        self.oscilloscope = rohde_schwarz_rtm3004.Rohde_Schwarz_RTM3004(port=self.oscilloscope_port)
        self.oscilloscope.connect()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _read_oscilloscope(self):
        for index, key in enumerate(self.measurement_data):
            self.measurement_data[key] = self.oscilloscope.get_measurement(index+1)
        print(self.measurement_data)

    def _get_stable_force(self) -> float:
        _reading = True
        _try = 1
        while _reading:
            force = []
            for i in range(5):
                if self.simulate:
                    data = 0.0
                else:
                    data = self.force_gauge.read_force()
                force.append(data)
            _variance = round(abs(max(force) - min(force)), 5)
            # print(f"Try #{_try} Variance = {_variance}")
            _try += 1
            if _variance < 0.1:
                _reading = False
        return sum(force) / len(force)
        return force

    async def _record_data(self, cycle, trial):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        self.test_data["Trial"] = str(trial)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _move_gripper_jaw(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.grip(self.force)
        time.sleep(self.interval)

        print("Gripper Closed")
        self._read_oscilloscope()
        force = self._get_stable_force()
        print(f"Grip Force: {force} N")
        self.test_data["Force"] = str(force)

        await api.ungrip()
        time.sleep(self.interval)
        print("Gripper Open")
        self._read_oscilloscope()

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
                        await self._move_gripper_jaw(self.api, self.mount)
                        await self._record_data(cycle, trial)
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
