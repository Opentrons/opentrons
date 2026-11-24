"""Gripper-on-Robot Sensor Check."""
import asyncio
import argparse
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import find_calibration_structure_height
from opentrons.hardware_control.types import Axis, GripperProbe, OT3Mount
from opentrons.types import Point
from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
    Z_PREP_OFFSET,
)
from opentrons_hardware.hardware_control.gripper_settings import (
    set_error_tolerance,
)
from hardware_testing import data
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    get_capacitance_ot3,
)

CAPACITANCE_SAMPLES_PER_ATTEMPT = 10
CAPACITANCE_MAX_ATTEMPTS = 10
CAPACITANCE_STABLE_RANGE_PF = 0.1

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper-on-Robot Sensor Check')
    arg_parser.add_argument('-m', '--mode', choices=['force','pwm'], required=False, help='Sets the test mode', default='force')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Sets the number of testing cycles', default=10)
    arg_parser.add_argument('-f', '--force', type=int, required=False, help='Sets the gripper force in Newtons', default=20)
    arg_parser.add_argument('-p', '--pwm', type=int, required=False, help='Sets the gripper PWM duty cycle in percentage', default=25)
    arg_parser.add_argument('-t', '--time', type=int, required=False, help='Sets the gripper hold time in seconds', default=10)
    arg_parser.add_argument('-n', '--part_number', type=str, required=False, help='Sets the gripper part number', default="DVT-00")
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Sets the deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Robot_Sensor_Check:
    def __init__(
        self, simulate: bool, mode: str, cycles: int, force: int, pwm: int, time: float, part_number: str, slot: int
    ) -> None:
        self.simulate = simulate
        self.mode = mode
        self.cycles = cycles
        self.grip_force = force
        self.grip_pwm = pwm
        self.hold_time = time
        self.part_number = part_number
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.cycle = None
        self.nominal_center = None
        self.PREP_OFFSET_DEPTH = Point(*Z_PREP_OFFSET)
        self.axes = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
        self.test_data = {
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Part Number":"None",
            "Serial Number":"None",
            "Input Force":"None",
            "Input PWM":"None",
            "Gripper Probe":"None",
            "Capacitance Air":"None",
            "Capacitance Deck":"None",
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        self.gripper_height = {
            "Front":None,
            "Rear":None,
        }
        self.class_name = self.__class__.__name__

    async def test_setup(self):
        self.file_setup()
        self.api = await build_async_ot3_hardware_api(
            is_simulating=self.simulate, use_defaults=True, gripper="GRPV1120230403A01"
        )
        self.mount = OT3Mount.GRIPPER
        await self.deck_setup()
        await self.instrument_setup()
        print(f"\nStarting Gripper-on-Robot Sensor Check!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        if self.mode == "force":
            self.test_tag = f"force_{self.grip_force}"
            self.test_data["Input Force"] = str(self.grip_force)
        else:
            self.test_tag = f"pwm_{self.grip_pwm}"
            self.test_data["Input PWM"] = str(self.grip_pwm)
        self.test_header = self.dict_keys_to_line(self.test_data)
        self.test_id = data.create_run_id()
        self.test_file = data.create_file_name(self.test_name, self.test_id, self.test_tag)
        test_path = data.append_data_to_file(
            self.test_name, self.test_id, self.test_file, self.test_header
        )
        print("FILE PATH = ", test_path.parent)
        print("FILE NAME = ", self.test_file)

    async def deck_setup(self):
        self.deck_definition = load("ot3_standard", version=3)
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        self.test_data["Slot"] = str(self.slot)

    async def instrument_setup(self):
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
            await set_error_tolerance(self.api._backend._messenger, 15, 15)
        self.test_data["Part Number"] = str(self.part_number)
        self.test_data["Serial Number"] = str(self.gripper_id)
        self.test_data["Input Force"] = str(self.grip_force)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    async def _get_stable_capacitance(
        self, sensor_id: SensorId, measurement: str
    ) -> float:
        for attempt in range(1, CAPACITANCE_MAX_ATTEMPTS + 1):
            capacitance = []
            for _ in range(CAPACITANCE_SAMPLES_PER_ATTEMPT):
                capacitance.append(
                    await get_capacitance_ot3(self.api, self.mount, sensor_id)
                )
            reading_range = round(max(capacitance) - min(capacitance), 5)
            print(
                f"{measurement}: attempt {attempt}/{CAPACITANCE_MAX_ATTEMPTS}, "
                f"range = {reading_range:.5f} pF"
            )
            if reading_range < CAPACITANCE_STABLE_RANGE_PF:
                return sum(capacitance) / len(capacitance)
        raise RuntimeError(
            f"{measurement}: capacitance did not stabilize after "
            f"{CAPACITANCE_MAX_ATTEMPTS} attempts. Last range {reading_range:.5f} pF, "
            f"required less than {CAPACITANCE_STABLE_RANGE_PF} pF."
        )

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_id, self.test_file, test_data)

    async def _read_sensor(
        self, api: OT3API, mount: OT3Mount, probe: GripperProbe, z_height: float
    ) -> None:
        # Move to deck height
        hover_z = api.get_instrument_max_height(mount)
        above_deck_height = self.nominal_center._replace(z=hover_z) + self.PREP_OFFSET_DEPTH
        deck_height = above_deck_height._replace(z=z_height)
        await api.move_to(mount, above_deck_height)
        await api.move_to(mount, deck_height)
        # Read capacitance on deck
        sensor_id = sensor_id_for_instrument(GripperProbe.to_type(probe))
        capacitance = await self._get_stable_capacitance(sensor_id, f"{probe.name} on deck")
        print(f"-->> Capacitance Deck = {capacitance}")
        self.test_data["Capacitance Deck"] = str(capacitance)
        # Home gripper Z-axis
        await api.home_z()
        # Read capacitance on air
        capacitance = await self._get_stable_capacitance(sensor_id, f"{probe.name} in air")
        print(f"-->> Capacitance Air = {capacitance}")
        self.test_data["Capacitance Air"] = str(capacitance)

    async def _calibrate_height(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Move above slot estimated center
        self.nominal_center = self.nominal_center._replace(y=self.nominal_center.y - 3)
        above_slot_center = self.nominal_center._replace(z=self.home.z)
        await api.move_to(mount, above_slot_center)
        await api.grip(self.grip_force)
        # Calibrate gripper
        for position, probe in self.gripper_probes.items():
            await api.home_z()
            input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
            api.add_gripper_probe(probe)
            self.gripper_height[position] = await find_calibration_structure_height(
                api, mount, self.nominal_center, probe=GripperProbe.to_type(probe)
            )
            api.remove_gripper_probe()
        print("Z Height: ", self.gripper_height)
        await api.home_z()
        await api.home_gripper_jaw()

    async def _home_gripper(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await api.home_z(mount)
        await api.home_gripper_jaw()
        await api.home()

    async def exit(self):
        print("\nExiting...")
        if self.api and self.mount:
            await self._home_gripper(self.api, self.mount)
            gripper = self.api._gripper_handler.gripper
            if gripper is not None and gripper.attached_probe is not None:
                self.api.remove_gripper_probe()
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                await self._home_gripper(self.api, self.mount)
                self.home = await self.api.gantry_position(self.mount)
                await self._calibrate_height(self.api, self.mount)
                for position, probe in self.gripper_probes.items():
                    input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
                    self.test_data["Gripper Probe"] = position
                    self.api.add_gripper_probe(probe)
                    await self.api.grip(self.grip_force)
                    z_height = self.gripper_height[position]
                    for i in range(self.cycles):
                        cycle = i + 1
                        print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                        await self._read_sensor(self.api, self.mount, probe, z_height)
                        await self._record_data(cycle)
                        time.sleep(1.0)
                    await self.api.ungrip()
                    self.api.remove_gripper_probe()
        except KeyboardInterrupt:
            print("Test Cancelled!")
            return
        finally:
            await self.exit()
        print("Test Completed!")

if __name__ == '__main__':
    print("\nOT-3 Gripper-on-Robot Sensor Check\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Robot_Sensor_Check(args.simulate, args.mode, args.cycles, args.force, args.pwm, args.time, args.part_number, args.slot)
    asyncio.run(test.run())
