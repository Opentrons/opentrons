"""
system_calibration_test.py

This is the script for "System Calibration Test" with OT-3 robot.

Author: Thassyo Pinto
thassyo.pinto@opentrons.com
Last Revision: 10-13-2022
"""
# Import Python modules
import os
import sys
import csv
import time
import asyncio
import argparse
from datetime import datetime
from statistics import mean

# Import Opentrons api
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control import ot3_calibration
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    get_endstop_position_ot3,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 System Calibration Testing')
    arg_parser.add_argument('-t', '--test', type=str, required=False, help='test type, ex: rep = Repeatability, acc = Accuracy', default='acc')
    arg_parser.add_argument('-a', '--axis', choices=['X','Y'], required=False, help='The axis to be tested', default='X')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='The number of cycles to home and measure', default=1)
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Timer:
    def __init__(self):
        self.start_time = None
        self.elapsed_time = None

    def start(self):
        self.start_time = time.perf_counter()

    def elapsed(self):
        self.elapsed_time = time.perf_counter() - self.start_time
        return self.elapsed_time

class System_Calibration_Test:
    def __init__(self):
        self.timer = Timer()
        self.datetime = datetime.now()
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        self.robot = None
        self.cycle = None
        self.endstop = None
        self.block_avg = None
        self.block_length = 354.5
        self.block_max = 360
        self.tip_diameter = 4
        self.gauges = {}
        self.gauge_ports = {
            "Gauge P1":"/dev/ttyUSB0",
            "Gauge P2":"/dev/ttyUSB1",
        }
        self.dict_points = {
            "X":["X1","X2"],
            "Y":["Y1","Y2"],
        }
        self.points = self.dict_points["X"]
        self.calibration_dict = {
            self.mount:{
                "X1":{
                    "origin":Point(363, 30.5, -367),
                    "distance":6.525,
                },
                "X2":{
                    "origin":Point(15, 30.5, -367),
                    "distance":6.635,
                },
            }
        }
        self.test_file = None
        self.test_folder = "results"
        self.test_data = {
            "Time":None,
            "Cycle":None,
            "Speed":None,
            "Mount":None,
            "Pipette":None,
            "P1":None,
            "P2":None,
            "Position P1":None,
            "Position P2":None,
            "Gauge P1":None,
            "Gauge P2":None,
            "Tip Diameter":None,
            "Block Length":None,
            "Block Average":None,
            "Difference":None,
            "Accuracy":None,
        }
        self.create_folder()
        self.create_file()
        self.gauge_setup()

    def create_folder(self):
        path = self.test_folder
        if not os.path.exists(path):
            os.makedirs(path)

    def create_file(self):
        current_datetime = self.datetime.strftime("%m-%d-%y_%H-%M")
        serial_number = "EVT-02" # get_serial_number()
        filename = f"OT3_{serial_number}_{current_datetime}.csv"
        self.test_file = filename

    def gauge_setup(self):
        for key, value in self.gauge_ports.items():
            self.gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
            self.gauges[key].connect()

    async def repeatability_test(self):
        await home_ot3(self.robot, self.axes)
        await self.robot.move_to(mount=self.mount, abs_position=self.endstop)
        await ot3_calibration.find_deck_position(self.robot, self.mount)

    def accuracy_setup(self):
        filename = f"{self.test_folder}/ACC_{self.test_file}"
        print("Test Mode = Accuracy")
        print(f"File Name: {filename}")

        self.tip_diameter = float(input(f"Specify Tip Diameter [mm] (Default = {self.tip_diameter}mm): ") or self.tip_diameter)
        self.block_length = float(input(f"Specify Gauge Block total length [mm] (Default = {self.block_length}mm / L < {self.block_max}mm): ") or self.block_length)
        while self.block_length > self.block_max:
            self.block_length = float(input(f"Too long! [mm] (L < {self.block_max}mm): ") or self.block_length)
        samples = int(input("Specify number of samples for Gauge Block dial measurement (or <ENTER> for pre-calculated value): ") or "0")
        if samples > 0:
            print("\n[Insert Gauge Block between both dial indicators and press <ENTER> to record sample data]")
            block_samples = []
            for i in range(samples):
                if input(f"\n-> Press <ENTER> to measure Gauge Block sample {i+1}") == "":
                    block_p1 = self.gauges["Gauge P1"].read_stable(timeout=20)
                    block_p2 = self.gauges["Gauge P2"].read_stable(timeout=20)
                    block_total = abs(block_p1) + abs(block_p2)
                    print(f"-> Gauge Block sample {i+1}: {self.points[0]} = {block_p1}mm, {self.points[1]} = {block_p2}mm, Total = {block_total}mm")
                    block_samples.append(block_total)
            self.block_avg = round(mean(block_samples), 3)
        else:
            self.block_avg = float(input("Inform Gauge Block total dial displacement: ") or "6.97")
        print(f"\nGauge Block average dial displacement: {self.block_avg}mm")
        print(f"\nGauge Block total length: {self.block_length}mm")

        while True:
            if input("\nRemove Gauge Block and press <ENTER> to start the test") == "":
                break

        self.test_data["Speed"] = "default"
        self.test_data["Mount"] = str(self.mount).split('.')[1]
        self.test_data["Pipette"] = "P50SV4320220729A12"
        self.test_data["Tip Diameter"] = self.tip_diameter
        self.test_data["Block Length"] = self.block_length
        self.test_data["Block Average"] = self.block_avg
        self.test_data["P1"] = self.points[0]
        self.test_data["P2"] = self.points[1]
        return filename

    async def accuracy_test(self):
        filename = self.accuracy_setup()
        with open(filename, 'w') as f:
            test_data = self.test_data.copy()
            log_file = csv.DictWriter(f, test_data)
            log_file.writeheader()
            self.timer.start()
            self.cycle = 0
            for i in range(args.cycles):
                print(f"\nStarting Cycle: {i+1}")
                await self.robot.move_to(mount=self.mount, abs_position=self.endstop)
                await home_ot3(self.robot, self.axes)
                point = self.points[0]

                origin = self.calibration_dict[self.mount][point]["origin"]
                start_position = origin + Point(-10,10,10)
                start_offset = origin._replace(x=origin.x - 5.5)
                current_position = await self.robot.gantry_position(mount=self.mount)
                current_z = current_position.z
                no_z_move = Point(start_position.x, start_position.y, current_z)

                await self.robot.move_to(mount=self.mount, abs_position=no_z_move)
                await self.robot.move_to(mount=self.mount, abs_position=start_position)

                await self.robot.move_to(mount=self.mount, abs_position=start_offset, speed=5)
                await self.robot.move_to(mount=self.mount, abs_position=origin, speed=5)

                position_p1 = await self.robot.gantry_position(mount=self.mount)
                gauge_p1 = self.gauges["Gauge P1"].read_stable(timeout=20)
                # time.sleep(1.0)

                current_position = await self.robot.gantry_position(mount=self.mount)
                end_position = current_position._replace(x=current_position.x - self.block_length)
                end_offset = end_position._replace(x=end_position.x + 10)

                await self.robot.move_to(mount=self.mount, abs_position=end_offset)
                await self.robot.move_to(mount=self.mount, abs_position=end_position, speed=5)

                point = self.points[1]
                position_p2 = await self.robot.gantry_position(mount=self.mount)
                gauge_p2 = self.gauges["Gauge P2"].read_stable(timeout=20)
                # time.sleep(1.0)

                gauge_total = (abs(gauge_p1) + abs(gauge_p2)) - self.tip_diameter
                absolute_error = round(self.block_avg - gauge_total, 3)
                measured = self.block_length - absolute_error
                relative_error = (self.block_length - measured) / self.block_length
                accuracy = round(relative_error*100, 3)

                print("\n*----------------------------------------*")
                print(f"Test Cycle: {i+1}\n")
                print(f"{self.points[0]} = {gauge_p1}mm, {self.points[1]} = {gauge_p2}mm, Tip = {self.tip_diameter}mm, Total = {gauge_total}")
                print(f"Gauge Block Average = {self.block_avg}")
                print(f"Absolute Error = {absolute_error}")
                print(f"Relative Error = {relative_error}")
                print(f"Accuracy = {accuracy}%")
                print("*----------------------------------------*\n")

                test_data["Time"] = round(self.timer.elapsed(), 3)
                test_data["Cycle"] = self.cycle + 1
                test_data["Position P1"] = position_p1
                test_data["Position P2"] = position_p2
                test_data["Gauge P1"] = gauge_p1
                test_data["Gauge P2"] = gauge_p2
                test_data["Difference"] = absolute_error
                test_data["Accuracy"] = accuracy
                log_file.writerow(test_data)
                f.flush()
                self.cycle += 1

            await self.robot.move_to(mount=self.mount, abs_position=self.endstop)
            await home_ot3(self.robot, self.axes)

    async def run(self, is_simulating: bool) -> None:
        try:
            print("\n*** TEST STARTED! ***\n")
            self.robot = await build_async_ot3_hardware_api(is_simulating=is_simulating, use_defaults=True)
            self.endstop = get_endstop_position_ot3(api=self.robot, mount=self.mount)
            if args.test == "rep":
                await self.repeatability_test()
            elif args.test == "acc":
                await self.accuracy_test()
        except Exception as e:
            raise e
        except KeyboardInterrupt:
            print("Test Cancelled!")
        finally:
            print("Test Completed!")

if __name__ == '__main__':
    print("\nOpentrons OT-3 System Calibration Test v1.0\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = System_Calibration_Test()
    asyncio.run(test.run(args.simulate))
