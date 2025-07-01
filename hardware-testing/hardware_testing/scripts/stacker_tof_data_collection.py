"""Flex Stacker TOF Data Collection Script."""

# TODO: Make the output of this match tools/tof-analysis/data/raw_data_frame.csv
import argparse
import asyncio
import subprocess
import re
import time
from datetime import datetime

from hardware_testing import data
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.opentrons_api.types import OT3Mount, Axis
from hardware_testing.opentrons_api.helpers_ot3 import build_async_ot3_hardware_api
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction, TOFSensor


def build_arg_parser():
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
    def __init__(
        self, simulate: bool, samples: int, interval: int, labware_amount: int
    ) -> None:
        self.simulate = simulate
        self.samples = samples
        self.interval = interval
        self.labware_amount = labware_amount
        self.api = None
        self.mount = None
        self.home = None
        self.axes = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
        self.stackers = []
        self.test_files = []
        self.test_data = {
            "Time": "None",
            "Sample": "None",
            "Zone": "None",
        }
        self.tof_axes = {
            "X-Axis": TOFSensor.X,
            "Z-Axis": TOFSensor.Z,
        }
        self.directions = {
            "Retract": Direction.RETRACT,
            "Extend": Direction.EXTEND,
        }

    async def test_setup(self):
        self.api = await build_async_ot3_hardware_api(
            is_simulating=self.simulate, use_defaults=True
        )
        self.mount = OT3Mount.LEFT
        await self.stacker_setup()
        self.file_setup()
        print(f"\n-> Starting Stacker TOF Validation Test!\n")
        self.start_time = time.time()

    async def stacker_setup(self):
        res = subprocess.check_output(["ls", "-la", "/dev"])
        self.port_list = re.findall(r"ot_module_flexstacker[0-9]", res.decode())
        for i in range(len(self.port_list)):
            serial_number = self.api.attached_modules[i].device_info["serial"]
            self.stackers.append(serial_number)

    def file_setup(self):
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

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys())) + "\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values())) + "\n"

    async def read_stacker_tof(self):
        for i in range(len(self.stackers)):
            print(f"\n>> Stacker = {self.stackers[i]}")
            for axis, tof_axis in self.tof_axes.items():
                for pos, direction in self.directions.items():
                    for k in range(self.samples):
                        sample = k + 1
                        print(f">>> Reading {axis} {pos} Sample = {sample}")
                        elapsed_time = (time.time() - self.start_time) / 60
                        await self.api.attached_modules[i].home_axis(
                            StackerAxis.X, direction
                        )
                        hist = await self.api.attached_modules[
                            i
                        ]._driver.get_tof_histogram(tof_axis)
                        for zone, bins_list in hist.bins.items():
                            test_data = self.test_data.copy()
                            test_data["Time"] = str(elapsed_time)
                            test_data["Sample"] = str(sample)
                            test_data["Zone"] = str(zone)
                            bins_dict = {
                                index: str(value)
                                for index, value in enumerate(bins_list)
                            }
                            test_data.update(bins_dict)
                            test_data = self.dict_values_to_line(test_data)
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
                                        data=test_data,
                                    )
                        time.sleep(self.interval)
                print("")

    async def _home(self, api: OT3API, mount: OT3Mount) -> None:
        await api.home()
        self.home = await api.gantry_position(mount)

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
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
