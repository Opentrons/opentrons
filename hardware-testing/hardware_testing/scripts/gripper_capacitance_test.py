"""Gripper Capacitance Test."""
import asyncio
import argparse
import string
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper_jaw,
    calibrate_gripper,
    find_deck_height,
    _get_calibration_square_position_in_slot,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    get_capacitance_ot3,
)
from opentrons.config.types import (
    CapacitivePassSettings,
)

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Capacitance Test')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-x', '--x_increment', type=float, required=False, help='Probe increment size for X-Axis', default=0.1)
    arg_parser.add_argument('-z', '--z_increment', type=float, required=False, help='Probe increment size for Z-Axis', default=0.01)
    arg_parser.add_argument('-d', '--x_steps', type=int, required=False, help='Number of steps for X-Axis', default=50)
    arg_parser.add_argument('-p', '--z_steps', type=int, required=False, help='Number of steps for Z-Axis', default=200)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Capacitance_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int, x_increment: float, z_increment: float, x_steps: int, z_steps: int
    ) -> None:
        self.simulate = simulate
        self.cycles = cycles
        self.slot = slot
        self.x_increment = x_increment
        self.z_increment = z_increment
        self.x_steps = x_steps
        self.z_steps = z_steps
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.deck_z = None
        self.offset_gripper = None
        self.GRIP_FORCE = 20 # N
        self.START_HEIGHT = 3 # mm
        self.PROBE_DIA = 4 # mm
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.probes = ["Front", "Rear"]
        self.PROBE_SETTINGS = CapacitivePassSettings(
            prep_distance_mm=self.CUTOUT_HALF,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=0.5,
        )
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "X Step":"None",
            "Z Step":"None",
            "Slot":"None",
            "Gripper":"None",
            "Deck Height Front":"None",
            "Deck Height Rear":"None",
            "Edge Position Front":"None",
            "Edge Position Rear":"None",
            "Capacitance":"None",
            "Current Position":"None",
        }
        self.deck_height = {
            "Front":None,
            "Rear":None,
        }
        self.edge = {
            "Front":None,
            "Rear":None,
        }
        self.slot_center = {
            "Front":None,
            "Rear":None,
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        self.edge_settings = self.api.config.calibration.edge_sense
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Slot"] = str(self.slot)
        self.deck_definition = load("ot3_standard", version=3)
        print(f"\nStarting Gripper Capacitance Test!\n")
        self.start_time = time.time()


    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"slot{self.slot}"
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

    def _encoder_tolist(self, encoder_position):
        encoders = []
        for key in encoder_position:
            encoders.append(round(encoder_position[key], 3))
        return encoders

    async def _get_encoder(self):
        encoder_position = await self.api.encoder_current_position(self.mount)
        return self._encoder_tolist(encoder_position)

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _get_stable_capacitance(self) -> float:
        _reading = True
        _try = 1
        while _reading:
            capacitance = []
            for i in range(10):
                if self.simulate:
                    data = 0.0
                else:
                    data = await get_capacitance_ot3(self.api, self.mount)
                capacitance.append(data)
            _variance = round(abs(max(capacitance) - min(capacitance)), 5)
            print(f"Try #{_try} Variance = {_variance}")
            _try += 1
            if _variance < 0.1:
                _reading = False
        return sum(capacitance) / len(capacitance)

    async def _update_position(
        self, api: OT3API, mount: OT3Mount, x_step: int
    ) -> None:
        # Move to next position
        current_position = await api.gantry_position(mount)
        if x_step > 1:
            x_position = current_position.x + self.x_increment
        else:
            x_position = current_position.x
        next_position = current_position._replace(x=x_position, z=self.START_HEIGHT)
        await api.move_to(mount, next_position, speed=1)

    async def _record_capacitance(
        self, api: OT3API, mount: OT3Mount, x_step: int, z_step: int, deck_height: float
    ) -> None:
        # Move to next height
        current_position = await api.gantry_position(mount)
        next_height = current_position._replace(z=deck_height + self.z_increment*(z_step - 1))
        await api.move_to(mount, next_height, speed=1)

        # Get current position
        current_position = await api.gantry_position(mount)
        self.test_data["Current Position"] = str(current_position).replace(", ",";")
        print(f"Current Position = {current_position}")

        # Read capacitance
        capacitance = await self._get_stable_capacitance()
        print(f"Capacitance = {capacitance}")
        self.test_data["Capacitance"] = str(capacitance)

    async def _measure_capacitance(
        self, api: OT3API, mount: OT3Mount, slot: int, cycle: int
    ) -> None:
        nominal_center = _get_calibration_square_position_in_slot(slot)
        for probe in self.probes:
            api.add_gripper_probe(self.gripper_probes[probe])
            deck_height = self.deck_height[probe]
            edge_position = self.edge[probe]._replace(z=deck_height)
            await api.move_to(mount, edge_position)
            input("Press ENTER to exit!")
            for i in range(self.x_steps):
                x_step = i + 1
                self.test_data["X Step"] = str(x_step)
                print(f"\n-->> Measuring X Step {x_step}/{self.x_steps}")
                await self._update_position(self.api, self.mount, x_step)
                for j in range(self.z_steps):
                    z_step = j + 1
                    self.test_data["Z Step"] = str(z_step)
                    print(f"\n--->>> Measuring Z Step {z_step}/{self.z_steps} (X Step {x_step}/{self.x_steps})")
                    await self._record_capacitance(self.api, self.mount, x_step, z_step, deck_height)
                    await self._record_data(cycle)
            current_position = await api.gantry_position(mount)
            home_z = current_position._replace(z=self.home.z)
            await api.move_to(mount, home_z)
            api.remove_gripper_probe()

    async def _get_edge(
        self, api: OT3API, mount: OT3Mount, nominal_center: Point, deck_height: float
    ) -> None:
        # Move inside the cutout
        below_z = deck_height - 2
        current_position = await api.gantry_position(mount)
        slot_center_above = nominal_center._replace(z=current_position.z)
        slot_center_below = nominal_center._replace(z=below_z)
        await api.move_to(mount, slot_center_above, speed=20)
        await api.move_to(mount, slot_center_below, speed=20)

        # Probe slot X-Axis right edge
        x_right = await api.capacitive_probe(mount, OT3Axis.X, nominal_center.x + self.CUTOUT_HALF, self.PROBE_SETTINGS)

        # Return edge position
        current_position = await api.gantry_position(mount)
        edge_position = current_position._replace(x=x_right)
        return edge_position

    async def _calibrate_probe(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate gripper
        for probe in self.probes:
            await api.home_gripper_jaw()
            api.add_gripper_probe(self.gripper_probes[probe])
            await api.grip(self.GRIP_FORCE)
            home = await api.gantry_position(mount)
            nominal_center = _get_calibration_square_position_in_slot(slot)
            self.deck_height[probe] = await find_deck_height(api, mount, nominal_center)
            self.test_data[f"Deck Height {probe}"] = str(self.deck_height[probe])
            print(f"{probe} Probe Deck Height: {self.deck_height[probe]}")
            self.edge[probe] = await self._get_edge(api, mount, nominal_center, self.deck_height[probe])
            self.test_data[f"Edge Position {probe}"] = str(self.edge[probe]).replace(", ",";")
            print(f"{probe} Probe Edge Position: {self.edge[probe]}")
            current_position = await api.gantry_position(mount)
            home_z = current_position._replace(z=home.z)
            await api.move_to(mount, home_z)
            api.remove_gripper_probe()
        input("Press ENTER to exit!")

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
                input(f"Add FRONT and REAR probes to gripper, then press ENTER: ")
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._home(self.api, self.mount)
                    await self._calibrate_probe(self.api, self.mount, self.slot)
                    await self._measure_capacitance(self.api, self.mount, self.slot, cycle)
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
    print("\nOT-3 Gripper Capacitance Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Capacitance_Test(args.simulate, args.cycles, args.slot, args.x_increment, args.z_increment, args.x_steps, args.z_steps)
    asyncio.run(test.run())
