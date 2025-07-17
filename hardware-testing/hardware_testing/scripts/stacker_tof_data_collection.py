"""Flex Stacker TOF Data Collection Script."""

# TODO: Make the output of this match tools/tof-analysis/data/raw_data_frame.csv
import argparse
import asyncio
import subprocess
import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import build_async_ot3_hardware_api
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction, TOFSensor
from opentrons.drivers.flex_stacker.driver import NUMBER_OF_BINS
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
        "-n",
        "--labware_amount",
        type=int,
        required=False,
        help="Sets the labware amount",
        default=0,
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
        self, simulate: bool, samples: int, interval: int, labware_amount: int
    ) -> None:
        """Init."""
        self.simulate = simulate
        self.samples = samples
        self.interval = interval
        self.labware_amount = labware_amount
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
        self.test_data.update({str(bin): "None" for bin in range(1, NUMBER_OF_BINS)})

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
        self.start_time = time.time()

    async def stacker_setup(self) -> None:
        """Find stacker symlinks from the file system."""
        res = subprocess.check_output(["ls", "-la", "/dev"])
        self.port_list = re.findall(r"ot_module_flexstacker[0-9]", res.decode())
        for i in range(len(self.port_list)):
            if self.api is not None:
                serial_number = self.api.attached_modules[i].device_info["serial"]
                self.stackers.append(serial_number)

    def file_setup(self) -> None:
        """Setup where the test output is stored."""
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_date = "run-" + datetime.utcnow().strftime("%y-%m-%d")
        self.test_path = data.create_folder_for_test_data(self.test_name)
        if self.labware_amount == 0:
            self.labware_name = "LW=baseline"
            self.labware_amount_z = self.labware_amount
        elif self.labware_amount == 1:
            self.labware_name = "LW=nest-96-pcr"
            self.labware_amount_z = self.labware_amount
        elif self.labware_amount == 3:
            self.labware_name = "LW=tiprack"
            self.labware_amount = 1
            self.labware_amount_z = 3
        print("FILE PATH = ", self.test_path)
        print("FILE NAMES = ")
        for stacker in self.stackers:
            self.test_tag_x_ret = f"x-axis_labx{self.labware_amount}_labz{self.labware_amount_z}_retract_{stacker}"
            self.test_tag_x_ext = f"x-axis_labx{self.labware_amount}_labz{self.labware_amount_z}_extend_{stacker}"
            self.test_tag_z_ret = f"z-axis_labx{self.labware_amount}_labz{self.labware_amount_z}_retract_{stacker}"
            self.test_tag_z_ext = f"z-axis_labx{self.labware_amount}_labz{self.labware_amount_z}_extend_{stacker}"
            test_file_x_ret = data.create_file_name(
                self.labware_name, self.test_id, self.test_tag_x_ret
            )
            test_file_x_ext = data.create_file_name(
                self.labware_name, self.test_id, self.test_tag_x_ext
            )
            test_file_z_ret = data.create_file_name(
                self.labware_name, self.test_id, self.test_tag_z_ret
            )
            test_file_z_ext = data.create_file_name(
                self.labware_name, self.test_id, self.test_tag_z_ext
            )
            data.append_data_to_file(
                test_name=self.test_name,
                run_id=self.test_date,
                file_name=test_file_x_ret,
                data=self.test_header,
            )
            data.append_data_to_file(
                test_name=self.test_name,
                run_id=self.test_date,
                file_name=test_file_x_ext,
                data=self.test_header,
            )
            data.append_data_to_file(
                test_name=self.test_name,
                run_id=self.test_date,
                file_name=test_file_z_ret,
                data=self.test_header,
            )
            data.append_data_to_file(
                test_name=self.test_name,
                run_id=self.test_date,
                file_name=test_file_z_ext,
                data=self.test_header,
            )
            self.test_files.append(test_file_x_ret)
            self.test_files.append(test_file_x_ext)
            self.test_files.append(test_file_z_ret)
            self.test_files.append(test_file_z_ext)
            print(test_file_x_ret)
            print(test_file_x_ext)
            print(test_file_z_ret)
            print(test_file_z_ext)

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
            serial = self.api.attached_modules[i].device_info["serial"]  # type: ignore
            for axis, tof_axis in self.tof_axes.items():
                for pos, direction in self.directions.items():
                    for k in range(self.samples):
                        sample = k + 1
                        print(f">>> Reading {axis} {pos} Sample = {sample}")
                        elapsed_time = (time.time() - self.start_time) / 60
                        if self.api is not None:
                            await self.api.attached_modules[i].home_axis(  # type: ignore
                                StackerAxis.X, direction
                            )
                            hist = await self.api.attached_modules[  # type: ignore
                                i
                            ]._driver.get_tof_histogram(tof_axis)  # type: ignore
                            for zone, bins_list in hist.bins.items():
                                date = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
                                test_data = self.test_data.copy()
                                test_data["Hash_id"] = str(uuid.uuid4())
                                test_data["Date"] = str(date)
                                test_data["Test"] = self.test_name
                                test_data["Labware_Name"] = self.labware_name
                                test_data["Stacker_SN"] = serial
                                test_data["Axis"] = str(axis.lower())
                                test_data["Platform_Position"] = pos.lower()
                                test_data["Labware_Num_X"] = str(self.labware_amount)
                                test_data["Labware_Num_Z"] = str(self.labware_amount_z)
                                test_data["Sample"] = str(sample)
                                test_data["Zone"] = str(zone)
                                test_data["Time"] = str(elapsed_time)

                                bins_dict = {
                                    index: str(value)
                                    for index, value in enumerate(bins_list)
                                }
                                test_data.update(bins_dict)  # type: ignore
                                test_data_str = self.dict_values_to_line(test_data)
                                for test_file in self.test_files:
                                    if (
                                        self.stackers[i] in test_file
                                        and axis.lower() in test_file
                                        and pos.lower() in test_file
                                    ):
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
        except Exception as e:
            await self.exit()
            raise e
        except KeyboardInterrupt:
            await self.exit()
            print("\nTest Cancelled!")
        finally:
            await self.exit()
            print("\nTest Completed!")


if __name__ == "__main__":
    print("\nFlex Stacker TOF Data Collection\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Stacker_TOF_Data_Collection(
        args.simulate, args.samples, args.interval, args.labware_amount
    )
    asyncio.run(test.run())
