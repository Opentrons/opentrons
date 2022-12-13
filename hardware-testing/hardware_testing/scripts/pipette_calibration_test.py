"""Pipette Calibration Test."""
import asyncio
import argparse
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Pipette Calibration Test')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Pipette_Calibration_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int
    ) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.pipette_id = None
        self.deck_z = None
        self.deck_definition = None
        self.slot_center = None
        self.simulate = simulate
        self.cycles = cycles
        self.slot = slot
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Pipette":"None",
            "X Gauge":"None",
            "Y Gauge":"None",
            "Z Gauge":"None",
            "X Zero":"None",
            "Y Zero":"None",
            "Z Zero":"None",
            "Deck Height":"None",
        }
        self.gauges = {}
        self.gauge_ports = {
            "Gauge X":"/dev/ttyUSB0",
            "Gauge Y":"/dev/ttyUSB1",
            # "Gauge Z":"/dev/ttyUSB2",
        }

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        self.pipette_id = self.api._pipette_handler.get_pipette(self.mount)._pipette_id
        self.deck_definition = load("ot3_standard", version=3)
        # await self.api.add_tip(self.mount, self.PROBE_LENGTH)
        self.test_data["Slot"] = str(self.slot)
        self.test_data["Pipette"] = str(self.pipette_id)
        self.start_time = time.time()
        print(f"\nStarting Pipette Calibration Test!\n")

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"slot{self.slot}"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    def gauge_setup(self):
        for key, value in self.gauge_ports.items():
            self.gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
            self.gauges[key].connect()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    async def _calibrate(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate pipette
        offset = await calibrate_pipette(api, mount, slot)
        print(f"New Pipette Offset: {offset}")

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
        await home_ot3(api, self.axes)
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
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._home(self.api, self.mount)
                    await self._calibrate(self.api, self.mount, self.slot)
                    await self._reset(self.api, self.mount)
        except Exception as e:
            await self.exit()
            raise e
        except KeyboardInterrupt:
            await self.exit()
            print("Test Cancelled!")
        finally:
            await self.exit()

if __name__ == '__main__':
    print("\nOT-3 Pipette Calibration Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Pipette_Calibration_Test(args.simulate, args.cycles, args.slot)
    asyncio.run(test.run())
