"""Gripper Lifetime Test."""
import asyncio
import argparse
import string
import time

import logging
from logging.config import dictConfig

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper_jaw,
    calibrate_gripper,
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
    build_async_ot3_hardware_api,
)
from opentrons.hardware_control.motion_utilities import (
    target_position_from_relative,
)


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "/data/logs/gripper-lifetime.log",
            "maxBytes": 5000000,
            "level": logging.DEBUG,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.DEBUG,
        },
    },
}


def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Lifetime Test')
    arg_parser.add_argument('-m', '--mode', choices=['robot','rig'], required=False, help='Sets the test setup mode', default='robot')
    arg_parser.add_argument('-a', '--calibrate', action="store_true", required=False, help='Calibrates gripper')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-f', '--force', type=int, required=False, help='Set the gripper force in Newtons', default=20)
    arg_parser.add_argument('-t', '--time', type=int, required=False, help='Set the gripper hold time in seconds', default=10)
    arg_parser.add_argument('-g', '--height', type=int, required=False, help='Sets the grip height', default=0)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Sets the deck slot number', default=6)
    arg_parser.add_argument('-z', '--fast', action="store_true", required=False, help='Fast mode')
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Lifetime_Test:
    def __init__(
        self, simulate: bool, calibrate: bool, fast: bool, mode: str, cycles: int, force: float, time: float, height: int, slot: int
    ) -> None:
        self.simulate = simulate
        self.calibrate = calibrate
        self.fast = fast
        self.mode = mode
        self.cycles = cycles
        self.grip_force = force
        self.hold_time = time
        self.height = height
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.cycle = None
        self.current_state = None
        self.grip_height = None
        self.axes = [OT3Axis.G, OT3Axis.Z_G]
        self.test_data = {
            "Time":"None",
            "Cycle":"None",
            "Gripper":"None",
            "State":"None",
            "Jaw State":"None",
            "Jaw Displacement":"None",
            "Encoder Position":"None",
        }
        self.states = {
            "HOLD":"Holding",
            "PICK":"Picking",
            "DROP":"Dropping",
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        self.gripper_offsets = {
            "Front":None,
            "Rear":None,
        }
        self.class_name = self.__class__.__name__
        print(self.class_name)

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        await set_error_tolerance(self.api._backend._messenger, 15, 15)
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.deck_definition = load("ot3_standard", version=3)
        print(f"\nStarting Gripper Lifetime Test!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"force_{self.grip_force}"
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

    def _encoder_to_point(self, encoder_position):
        point = Point(0, 0, 0)
        for index, key in enumerate(encoder_position):
            point[index] = round(encoder_position[key], 3)
        return point

    async def _get_encoder(self):
        encoder_position = await self.api.encoder_current_position_ot3(self.mount)
        encoder = self._encoder_to_point(encoder_position)
        return encoder

    def _get_jaw_state(self):
        jaw_state = self.api._gripper_handler.gripper.state
        return jaw_state

    def _get_jaw_displacement(self):
        jaw_displacement = self.api._gripper_handler.gripper.current_jaw_displacement
        return jaw_displacement

    async def _record_data(self):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(self.cycle)
        self.test_data["State"] = str(self.current_state)
        self.test_data["Jaw State"] = str(self._get_jaw_state()).split('.')[1]
        self.test_data["Jaw Displacement"] = str(self._get_jaw_displacement())
        if self.mode == "robot":
            # self.test_data["Encoder Position"] = str(await self._get_encoder())
            self.test_data["Encoder Position"] = "(0.0;0.0;0.0)"
        else:
            self.test_data["Encoder Position"] = "(0.0;0.0;0.0)"
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _move_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home()
        current_position = await api.gantry_position(mount)
        above_nominal_center = self.nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_nominal_center)

    async def _pick(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        self.current_state = self.states["PICK"]
        target_position = target_position_from_relative(mount, self.grip_height, api._current_position)
        await api._move(target_position)
        if not self.fast:
            time.sleep(1.0)
        await api.grip(self.grip_force)
        await self._record_data()

    async def _hold(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        self.current_state = self.states["HOLD"]
        await api.home_z(mount)
        if not self.fast:
            time.sleep(self.hold_time)
        await self._record_data()

    async def _drop(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        self.current_state = self.states["DROP"]
        target_position = target_position_from_relative(mount, self.grip_height, api._current_position)
        await api._move(target_position)
        if not self.fast:
            time.sleep(1.0)
        await api.ungrip()
        await self._record_data()

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate gripper
        await api.home()
        for position, probe in self.gripper_probes.items():
            await api.home_z()
            input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
            self.gripper_offsets[position] = await calibrate_gripper_jaw(api, probe, slot)

        self.offset = await calibrate_gripper(api, self.gripper_offsets["Front"], self.gripper_offsets["Rear"])

        print(f"New Gripper Offset: {self.offset}")

        await api.home_z()
        input(f"Remove calibration probe, then press ENTER: ")

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home(self.axes)

    async def exit(self):
        print("\nExiting...")
        if self.api and self.mount:
            await self._home_gripper(self.api, self.mount)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                if self.mode == "robot":
                    if self.calibrate:
                        await self._calibrate_slot(self.api, self.mount, self.slot)
                    await self._move_gripper(self.api, self.mount)
                    self.grip_height = Point(0, 0, -125)
                else:
                    self.grip_height = Point(0, 0, -100)
                if self.height > 0:
                    self.grip_height = Point(0, 0, -self.height)
                for i in range(self.cycles):
                    self.cycle = i + 1
                    print(f"\n-> Starting Test Cycle {self.cycle}/{self.cycles}")
                    await self._home_gripper(self.api, self.mount)
                    await self._pick(self.api, self.mount)
                    await self._hold(self.api, self.mount)
                    await self._drop(self.api, self.mount)
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
    print("\nOT-3 Gripper Lifetime Test\n")
    dictConfig(LOG_CONFIG)
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Lifetime_Test(args.simulate, args.calibrate, args.fast, args.mode, args.cycles, args.force, args.time, args.height, args.slot)
    asyncio.run(test.run())
