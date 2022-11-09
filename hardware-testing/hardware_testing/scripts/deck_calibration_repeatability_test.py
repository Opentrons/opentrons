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

class Calibration_Repeatability_Test:
    def __init__(self, simulate: bool, cycles: int, slot: int) -> None:
        self.api = None
        self.mount = None
        self.slot = slot
        self.simulate = simulate
        self.cycles = cycles
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.DIAL_HEIGHT = 67
        self.SAFE_HEIGHT = 10
        self.PROBE_LENGTH = 34.5
        self.CUTOUT_SIZE = 20
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.PROBE_SETTINGS_Z_AXIS = CapacitivePassSettings(
            prep_distance_mm=5,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        )
        self.PROBE_SETTINGS_XY_AXIS = CapacitivePassSettings(
            prep_distance_mm=self.CUTOUT_HALF,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=1.0,
        )
        self.test_data ={
            "Time":None,
            "Cycle":None,
            "Z Height":None,
            "X Right":None,
            "X Left":None,
            "X Center":None,
            "Y Back":None,
            "Y Front":None,
            "Y Center":None,
            "X Gauge":None,
            "Y Gauge":None,
            "X Gauge Encoder":None,
            "Y Gauge Encoder":None,
            "Slot Center Encoder":None,
            "Slot Center Position":None,
        }
        self.HOME = None
        self.SLOT_CENTER = None
        self.gauges = {}
        self.gauge_ports = {
            "Gauge X":"/dev/ttyUSB0",
            "Gauge Y":"/dev/ttyUSB1",
            # "Gauge Z":"/dev/ttyUSB2",
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
        self.test_name = "calibration_repeatability_test"
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

    async def _read_gauge(self, start_position):
        # Get current position
        current_position = await self.api.gantry_position(self.mount)
        # Move to start position
        await self.api.move_to(self.mount, start_position, speed=100)
        # Jog gauge
        if current_position.x != start_position.x:
            gauge = self.gauges["Gauge X"]
            encoder = "X Gauge Encoder"
            jog_position = start_position._replace(x=start_position.x - 10)
        elif current_position.y != start_position.y:
            gauge = self.gauges["Gauge Y"]
            encoder = "Y Gauge Encoder"
            jog_position = start_position._replace(y=start_position.y - 10)
        elif current_position.z != start_position.z:
            gauge = self.gauges["Gauge Z"]
            encoder = "Z Gauge Encoder"
            jog_position = start_position._replace(z=start_position.z - 10)
        await self.api.move_to(self.mount, jog_position, speed=10)
        encoder_position = await self._get_encoder()
        self.test_data[encoder] = str(encoder_position).replace(", ",";")

        # Read gauge
        read = gauge.read_stable(timeout=20)
        await self.api.move_to(self.mount, current_position, speed=100)
        return read

    async def _probe_axis(
        self, axis: OT3Axis, target: float
    ) -> float:
        if axis == OT3Axis.by_mount(self.mount):
            settings = self.PROBE_SETTINGS_Z_AXIS
        else:
            settings = self.PROBE_SETTINGS_XY_AXIS
        # await wait_for_stable_capacitance_ot3(
        #     self.api, self.mount, threshold_pf=0.1, duration=1.0
        # )
        point = await self.api.capacitive_probe(
            self.mount, axis, target, settings
        )
        return point

    async def _measure_sequence(
        self, api: OT3API, mount: OT3Mount, cycle: int
    ) -> None:
        # Move to slot center
        await api.move_to(mount, self.SLOT_CENTER, speed=20)

        # Move to measure position
        measure_position = self.SLOT_CENTER._replace(z=self.DIAL_HEIGHT)
        await api.move_to(mount, measure_position)
        encoder_position = await self._get_encoder()
        slot_position = await api.gantry_position(mount)
        self.test_data["Slot Center Encoder"] = str(encoder_position).replace(", ",";")
        self.test_data["Slot Center Position"] = str(slot_position).replace(", ",";")
        print("SLOT ENCODER = ", self.test_data["Slot Center Encoder"])
        print("SLOT POSITION = ", self.test_data["Slot Center Position"])

        # Read X-Axis gauge
        x_start = measure_position._replace(x=measure_position.x - 35)
        x_gauge = await self._read_gauge(x_start)
        self.test_data["X Gauge"] = str(x_gauge)
        print("X GAUGE = ", self.test_data["X Gauge"])

        # Read Y-Axis gauge
        y_start = measure_position._replace(y=measure_position.y - 28)
        y_gauge = await self._read_gauge(y_start)
        self.test_data["Y Gauge"] = str(y_gauge)
        print("Y GAUGE = ", self.test_data["Y Gauge"])

        # Save data to file
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

        # Home Z-Axis
        home_z = self.SLOT_CENTER._replace(z=self.HOME.z)
        await api.move_to(mount, home_z)

        # Move next to home
        await api.move_to(mount, self.HOME + Point(x=-5, y=-5, z=0))

    async def _calibrate(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Initialize deck slot position
        CORNER = Point(*self.deck_definition["locations"]["orderedSlots"][self.slot - 1]["position"])
        self.CENTER_XY = Point(CORNER.x + 124.0 / 2, CORNER.y + 82.0 / 2, 50)
        self.CENTER_Z = Point(CORNER.x + 76, CORNER.y + 54, 100)

        # Home grantry
        await home_ot3(api, self.axes)

        # Move above deck Z-Axis point
        self.HOME = await api.gantry_position(mount)
        above_point = self.CENTER_Z._replace(z=self.HOME.z)
        await api.move_to(mount, above_point)

        # Probe deck Z-Axis height
        deck_z = await self._probe_axis(OT3Axis.by_mount(mount), self.CENTER_Z.z)
        print(f"Deck Z-Axis height = {deck_z} mm")
        self.test_data["Z Height"] = str(round(deck_z, 3))

        self.SLOT_CENTER = self.CENTER_XY._replace(z=deck_z)

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            for i in range(self.cycles):
                cycle = i + 1
                print(f"\n--> Starting Cycle {cycle}/{self.cycles}")
                await self._calibrate(self.api, self.mount)
                await self._measure_sequence(self.api, self.mount, cycle)
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
    test = Calibration_Repeatability_Test(args.simulate, args.cycles, args.slot)
    asyncio.run(test.run())
