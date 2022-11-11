"""Deck Calibration Repeatability Test."""
import asyncio
import argparse
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    wait_for_stable_capacitance_ot3,
)
from opentrons.config.types import (
    CapacitivePassSettings,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Deck Calibration Repeatability Testing')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Deck_Calibration_Repeatability_Test:
    def __init__(self, simulate: bool, cycles: int, slot: int) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.deck_z = None
        self.deck_definition = None
        self.pipette_id = None
        self.center_xy = None
        self.center_z = None
        self.slot = slot
        self.simulate = simulate
        self.cycles = cycles
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.DIAL_HEIGHT = 67
        self.SAFE_HEIGHT = 10
        self.PROBE_LENGTH = 34.5
        self.PROBE_SETTINGS_Z_AXIS = CapacitivePassSettings(
            prep_distance_mm=5,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        )
        self.test_data ={
            "Time":None,
            "Cycle":None,
            "Z Height":None,
            "Z Position":None,
            "Z Gauge":None,
            "Z Gauge Zero":None,
            "Z Gauge Position":None,
            "Z Gauge Encoder":None,
        }
        self.gauges = {}
        self.gauge_ports = {
            "Gauge Z":"/dev/ttyUSB0",
        }

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        self.deck_definition = load("ot3_standard", version=3)
        await self.api.add_tip(self.mount, self.PROBE_LENGTH)
        self.start_time = time.time()
        print(f"\nStarting Test on Deck Slot #{self.slot}:\n")

    def file_setup(self):
        self.test_name = "deck_calibration_repeatability_test"
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

    async def _get_encoder(self):
        encoder_position = await self.api.encoder_current_position(self.mount)
        encoders = []
        for key in encoder_position:
            encoders.append(round(encoder_position[key], 3))
        return encoders

    def _zero_gauge(self):
        input(f"\nPlace Gauge Block on Deck Slot #{self.slot} and Press ENTER\n")
        _reading = True
        while _reading:
            zeros = []
            for i in range(5):
                z_gauge = self.gauges["Gauge Z"].read_stable(timeout=20)
                zeros.append(z_gauge)
            _variance = abs(max(zeros) - min(zeros))
            print(f"Variance = {_variance}")
            if _variance < 0.1:
                _reading = False
        z_zero = sum(zeros) / len(zeros)
        self.test_data["Z Gauge Zero"] = str(z_zero)
        print(f"Z Gauge Zero = {z_zero}mm")
        input(f"\nRemove Gauge Block from Deck Slot #{self.slot} and Press ENTER\n")

    async def _read_gauge(self):
        # Get position
        current_position = await self.api.gantry_position(self.mount)
        self.test_data["Z Gauge Position"] = str(current_position).replace(", ",";")
        # Get encoder
        encoder_position = await self._get_encoder()
        self.test_data["Z Gauge Encoder"] = str(encoder_position).replace(", ",";")
        # Read gauge
        read = self.gauges["Gauge Z"].read_stable(timeout=20)
        return read

    async def _probe_axis(
        self, axis: OT3Axis, target: float
    ) -> float:
        point = await self.api.capacitive_probe(
            self.mount, axis, target, self.PROBE_SETTINGS_Z_AXIS
        )
        return point

    async def _measure_deck(
        self, api: OT3API, mount: OT3Mount, cycle: int
    ) -> None:
        # Move above gauge
        current_position = await api.gantry_position(mount)
        above_gauge = self.slot_center._replace(z=current_position.z)
        await api.move_to(mount, above_gauge, speed=20)

        # Move to deck height and slot center
        await api.move_to(mount, self.slot_center)

        # Read Z-Axis gauge
        z_gauge = await self._read_gauge()
        self.test_data["Z Gauge"] = str(z_gauge)
        print("Z Gauge Reading = ", self.test_data["Z Gauge"])
        print("Z Gauge Position = ", self.test_data["Z Gauge Position"])
        print("Z Gauge Encoder = ", self.test_data["Z Gauge Encoder"])

        # Save data to file
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

        # Home Z-Axis
        home_z = self.slot_center._replace(z=self.home.z)
        await api.move_to(mount, home_z)

        # Move next to home
        await api.move_to(mount, self.home + Point(x=-5, y=-5, z=0))

    async def _calibrate_deck(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Initialize deck slot position
        corner = Point(*self.deck_definition["locations"]["orderedSlots"][self.slot - 1]["position"])
        self.center_xy = Point(corner.x + 124.0 / 2, corner.y + 82.0 / 2, 1)
        self.center_z = Point(corner.x + 76, corner.y + 54, 1)

        # Home grantry
        await home_ot3(api, self.axes)

        # Move above deck Z-Axis point
        self.home = await api.gantry_position(mount)
        above_point = self.center_z._replace(z=self.home.z)
        await api.move_to(mount, above_point)

        # Probe deck Z-Axis height
        self.deck_z = await self._probe_axis(OT3Axis.by_mount(mount), self.center_z.z)
        print(f"Deck Z-Axis height = {self.deck_z} mm")

        # Update test data
        self.center_z = self.center_z._replace(z=self.deck_z)
        self.slot_center = self.center_xy._replace(z=self.deck_z)
        self.test_data["Z Height"] = str(round(self.deck_z, 3))
        self.test_data["Z Position"] = str(self.center_z).replace(", ",";")

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            self._zero_gauge()
            for i in range(self.cycles):
                cycle = i + 1
                print(f"\n--> Starting Cycle {cycle}/{self.cycles}")
                await self._calibrate_deck(self.api, self.mount)
                await self._measure_deck(self.api, self.mount, cycle)
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
    print("\nOT-3 Deck Calibration Repeatability Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Deck_Calibration_Repeatability_Test(args.simulate, args.cycles, args.slot)
    asyncio.run(test.run())
