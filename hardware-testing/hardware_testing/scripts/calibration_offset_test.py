"""OT-3 Calibration Offset Test."""
import asyncio
import argparse
import string
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    calibrate_gripper,
    calibrate_gripper_jaw,
    find_calibration_structure_height,
    _probe_deck_at,
)
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Calibration Offset Test')
    arg_parser.add_argument('-m', '--mount', choices=['left','right','gripper'], required=False, help='Instrument mount to be tested', default='left')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=10)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Calibration_Offset_Test:
    def __init__(
        self, simulate: bool, mount: string, cycles: int, slot: int
    ) -> None:
        self.simulate = simulate
        self.instrument = mount
        self.cycles = cycles
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.instrument_id = None
        self.slot_center = None
        self.jog_speed = 10 # mm/s
        self.jog_distance = 22 # mm
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.test_data = {
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Instrument":"None",
            "X Offset":"None",
            "Y Offset":"None",
            "Z Offset":"None",
            "X Center":"None",
            "Y Center":"None",
            "Deck Height":"None",
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        self.gripper_offsets = {
            "Front":None,
            "Rear":None,
        }
        self.axis_offsets = {
            "X":[],
            "Y":[],
            "Z":[],
        }

    async def test_setup(self):
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.file_setup()
        await self.instrument_setup()
        await self.deck_setup()
        print(f"\nStarting Calibration Offset Test on Slot {self.slot}!\n")
        self.start_time = time.time()

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

    async def instrument_setup(self):
        await self.api.cache_instruments()
        if self.instrument == "left":
            self.mount = OT3Mount.LEFT
        elif self.instrument == "right":
            self.mount = OT3Mount.RIGHT
        elif self.instrument == "gripper":
            self.mount = OT3Mount.GRIPPER
        if self.simulate:
            self.instrument_id = "SIMULATION"
        else:
            if self.instrument == "gripper":
                self.instrument_id = self.api._gripper_handler.get_gripper().gripper_id
            else:
                self.instrument_id = self.api._pipette_handler.get_pipette(self.mount)._pipette_id
        self.test_data["Instrument"] = str(self.instrument_id)

    async def deck_setup(self):
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        self.test_data["Slot"] = str(self.slot)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _get_average(self):
        for axis in self.axis_offsets:
            self.axis_offsets[axis].append(float(self.test_data[f"{axis} Offset"]))
            axis_list = self.axis_offsets[axis]
            average = sum(axis_list) / len(axis_list)
            range = (max(axis_list) - min(axis_list)) / 2
            print("-->> {}-axis Average Offset = {:.3f} mm ± {:.3f} mm".format(axis, average, range))

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)
        self._get_average()

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate instrument
        if self.instrument == "gripper":
            for position, probe in self.gripper_probes.items():
                await api.home_z()
                input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
                self.gripper_offsets[position] = await calibrate_gripper_jaw(api, probe, slot)
            self.offset = await calibrate_gripper(api, self.gripper_offsets["Front"], self.gripper_offsets["Rear"])
        else:
            self.offset = await calibrate_pipette(api, mount, slot)
        self.slot_center = self.nominal_center - self.offset

        print(f"--> New Offset: {self.offset}")
        print(f"--> New Slot Center: {self.slot_center}")

        self.test_data["X Offset"] = str(self.offset.x)
        self.test_data["Y Offset"] = str(self.offset.y)
        self.test_data["Z Offset"] = str(self.offset.z)

        self.test_data["X Center"] = str(self.slot_center.x)
        self.test_data["Y Center"] = str(self.slot_center.y)
        self.test_data["Deck Height"] = str(self.slot_center.z)

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
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
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                input(f"Add probe to {self.instrument.upper()} mount, then press ENTER: ")
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Running Test Cycle {cycle}/{self.cycles}")
                    self.slot_center = self.nominal_center
                    await self._home(self.api, self.mount)
                    await self._calibrate_slot(self.api, self.mount, self.slot)
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
    print("\nOT-3 Calibration Offset Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Calibration_Offset_Test(args.simulate, args.mount, args.cycles, args.slot)
    asyncio.run(test.run())
