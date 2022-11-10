"""Capacitance Distance Test."""
import asyncio
import argparse
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from opentrons.config.types import (
    CapacitivePassSettings,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Capacitance Distance Testing')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-i', '--increment', type=float, required=False, help='Probe height increment size', default=1.0)
    arg_parser.add_argument('-n', '--steps', type=int, required=False, help='Number of steps', default=10)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Capacitance_Distance_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int, increment: float, steps: int
    ) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.deck_z = None
        self.deck_definition = None
        self.pipette_id = None
        self.slot = slot
        self.simulate = simulate
        self.cycles = cycles
        self.increment = increment
        self.steps = steps
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.PROBE_LENGTH = 34.5
        self.PROBE_SETTINGS_Z_AXIS = CapacitivePassSettings(
            prep_distance_mm=5,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        )
        self.test_data ={
            "Time":None,
            "Cycle":None,
            "Step":None,
            "Slot":None,
            "Pipette":None,
            "Deck Height":None,
            "Capacitance":None,
            "Current Position":None,
            "Current Encoder":None,
        }

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        self.pipette_id = self.api._pipette_handler.get_pipette(self.mount)._pipette_id
        self.deck_definition = load("ot3_standard", version=3)
        await self.api.add_tip(self.mount, self.PROBE_LENGTH)
        self.test_data["Slot"] = str(self.slot)
        self.test_data["Pipette"] = str(self.pipette_id)
        self.start_time = time.time()
        print(f"\nStarting Test on Deck Slot #{self.slot}:\n")

    def file_setup(self):
        self.test_name = "capacitance_distance_test"
        self.test_tag = f"slot{self.slot}"
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

    async def _get_encoder(self):
        encoder_position = await self.api.encoder_current_position(self.mount)
        encoders = []
        for key in encoder_position:
            encoders.append(round(encoder_position[key], 3))
        return encoders

    async def _probe_axis(
        self, axis: OT3Axis, target: float
    ) -> float:
        point = await self.api.capacitive_probe(
            self.mount, axis, target, self.PROBE_SETTINGS_Z_AXIS
        )
        return point

    async def _get_stable_capacitance(self) -> float:
        _reading = True
        while _reading:
            capacitance = []
            for i in range(10):
                data = await self.api.capacitive_read(self.mount)
                capacitance.append(data)
            _variance = max(capacitance) - min(capacitance)
            print(f"Variance = {_variance}")
            if _variance < 1:
                _reading = False
        return sum(capacitance) / len(capacitance)

    async def _reset(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home Z-Axis
        home_z = self.center_z._replace(z=self.home.z)
        await api.move_to(mount, home_z)

        # Move next to home
        await api.move_to(mount, self.home + Point(x=-5, y=-5, z=0))

    async def _measure_capacitance(
        self, api: OT3API, mount: OT3Mount, cycle: int, step: int
    ) -> None:
        # Move sensor up
        next_height = self.center_z._replace(z=self.deck_z + self.increment*(step - 1))
        await api.move_to(mount, next_height, speed=10)

        # Get current position and encoder
        current_position = await api.gantry_position(mount)
        encoder_position = await self._get_encoder()
        self.test_data["Current Position"] = str(current_position).replace(", ",";")
        self.test_data["Current Encoder"] = str(encoder_position).replace(", ",";")
        print(f"Current Position = {current_position}")
        print(f"Current Encoder = {encoder_position}")

        # Read capacitance
        capacitance = await self._get_stable_capacitance()
        # capacitance = await api.capacitive_read(mount)
        self.test_data["Capacitance"] = str(capacitance)
        print(f"Capacitance = {capacitance}")

        # Save data to file
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        self.test_data["Step"] = str(step)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_deck(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Initialize deck slot position
        corner = Point(*self.deck_definition["locations"]["orderedSlots"][self.slot - 1]["position"])
        self.center_z = Point(corner.x + 76, corner.y + 54, 1)

        # Home grantry
        await home_ot3(api, self.axes)

        # Move above deck Z-Axis point
        self.home = await api.gantry_position(mount)
        above_point = self.center_z._replace(z=self.home.z)
        await api.move_to(mount, above_point)

        # Probe deck Z-Axis height
        self.deck_z = await self._probe_axis(OT3Axis.by_mount(mount), self.center_z.z)
        print(f"Deck Height = {self.deck_z} mm")
        self.test_data["Deck Height"] = str(round(self.deck_z, 3))

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            for i in range(self.cycles):
                cycle = i + 1
                print(f"\n--> Starting Cycle {cycle}/{self.cycles}")
                await self._calibrate_deck(self.api, self.mount)
                for j in range(self.steps):
                    step = j + 1
                    print(f"---->> Measuring Step {step}/{self.steps}")
                    await self._measure_capacitance(self.api, self.mount, cycle, step)
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
    print("\nOT-3 Capacitance Distance Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Capacitance_Distance_Test(args.simulate, args.cycles, args.slot, args.increment, args.steps)
    asyncio.run(test.run())
