"""Capacitance Threshold Test."""
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
)
from opentrons.config.types import (
    CapacitivePassSettings,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Capacitance Gauge Testing')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-x', '--x_increment', type=float, required=False, help='Probe increment size for X-Axis', default=1)
    arg_parser.add_argument('-z', '--z_increment', type=float, required=False, help='Probe increment size for Z-Axis', default=0.1)
    arg_parser.add_argument('-p', '--z_steps', type=int, required=False, help='Number of steps for Z-Axis', default=20)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Capacitance_Threshold_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int, x_increment: float, z_increment: float, z_steps: int
    ) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.deck_z = None
        self.deck_definition = None
        self.total_distance = None
        self.pipette_id = None
        self.slot = slot
        self.simulate = simulate
        self.cycles = cycles
        self.x_increment = x_increment
        self.z_increment = z_increment
        self.z_steps = z_steps
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
        self.test_data ={
            "Time":None,
            "Cycle":None,
            "X Step":None,
            "Z Step":None,
            "Slot":None,
            "Pipette":None,
            "X Right":None,
            "X Left":None,
            "X Center":None,
            "Y Back":None,
            "Y Front":None,
            "Y Center":None,
            "Deck Height":None,
            "Height Start":None,
            "Height End":None,
            "Height Average":None,
            "Capacitance":None,
            "Current Position":None,
            "Current Encoder":None,
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
        self.test_name = "capacitance_threshold_test"
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
        point = await self.api.capacitive_probe(
            self.mount, axis, target, self.PROBE_SETTINGS_Z_AXIS
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

    async def _update_position(
        self, api: OT3API, mount: OT3Mount, next_position: Point
    ) -> None:
        # Move above point
        above_point = next_position._replace(z=5)
        await api.move_to(mount, above_point, speed=1)

        # Move to next position
        await api.move_to(mount, next_position, speed=1)


    async def _measure_capacitance(
        self, api: OT3API, mount: OT3Mount, cycle: int, x_step: int, z_step: int, next_position: Point
    ) -> None:
        # Move to next height
        next_height = next_position._replace(z=self.z_avg + self.z_increment*(z_step - 1))
        await api.move_to(mount, next_height, speed=10)

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
        self.test_data["X Step"] = str(x_step)
        self.test_data["Z Step"] = str(z_step)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_height(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Define start and end positions
        offset = 1.0
        start_position = self.SQUARE_HALF - self.PROBE_TIP_RAD + offset
        end_position = (self.SQUARE_HALF / 2) + (self.PROBE_TIP_RAD / 2)
        self.center_z_start = self.center_xy._replace(x=self.center_xy.x + start_position)
        self.center_z_end = self.center_xy._replace(x=self.center_xy.x + end_position)

        # Move above deck Z-Axis start position
        above_point = self.center_z_start._replace(z=self.home.z)
        await api.move_to(mount, above_point)

        # Probe deck Z-Axis start position
        self.z_start = await self._probe_axis(OT3Axis.by_mount(mount), self.center_z_start.z)
        print(f"Height Start = {self.z_start} mm")
        self.test_data["Height Start"] = str(round(self.z_start, 3))

        # Move above deck Z-Axis end position
        above_point = self.center_z_end._replace(z=self.z_start + 10)
        await api.move_to(mount, above_point)

        # Probe deck Z-Axis end position
        self.z_end = await self._probe_axis(OT3Axis.by_mount(mount), self.center_z_end.z)
        print(f"Height End = {self.z_end} mm")
        self.test_data["Height End"] = str(round(self.z_end, 3))

        # Calculate average height
        self.z_avg = round((self.z_start + self.z_end) / 2, 3)
        print(f"Height Avg = {self.z_avg} mm")
        self.test_data["Height Average"] = str(self.z_avg)

        # Calculate total distance
        self.total_distance = self.center_z_start.x - self.center_z_end.x
        print(f"Total Distance = {self.total_distance} mm")

        # Calculate number of steps
        self.x_steps = int(round(self.total_distance / self.x_increment)) + 1
        print(f"Number of Steps = {self.x_steps}")

        # Update deck height
        self.center_z_start = self.center_z_start._replace(z=self.z_avg)

    async def _calibrate_slot(
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

        # Calculate Slot center
        x_center = x_left + (x_right - x_left)/2
        y_center = y_front + (y_back - y_front)/2
        self.test_data["X Center"] = str(round(x_center, 3))
        self.test_data["Y Center"] = str(round(y_center, 3))
        self.slot_center = Point(x=x_center, y=y_center, z=self.deck_z)

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
            # Home grantry
            await self._home(self.api, self.mount)
            for i in range(self.cycles):
                cycle = i + 1
                print(f"\n-> Starting Cycle {cycle}/{self.cycles}")
                await self._calibrate_slot(self.api, self.mount)
                await self._calibrate_height(self.api, self.mount)
                for j in range(self.x_steps):
                    x_step = j + 1
                    print(f"\n-->> Measuring X Step {x_step}/{self.x_steps}")
                    if x_step < self.x_steps:
                        position = self.center_z_start._replace(x=self.center_z_start.x - self.x_increment*(x_step - 1))
                    else:
                        position = self.center_xy._replace(z=self.z_avg)
                    await self._update_position(self.api, self.mount, position)
                    for k in range(self.z_steps):
                        z_step = k + 1
                        print(f"--->>> Measuring Z Step {z_step}/{self.z_steps}")
                        await self._measure_capacitance(self.api, self.mount, cycle, x_step, z_step, position)
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
    print("\nOT-3 Capacitance Threshold Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Capacitance_Threshold_Test(args.simulate, args.cycles, args.slot, args.x_increment, args.z_increment, args.z_steps)
    asyncio.run(test.run())
