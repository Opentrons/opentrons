"""Gripper Vref Test."""
import asyncio
import argparse
import time
import numpy as np

from opentrons.hardware_control.ot3api import OT3API
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

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='Gripper Force Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Vref_Test:
    def __init__(
        self, simulate: bool, cycles: int
    ) -> None:
        self.api = None
        self.mount = None
        self.simulate = simulate
        self.cycles = cycles
        self.pwm_start = 10 # %
        self.pwm_max = 100 # %
        self.vref_start = 1.0 # Volts
        self.vref_max = 2.7 # Volts
        self.vref_inc = 0.1 # Volts
        self.engage_position = Point(0, 0, -78)

    async def test_setup(self):
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        gripper_config = await get_gripper_jaw_motor_param(self.api._backend._messenger)
        print(f"Initial Gripper Config: {gripper_config}")
        self.start_time = time.time()
        print(f"\nStarting Gripper Vref Test:\n")

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home_gripper_jaw()
        await api.home_z(mount)
        self.home = await api.gantry_position(mount)

    async def _update_vref(
        self, api: OT3API, vref: float
    ) -> None:
        await set_reference_voltage(api._backend._messenger, round(vref, 1))
        gripper_config = await get_gripper_jaw_motor_param(api._backend._messenger)
        print(f"New Gripper Config: {gripper_config}")

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
                    for vref in np.arange(self.vref_start, self.vref_max + self.vref_inc, self.vref_inc):
                        vref = round(vref, 1)
                        print(f"\n-->> Setting Vref {vref} V")
                        await self._update_vref(self.api, vref)
                        time.sleep(2.0)
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
    print("\nOT-3 Gripper Vref Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Vref_Test(args.simulate, args.cycles)
    asyncio.run(test.run())
