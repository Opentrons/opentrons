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

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Labware Test')
    arg_parser.add_argument('-p', '--probe', choices=['front','rear'], required=False, help='The gripper probe position to be tested', default='front')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Labware_Test:
    def __init__(
        self, simulate: bool, probe: string, cycles: int, slot: int
    ) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.slot_center = None
        self.deck_encoder = None
        self.deck_z = None
        self.simulate = simulate
        self.probe = probe
        self.cycles = cycles
        self.slot = slot
        self.jog_speed = 10 # mm/s
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "X Gauge":"None",
            "Y Gauge":"None",
            "Z Gauge":"None",
            "X Zero":"None",
            "Y Zero":"None",
            "Z Zero":"None",
            "X Center":"None",
            "Y Center":"None",
            "Deck Height":"None",
        }
        self.gauges = {}
        self.gauge_ports = {
            # "X":"/dev/ttyUSB0",
            # "Y":"/dev/ttyUSB1",
            # "Z":"/dev/ttyUSB2",
        }
        self.gauge_offsets_front = {
            "X":Point(x=0, y=-5, z=6),
            "Y":Point(x=-5, y=0, z=6),
            "Z":Point(x=0, y=0, z=6),
        }
        self.gauge_offsets_rear = {
            "X":Point(x=0, y=5, z=6),
            "Y":Point(x=5, y=0, z=6),
            "Z":Point(x=0, y=0, z=6),
        }
        if self.probe == 'front':
            self.gripper_probe = GripperProbe.FRONT
        else:
            self.gripper_probe = GripperProbe.REAR

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Slot"] = str(self.slot)
        self.deck_definition = load("ot3_standard", version=3)
        print(f"\nStarting Gripper Labware Test on {self.probe.upper()} Probe!\n")
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

    def gauge_setup(self):
        for key, value in self.gauge_ports.items():
            self.gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
            self.gauges[key].connect()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _encoder_tolist(self, encoder_position):
        encoders = []
        for key in encoder_position:
            encoders.append(round(encoder_position[key], 3))
        return encoders

    async def _get_encoder(self):
        encoder_position = await self.api.encoder_current_position(self.mount)
        return self._encoder_tolist(encoder_position)

    async def _read_gauge(self, axis):
        gauge_encoder = "{} Gauge Encoder".format(axis)
        if self.probe == 'front':
            gauge_position = self.slot_center + self.gauge_offsets_front[axis]
        else:
            gauge_position = self.slot_center + self.gauge_offsets_rear[axis]
        if axis == "X":
            if self.probe == 'front':
                jog_position = gauge_position._replace(x=gauge_position.x + self.CUTOUT_HALF)
            else:
                jog_position = gauge_position._replace(x=gauge_position.x - self.CUTOUT_HALF)
        elif axis == "Y":
            if self.probe == 'front':
                jog_position = gauge_position._replace(y=gauge_position.y - self.CUTOUT_HALF)
            else:
                jog_position = gauge_position._replace(y=gauge_position.y + self.CUTOUT_HALF)
        elif axis == "Z":
            jog_position = self.slot_center
        # Move to gauge position
        await self.api.move_to(self.mount, gauge_position, speed=100)
        # Move to jog position
        await self.api.move_to(self.mount, jog_position, speed=self.jog_speed)
        # Read gauge
        gauge = self.gauges[axis].read_stable(timeout=20)
        # Return to gauge position
        await self.api.move_to(self.mount, gauge_position, speed=100)
        return gauge

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

    async def _measure_gauges(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Add gripper probe
        api.add_gripper_probe(self.gripper_probe)
        # Move up
        current_pos = await api.gantry_position(mount)
        z_offset = current_pos + self.gauge_offsets_front["Z"]
        await api.move_to(mount, z_offset, speed=20)
        # Move above slot center
        above_slot_center = self.slot_center + self.gauge_offsets_front["Z"]
        await api.move_to(mount, above_slot_center, speed=20)
        # Measure X-axis gauge
        print("Measuring X Gauge...")
        x_gauge = await self._read_gauge("X")
        self.test_data["X Gauge"] = str(x_gauge)
        print(f"X Gauge = ", self.test_data["X Gauge"])
        # Measure Y-axis gauge
        print("Measuring Y Gauge...")
        y_gauge = await self._read_gauge("Y")
        self.test_data["Y Gauge"] = str(y_gauge)
        print(f"Y Gauge = ", self.test_data["Y Gauge"])
        # Measure Z-axis gauge
        print("Measuring Z Gauge...")
        z_gauge = await self._read_gauge("Z")
        self.test_data["Z Gauge"] = str(z_gauge)
        print(f"Z Gauge = ", self.test_data["Z Gauge"])
        # Remove gripper probe
        api.remove_gripper_probe()

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
        await api.home_gripper_jaw()
        self.offset, self.slot_center = await calibrate_gripper_jaw(api, self.gripper_probe, slot)

        print(f"New Slot Center: {self.slot_center}")
        print(f"New Gripper Offset: {self.offset}")

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
                if len(self.gauges) > 0:
                    self._zero_gauges()
                input(f"Add probe to gripper {self.probe.upper()}, then press ENTER: ")
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._home(self.api, self.mount)
                    await self._calibrate_slot(self.api, self.mount, self.slot)
                    if len(self.gauges) > 0:
                        await self._measure_gauges(self.api, self.mount)
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
