"""Flex Stacker TOF Data Collection Script."""

import argparse
import asyncio
import subprocess
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, cast
import uuid

from opentrons.hardware_control.modules import FlexStacker, PlatformState
from opentrons.hardware_control.modules.types import HopperDoorState

from hardware_testing import data
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point
from hardware_testing.opentrons_api.helpers_ot3 import build_async_ot3_hardware_api
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction, TOFSensor
from opentrons.drivers.flex_stacker.utils import NUMBER_OF_BINS
from opentrons.hardware_control.ot3api import OT3API


def build_arg_parser() -> argparse.ArgumentParser:
    """Builds the argument parser."""
    arg_parser = argparse.ArgumentParser(description=__doc__)
    arg_parser.add_argument(
        "-p",
        "--samples",
        type=int,
        required=False,
        help="Sets the number of histogram samples",
        default=5,
    )
    arg_parser.add_argument(
        "-i",
        "--interval",
        type=int,
        required=False,
        help="Sets the sample interval",
        default=1,
    )
    arg_parser.add_argument(
        "-x",
        "--labware_amount_x",
        type=int,
        required=False,
        help="Sets the labware amount for the X a-lxis",
        default=0,
    )
    arg_parser.add_argument(
        "-z",
        "--labware_amount_z",
        type=int,
        required=False,
        help="Sets the labware amount for the Z axis",
        default=0,
    )
    arg_parser.add_argument(
        "-l",
        "--labware_name",
        type=str,
        required=False,
        help="Sets the name of labware",
        default="baseline",
    )
    arg_parser.add_argument(
        "-t",
        "--test_name",
        type=str,
        required=False,
        help="Sets the name of the test",
        default="tof_data_collection",
    )
    arg_parser.add_argument(
        "-s",
        "--simulate",
        action="store_true",
        required=False,
        help="Simulate this test script",
    )
    return arg_parser


class Stacker_TOF_Data_Collection:
    """Class to collect TOF Sensor data."""

    def __init__(
        self,
        simulate: bool,
        samples: int,
        interval: int,
        labware_amount_x: int,
        labware_amount_z: int,
        labware_name: str,
        test_name: str,
    ) -> None:
        """Init."""
        self.simulate = simulate
        self.samples = samples
        self.interval = interval
        self.labware_amount_x = labware_amount_x
        self.labware_amount_z = labware_amount_z
        self.labware_name = labware_name
        self.test_name = test_name
        self.api: Optional[OT3API] = None
        self.mount: Optional[OT3Mount] = None
        self.home: Optional[Point] = None
        self.axes = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
        self.stackers: List[str] = []
        self.test_files: List[str] = []

        self.test_data = {
            "Hash_id": "None",
            "Date": "None",
            "Test": "None",
            "Labware_Name": "None",
            "Stacker_SN": "None",
            "Axis": "None",
            "Platform_Position": "None",
            "Labware_Num_X": "None",
            "Labware_Num_Z": "None",
            "Sample": "None",
            "Zone": "None",
            "Time": "None",
        }
        # Bins 1-128
        self.test_data.update(
            {str(bin): "None" for bin in range(1, NUMBER_OF_BINS + 1)}
        )

        self.tof_axes = {
            "x": TOFSensor.X,
            "z": TOFSensor.Z,
        }
        self.directions = {
            "retract": Direction.RETRACT,
            "extend": Direction.EXTEND,
        }

    async def test_setup(self) -> None:
        """Setup the test."""
        self.api = await build_async_ot3_hardware_api(
            is_simulating=self.simulate, use_defaults=True
        )
        self.mount = OT3Mount.LEFT
        await self.stacker_setup()
        self.file_setup()
        print("\n-> Starting Stacker TOF Validation Test!\n")
        self.start_time = time.monotonic()

    async def stacker_setup(self) -> None:
        """Find stacker symlinks from the file system."""
        res = subprocess.check_output(["ls", "-la", "/dev"])
        self.port_list = re.findall(r"ot_module_flexstacker[0-9]", res.decode())
        for i in range(len(self.port_list)):
            if self.api is not None:
                stacker: FlexStacker = cast(FlexStacker, self.api.attached_modules[i])
                await stacker.home_all()
                serial_number = stacker.device_info["serial"]
                assert (
                    stacker.hopper_door_state == HopperDoorState.CLOSED
                ), f"ERROR: The stacker door must be closed {serial_number}."
                assert stacker.platform_state not in [
                    PlatformState.UNKNOWN,
                    PlatformState.MISSING,
                ], f"ERROR: The stacker platform must be installed {serial_number}."
                self.stackers.append(serial_number)

    def file_setup(self) -> None:
        """Setup where the test output is stored."""
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_date = "run-" + datetime.utcnow().strftime("%y-%m-%d")
        class_name = self.__class__.__name__
        self.test_path = data.create_folder_for_test_data(class_name.lower())
        for stacker in self.stackers:
            self.test_tag = (
                f"labx{self.labware_amount_x}_labz{self.labware_amount_z}_{stacker}"
            )
            test_file = data.create_file_name(
                self.labware_name, self.test_id, self.test_tag
            )
            data.append_data_to_file(
                test_name=self.test_name,
                run_id=self.test_date,
                file_name=test_file,
                data=self.test_header,
            )
            self.test_files.append(test_file)
            print("FILE = ", f"{self.test_path}/{self.test_date}/{test_file}")

    def dict_keys_to_line(self, dict: Dict[str, Any]) -> str:
        """Convert dict keys to CSV line."""
        return str.join(",", list(dict.keys())) + "\n"

    def dict_values_to_line(self, dict: Dict[str, Any]) -> str:
        """Convert dict values to CSV line."""
        return str.join(",", list(dict.values())) + "\n"

    async def read_stacker_tof(self) -> None:
        """Read the stacker TOF Sensor data."""
        for i in range(len(self.stackers)):
            print(f"\n>> Stacker = {self.stackers[i]}")
            for pos, direction in self.directions.items():
                for axis, tof_axis in self.tof_axes.items():
                    for k in range(self.samples):
                        sample = k + 1
                        print(f">>> Reading {axis} {pos} Sample = {sample}")
                        elapsed_time = (time.monotonic() - self.start_time) / 60
                        if self.api is not None:
                            await self.api.attached_modules[i].home_axis(  # type: ignore
                                StackerAxis.X, direction
                            )
                            hist = await self.api.attached_modules[  # type: ignore
                                i
                            ]._driver.get_tof_histogram(  # type: ignore
                                tof_axis
                            )
                            for zone, bins_list in hist.bins.items():
                                date = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
                                test_data = self.test_data.copy()
                                test_data["Hash_id"] = str(uuid.uuid4())
                                test_data["Date"] = str(date)
                                test_data["Test"] = self.test_name
                                test_data["Labware_Name"] = self.labware_name
                                test_data["Stacker_SN"] = self.stackers[i]
                                test_data["Axis"] = str(axis.lower())
                                test_data["Platform_Position"] = pos.lower()
                                test_data["Labware_Num_X"] = str(self.labware_amount_x)
                                test_data["Labware_Num_Z"] = str(self.labware_amount_z)
                                test_data["Sample"] = str(sample)
                                test_data["Zone"] = str(zone)
                                test_data["Time"] = str(elapsed_time)
                                # Add the bin values
                                test_data.update({str(i): str(v) for i, v in enumerate(bins_list, start=1)})  # type: ignore

                                # Update the csv with new values
                                test_data_str = self.dict_values_to_line(test_data)
                                for test_file in self.test_files:
                                    if self.stackers[i] in test_file:
                                        data.append_data_to_file(
                                            test_name=self.test_name,
                                            run_id=self.test_date,
                                            file_name=test_file,
                                            data=test_data_str,
                                        )
                            time.sleep(self.interval)
                print("")

    async def _home(self, api: OT3API, mount: OT3Mount) -> None:
        await api.home()
        self.home = await api.gantry_position(mount)

    async def exit(self) -> None:
        """Before exiting the program."""
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        """Main entry point."""
        try:
            await self.test_setup()
            if self.api and self.mount:
                await self._home(self.api, self.mount)
            await self.read_stacker_tof()
        except KeyboardInterrupt:
            await self.exit()
            print("\nTest Cancelled!")
        except Exception as e:
            await self.exit()
            raise e
        finally:
            await self.exit()
            print("\nTest Completed!")


if __name__ == "__main__":
    print("\nFlex Stacker TOF Data Collection\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Stacker_TOF_Data_Collection(
        args.simulate,
        args.samples,
        args.interval,
        args.labware_amount_x,
        args.labware_amount_z,
        args.labware_name,
        args.test_name,
    )
    asyncio.run(test.run())
