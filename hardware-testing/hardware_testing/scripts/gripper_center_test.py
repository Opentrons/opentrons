"""Gripper Center Test."""
import asyncio
import argparse
import string
import time

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
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Center Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number for calibration', default=6)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Center_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int
    ) -> None:
        self.simulate = simulate
        self.cycles = cycles
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.slot_center = None
        self.deck_encoder = None
        self.deck_z = None
        self.gauge_read = 0 # mm
        self.jog_speed = 10 # mm/s
        self.jog_distance = 22 # mm
        self.block_height = 45 # mm
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.gripper_axes = [OT3Axis.G, OT3Axis.Z_G]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "X Gauge":"None",
            "Y Gauge":"None",
            "Z Gauge":"None",
            "X Center":"None",
            "Y Center":"None",
            "Deck Height":"None",
        }
        self.gauges = {}
        self.gauge_ports = {
            # "X":"/dev/ttyUSB0",
            "Y":"/dev/ttyUSB1",
            # "Z":"/dev/ttyUSB2",
        }
        self.gauge_offsets = {
            "X":Point(x=0, y=0, z=6),
            "Y":Point(x=0, y=0, z=-50),
            "Z":Point(x=0, y=0, z=6),
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        self.gripper_offsets = {
            "Front":None,
            "Rear":None,
        }

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Slot"] = str(self.slot)
        self.deck_definition = load("ot3_standard", version=3)
        print(f"\nStarting Gripper Center Test!\n")
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

    def gauge_setup(self):
        for key, value in self.gauge_ports.items():
            self.gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
            self.gauges[key].connect()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _read_gauge(self, axis):
        # Read gauge
        self.gauge_read = self.gauges[axis].read_stable(timeout=20)
        print(f"--> Y Offset = {self.gauge_read}")
        self.test_data[f"{axis} Gauge"] = str(self.gauge_read)

    def _zero_gauges(self):
        print(f"\nPlace Gauge Block on Deck Slot #{self.slot}")
        for axis in self.gauges:
            gauge_zero = "{} Zero".format(axis)
            input(f"\nPush block against {axis}-axis Gauge and Press ENTER\n")
            _reading = True
            while _reading:
                zeros = []
                for i in range(5):
                    gauge = self.gauges[axis].read_stable(timeout=20)
                    zeros.append(gauge)
                _variance = abs(max(zeros) - min(zeros))
                print(f"Variance = {_variance}")
                if _variance < 0.1:
                    _reading = False
            zero = sum(zeros) / len(zeros)
            self.test_data[gauge_zero] = str(zero)
            print(f"{axis} Gauge Zero = {zero}mm")
        input(f"\nRemove Gauge Block from Deck Slot #{self.slot} and Press ENTER\n")

    async def _measure_center(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Get nominal center
        nominal_center = Point(*get_calibration_square_position_in_slot(slot))
        nominal_center = nominal_center - self.offset
        # Home gripper
        await api.home_z()
        await api.home_gripper_jaw()
        # Move above slot center
        current_position = await api.gantry_position(mount)
        above_slot_center = nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_slot_center)
        time.sleep(1.0)
        # Move to gripper gauge block
        gripper_block = nominal_center._replace(z=self.block_height)
        await api.move_to(mount, gripper_block)
        time.sleep(1.0)
        # Grip gauge block
        await api.grip(10)
        time.sleep(2.0)
        self._read_gauge("Y")
        # Ungrip gauge block
        await api.ungrip()
        time.sleep(1.0)
        # Home gripper
        await api.home_z()
        await api.home_gripper_jaw()

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate gripper
        for position, probe in self.gripper_probes.items():
            await api.home_z()
            # input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
            self.gripper_offsets[position] = await calibrate_gripper_jaw(api, probe, slot)

        self.offset = await calibrate_gripper(api, self.gripper_offsets["Front"], self.gripper_offsets["Rear"])
        self.slot_center = self.nominal_center - self.offset

        print(f"New Gripper Offset: {self.offset}")
        print(f"New Slot Center: {self.slot_center}")

        self.test_data["X Center"] = str(self.slot_center.x)
        self.test_data["Y Center"] = str(self.slot_center.y)
        self.test_data["Deck Height"] = str(self.slot_center.z)

        await api.home_z()
        # input(f"Remove calibration probe, then press ENTER: ")

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
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    self.slot_center = self.nominal_center
                    await self._home(self.api, self.mount)
                    await self._calibrate_slot(self.api, self.mount, self.slot)
                    await self._measure_center(self.api, self.mount, 5)
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
    print("\nOT-3 Gripper Center Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Center_Test(args.simulate, args.cycles, args.slot)
    asyncio.run(test.run())
