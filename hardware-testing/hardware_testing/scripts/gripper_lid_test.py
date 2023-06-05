"""Gripper Lid Test."""
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
from opentrons_hardware.hardware_control.gripper_settings import (
    set_error_tolerance,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Lid Test')
    arg_parser.add_argument('-l', '--lid', choices=['top','bottom'], required=False, help='Sets the labware lid position for gripping', default='top')
    arg_parser.add_argument('-a', '--calibrate', action="store_true", required=False, help='Calibrates gripper')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Sets the number of testing cycles', default=1)
    arg_parser.add_argument('-f', '--force', type=int, required=False, help='Sets the gripper force in Newtons', default=10)
    arg_parser.add_argument('-t', '--time', type=int, required=False, help='Sets the gripper hold time in seconds', default=10)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number for calibration', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Lid_Test:
    def __init__(
        self, simulate: bool, calibrate: bool, lid: str, cycles: int, force: int, time: int, slot: int
    ) -> None:
        self.simulate = simulate
        self.calibrate = calibrate
        self.lid = lid
        self.cycles = cycles
        self.grip_force = force
        self.hold_time = time
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.nominal_center = None
        self.lid_offset = None
        self.lid_height = 16 # mm
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.gripper_axes = [OT3Axis.G, OT3Axis.Z_G]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "Lid Position":"None",
            "Input Force":"None",
            "Jaw Distance Start":"None",
            "Jaw Distance End":"None",
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
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        await self.deck_setup()
        await self.instrument_setup()
        await self.labware_setup()
        print(f"\nStarting Gripper Lid Test!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"slot{self.slot}_force{self.grip_force}_{self.lid}"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    async def deck_setup(self):
        self.deck_definition = load("ot3_standard", version=3)
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        self.test_data["Slot"] = str(self.slot)

    async def instrument_setup(self):
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Input Force"] = str(self.grip_force)
        await set_error_tolerance(self.api._backend._messenger, 15, 15)

    async def labware_setup(self):
        if self.lid == "top":
            self.lid_offset = 2
        elif self.lid == "bottom":
            self.lid_offset = 6
        self._update_lid_position()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _get_jaw_state(self):
        jaw_state = self.api._gripper_handler.gripper.state
        return jaw_state

    def _get_jaw_displacement(self):
        jaw_displacement = self.api._gripper_handler.gripper.current_jaw_displacement
        return jaw_displacement

    def _update_lid_position(self):
        self.lid_position = self.nominal_center._replace(y=self.nominal_center.y + 0.25, z=self.lid_height - self.lid_offset)

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _pick_lid(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Move above slot center
        current_position = await api.gantry_position(mount)
        above_slot_center = self.lid_position._replace(z=current_position.z)
        await api.move_to(mount, above_slot_center)
        # Pick labware lid at a certain height
        await api.move_to(mount, self.lid_position)
        await api.grip(self.grip_force)
        time.sleep(1)
        self.test_data["Jaw Distance Start"] = str(self._get_jaw_displacement())
        print("-->> Jaw Distance Start: ", self.test_data["Jaw Distance Start"])
        await api.home_z()
        time.sleep(self.hold_time)
        await api.grip(self.grip_force)
        time.sleep(1)
        self.test_data["Jaw Distance End"] = str(self._get_jaw_displacement())
        print("-->> Jaw Distance End: ", self.test_data["Jaw Distance End"])

    async def _drop_lid(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Drop labware lid at a certain height
        await api.move_to(mount, self.lid_position)
        await api.ungrip()
        time.sleep(1)

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Home gantry
        await api.home()
        # Move above slot estimated center
        current_position = await api.gantry_position(mount)
        above_slot_center = self.nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_slot_center)
        # Calibrate gripper
        for position, probe in self.gripper_probes.items():
            await api.home_z()
            input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
            self.gripper_offsets[position] = await calibrate_gripper_jaw(api, probe, slot)

        self.offset = await calibrate_gripper(api, self.gripper_offsets["Front"], self.gripper_offsets["Rear"])

        print(f"New Gripper Offset: {self.offset}")

        await api.home_z()
        input(f"Remove calibration probe, then press ENTER: ")

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
                await self._home(self.api, self.mount)
                if self.calibrate:
                    await self._calibrate_slot(self.api, self.mount, self.slot)
                    self._update_lid_position()
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Running Test Cycle {cycle}/{self.cycles}")
                    await self._pick_lid(self.api, self.mount, self.slot)
                    await self._drop_lid(self.api, self.mount, self.slot)
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
    print("\nOT-3 Gripper Lid Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Lid_Test(args.simulate, args.calibrate, args.lid, args.cycles, args.force, args.time, args.slot)
    asyncio.run(test.run())
