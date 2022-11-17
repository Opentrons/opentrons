"""Capacitance Side Test."""
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
    jog_mount_ot3,
)
from opentrons.config.types import (
    CapacitivePassSettings,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Capacitance Gauge Testing')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-i', '--increment', type=float, required=False, help='Probe increment size for X-Axis', default=1)
    arg_parser.add_argument('-p', '--steps', type=int, required=False, help='Number of steps for X-Axis', default=20)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Capacitance_Side_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int, increment: float, steps: int
    ) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.deck_z = None
        self.deck_definition = None
        self.slot_center = None
        self.pipette_id = None
        self.slot = slot
        self.simulate = simulate
        self.cycles = cycles
        self.increment = increment
        self.steps = steps
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.PROBE_LENGTH = 34.5
        self.PROBE_TIP_DIA = 4.0
        self.PROBE_TIP_RAD = self.PROBE_TIP_DIA / 2
        self.CUTOUT_SIZE = 20.0
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.SQUARE_LENGTH = 40.0
        self.SQUARE_HALF = self.SQUARE_LENGTH / 2
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
            sensor_threshold_pf=0.5,
        )
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Step":"None",
            "Slot":"None",
            "Pipette":"None",
            "X Right":"None",
            "X Left":"None",
            "X Center":"None",
            "Y Back":"None",
            "Y Front":"None",
            "Y Center":"None",
            "Deck Height":"None",
            "Capacitance":"None",
            "Current Position":"None",
            "Current Encoder":"None",
        }

    async def test_setup(self):
        self.file_setup()
        self.deck_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        if self.simulate:
            self.pipette_id = "SIM"
        else:
            self.pipette_id = self.api._pipette_handler.get_pipette(self.mount)._pipette_id
        await self.api.add_tip(self.mount, self.PROBE_LENGTH)
        self.test_data["Slot"] = str(self.slot)
        self.test_data["Pipette"] = str(self.pipette_id)
        self.start_time = time.time()
        print(f"\nStarting Test on Deck Slot #{self.slot}:\n")

    def file_setup(self):
        # Create test data file
        self.test_name = "capacitance_side_test"
        self.test_tag = f"slot{self.slot}"
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_path = data.create_folder_for_test_data(self.test_name)
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        data.append_data_to_file(self.test_name, self.test_file, self.test_header)
        print("FILE PATH = ", self.test_path)
        print("FILE NAME = ", self.test_file)

    def deck_setup(self):
        # Initialize deck slot positions
        self.deck_definition = load("ot3_standard", version=3)
        corner = Point(*self.deck_definition["locations"]["orderedSlots"][self.slot - 1]["position"])
        self.center_xy = Point(corner.x + 124.0 / 2, corner.y + 82.0 / 2, 1)
        self.center_z = Point(corner.x + 76, corner.y + 54, 1)
        self.slot_center = self.center_xy

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

    async def _probe_axis(
        self, axis: OT3Axis, target: float
    ) -> float:
        if axis == OT3Axis.by_mount(self.mount):
            settings = self.PROBE_SETTINGS_Z_AXIS
        else:
            settings = self.PROBE_SETTINGS_XY_AXIS
        point = await self.api.capacitive_probe(
            self.mount, axis, target, settings
        )
        return point

    async def _get_stable_capacitance(self) -> float:
        _reading = True
        _try = 1
        while _reading:
            capacitance = []
            for i in range(10):
                if self.simulate:
                    data = 0.0
                else:
                    data = await self.api.capacitive_read(self.mount)
                capacitance.append(data)
            _variance = round(abs(max(capacitance) - min(capacitance)), 5)
            print(f"Try #{_try} Variance = {_variance}")
            _try += 1
            if _variance < 0.1:
                _reading = False
        return sum(capacitance) / len(capacitance)

    async def _measure_capacitance(
        self, api: OT3API, mount: OT3Mount, cycle: int, step: int, next_position: Point, increment: float
    ) -> None:
        # Move to next position
        await api.move_to(mount, next_position, speed=1)
        # await api.move_rel(mount, Point(-increment, 0, 0), speed=1)

        # Get current position and encoder
        current_position = await api.gantry_position(mount)
        encoder_position = await self._get_encoder()
        self.test_data["Current Position"] = str(current_position).replace(", ",";")
        self.test_data["Current Encoder"] = str(encoder_position).replace(", ",";")
        print(f"Current Position = {current_position}")
        print(f"Current Encoder = {encoder_position}")

        # Read capacitance
        capacitance = await self._get_stable_capacitance()
        self.test_data["Capacitance"] = str(capacitance)
        print(f"Capacitance = {capacitance}")

        # Save data to file
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        self.test_data["Step"] = str(step)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_deck(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Move above deck height
        self.home = await api.gantry_position(mount)
        above_point = self.center_z._replace(z=self.home.z)
        await api.move_to(mount, above_point)

        # Probe deck height
        self.deck_z = await self._probe_axis(OT3Axis.by_mount(mount), self.center_z.z)
        print(f"Deck Height = {self.deck_z} mm")
        self.test_data["Deck Height"] = str(round(self.deck_z, 3))

    async def _jog_axis(
        self, api: OT3API, mount: OT3Mount
    ) -> float:
        # Move inside the cutout
        below_z = self.deck_z - 1
        current_position = await api.gantry_position(mount)
        center_xy_above = self.center_xy._replace(z=current_position.z)
        center_xy_below = self.center_xy._replace(z=below_z)
        await api.move_to(mount, center_xy_above, speed=20)
        await api.move_to(mount, center_xy_below, speed=20)

        # Jog gantry to find edge
        jog_position = await jog_mount_ot3(api, mount)
        current_position = await api.gantry_position(mount)
        return current_position

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Move inside the cutout
        below_z = self.deck_z - 1
        current_position = await api.gantry_position(mount)
        center_xy_above = self.center_xy._replace(z=current_position.z)
        center_xy_below = self.center_xy._replace(z=below_z)
        await api.move_to(mount, center_xy_above, speed=20)
        await api.move_to(mount, center_xy_below, speed=20)

        # Probe slot X-Axis right edge
        x_right = await self._probe_axis(OT3Axis.X, self.center_xy.x + self.CUTOUT_HALF)
        print(f"X-Axis right edge = {x_right} mm")
        self.test_data["X Right"] = str(round(x_right, 3))

        # Probe slot X-Axis left edge
        x_left = await self._probe_axis(OT3Axis.X, self.center_xy.x - self.CUTOUT_HALF)
        print(f"X-Axis left edge = {x_left} mm")
        self.test_data["X Left"] = str(round(x_left, 3))

        # Probe slot Y-Axis back edge
        y_back = await self._probe_axis(OT3Axis.Y, self.center_xy.y + self.CUTOUT_HALF)
        print(f"Y-Axis back edge = {y_back} mm")
        self.test_data["Y Back"] = str(round(y_back, 3))

        # Probe slot Y-Axis front edge
        y_front = await self._probe_axis(OT3Axis.Y, self.center_xy.y - self.CUTOUT_HALF)
        print(f"Y-Axis front edge = {y_front} mm")
        self.test_data["Y Front"] = str(round(y_front, 3))

        # Calculate slot center
        x_center = x_left + (x_right - x_left)/2
        y_center = y_front + (y_back - y_front)/2
        self.test_data["X Center"] = str(round(x_center, 3))
        self.test_data["Y Center"] = str(round(y_center, 3))
        self.slot_center = Point(x=x_center, y=y_center, z=self.deck_z)

        # Move to slot center
        await api.move_to(mount, self.slot_center, speed=20)

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
        await home_ot3(api, self.axes)
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
            # Setup test parameters
            await self.test_setup()
            for i in range(self.cycles):
                cycle = i + 1
                print(f"\n-> Starting Cycle {cycle}/{self.cycles}")
                await self._home(self.api, self.mount)
                await self._calibrate_deck(self.api, self.mount)
                z_offset = self.deck_z - 2
                if "y" in input("\n--> Calibrate Slot Center? (y/n): ").lower():
                    await self._calibrate_slot(self.api, self.mount)
                    start_x = 10 - self.PROBE_TIP_RAD
                    start_position = self.slot_center._replace(x=self.slot_center.x + start_x, z=z_offset)
                else:
                    jog_position = await self._jog_axis(self.api, self.mount)
                    start_position = jog_position._replace(z=z_offset)
                    # await self.api.disengage_axes(self.axes)
                    # input("Start?")
                    # await self.api.engage_axes(self.axes)
                for j in range(self.steps):
                    step = j + 1
                    print(f"\n-->> Measuring Step {step}/{self.steps}")
                    next_position = start_position._replace(x=start_position.x - self.increment*(step - 1))
                    if next_position.x >= self.slot_center.x:
                        await self._measure_capacitance(self.api, self.mount, cycle, step, next_position, self.increment)
                    else:
                        break
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
    print("\nOT-3 Capacitance Side Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Capacitance_Side_Test(args.simulate, args.cycles, args.slot, args.increment, args.steps)
    asyncio.run(test.run())
