"""Gripper Labware Test."""
import asyncio
import argparse
import string
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper_jaw,
    calibrate_gripper,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

LABWARE_SIZE_ARMADILLO = Point(x=127.8, y=-85.55, z=16)
LABWARE_SIZE_EVT_TIPRACK = Point(x=127.6, y=-85.8, z=93)
LABWARE_SIZE_RESERVOIR = Point(x=127.8, y=-85.55, z=30)

LABWARE_SIZE = {
    "plate": LABWARE_SIZE_ARMADILLO,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK,
    "reservoir": LABWARE_SIZE_RESERVOIR,
}
LABWARE_GRIP_HEIGHT = {
    "plate": LABWARE_SIZE_ARMADILLO.z * 0.5,
    "tiprack": LABWARE_SIZE_EVT_TIPRACK.z * 0.4,
    "reservoir": LABWARE_SIZE_RESERVOIR.z * 0.5,
}
LABWARE_KEYS = list(LABWARE_SIZE.keys())
LABWARE_GRIP_FORCE = {k: 15 for k in LABWARE_KEYS}

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Labware Test')
    arg_parser.add_argument('-p', '--probe', choices=['front','rear'], required=False, help='The gripper probe position to be tested', default='front')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-l', '--labware', choices=LABWARE_KEYS, required=True)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Labware_Test:
    def __init__(
        self, simulate: bool, probe: string, cycles: int, slot: int
    ) -> None:
        self.simulate = simulate
        self.probe = probe
        self.cycles = cycles
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.probes = ["Front","Rear"]
        self.slot_center = {
            "Front":None,
            "Rear":None,
        }
        self.offset = {
            "Front":None,
            "Rear":None,
        }
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "X Center Front":"None",
            "Y Center Front":"None",
            "Deck Height Front":"None",
            "X Center Rear":"None",
            "Y Center Rear":"None",
            "Deck Height Rear":"None",
            "X Center Gripper":"None",
            "Y Center Gripper":"None",
            "Deck Height Gripper":"None",
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        if self.probe == 'front':
            self.gripper_probe = GripperProbe.FRONT
        else:
            self.gripper_probe = GripperProbe.REAR

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Slot"] = str(self.slot)
        self.deck_definition = load("ot3_standard", version=3)
        print(f"\nStarting Gripper Labware Test with both probes!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"slot{self.slot}_" + self.probe
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

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate FRONT and REAR Probes
        for probe in self.probes:
            await api.home_gripper_jaw()
            self.offset[probe], self.slot_center[probe] = await calibrate_gripper_jaw(api, self.gripper_probes[probe], slot)
            self.test_data[f"X Center {probe}"] = str(self.slot_center[probe].x)
            self.test_data[f"Y Center {probe}"] = str(self.slot_center[probe].y)
            self.test_data[f"Deck Height {probe}"] = str(self.slot_center[probe].z)
            print(f"{probe} Probe Slot Center: {self.slot_center[probe]}")
            print(f"{probe} Probe Offset: {self.offset[probe]}")
            await api.home_z()

        # Calibrate Gripper Offset
        self.gripper_offset = await calibrate_gripper(api, self.offset["Front"], self.offset["Rear"])
        print(f"Gripper Offset: {self.gripper_offset}")

    async def _gripper_action(
        self, api: OT3API, pos: Point, force: float, is_grip: bool
    ) -> None:
        mount = OT3Mount.GRIPPER
        current_pos = await api.gantry_position(mount)
        travel_height = max(current_pos.z, pos.z + TRAVEL_HEIGHT)
        await api.move_to(mount, current_pos._replace(z=travel_height))
        await api.move_to(mount, pos._replace(z=travel_height))
        await api.move_to(mount, pos)
        if is_grip:
            await api.grip(force)
        else:
            await api.ungrip()
        await api.move_rel(mount, types.Point(z=TRAVEL_HEIGHT))

    async def _slot_to_slot(
        self, api: OT3API, labware_key: str, force: Optional[float], src_slot: int, dst_slot: int,
        src_deck_item: str,
        dst_deck_item: str,
        src_offset: Optional[types.Point] = None,
        dst_offset: Optional[types.Point] = None,
    ) -> None:

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
                input(f"Add FRONT and REAR probes to gripper, then press ENTER: ")
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
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
    print("\nOT-3 Gripper Calibration Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Labware_Test(args.simulate, args.probe, args.cycles, args.slot)
    asyncio.run(test.run())
