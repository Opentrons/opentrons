"""Gripper Width Slider Test."""
import asyncio
import argparse
import string
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper_jaw,
    calibrate_gripper,
    find_calibration_structure_height,
    _probe_deck_at,
)
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)
from opentrons_hardware.hardware_control.gripper_settings import (
    set_error_tolerance,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, GripperProbe
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Width Slider Test')
    arg_parser.add_argument('-a', '--calibrate', action="store_true", required=False, help='Calibrate gripper')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-f', '--force', type=int, required=False, help='Sets the gripper force in Newtons', default=10)
    arg_parser.add_argument('-w', '--width', type=int, required=False, help='Sets the gripper jaw width', default=72)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Sets the slider slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Width_Slider_Test:
    def __init__(
        self, simulate: bool, calibrate: bool, cycles: int, force: int, width: int, slot: int
    ) -> None:
        self.simulate = simulate
        self.calibrate = calibrate
        self.cycles = cycles
        self.grip_force = force
        self.jaw_width = width
        self.slot = slot
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.y_offset = None
        self.jaw_error = None
        self.jaw_length = None # 94.55 mm
        self.jaw_max = 92 # mm
        self.jaw_min = 60 # mm
        self.jaw_home = 90 # mm
        self.jaw_displacement = (self.jaw_max - self.jaw_width) / 2
        self.slider_thick = 5 # mm
        self.slider_height = 48 # mm
        self.slider_length = 85 # mm
        self.slider_length_half = self.slider_length / 2
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
        self.gripper_axes = [OT3Axis.G, OT3Axis.Z_G]
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Gripper":"None",
            "Y Offset":"None",
            "Slider":"None",
            "Gripper Displacement":"None",
            "Encoder Displacement":"None",
            "Measured Displacement":"None",
            "Gripper Width":"None",
            "Encoder Width":"None",
            "Measured Width":"None",
            "Encoder Error":"None",
            "Measured Error":"None",
            "Jaw Error":"None",
        }
        self.gauges = {}
        self.gauge_ports = {
            # "X":"/dev/ttyUSB0",
            "Y":"/dev/ttyUSB1",
            # "Z":"/dev/ttyUSB2",
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        self.gripper_offsets = {
            "Front":None,
            "Rear":None,
        }

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        await self.deck_setup()
        await self.gripper_setup()
        print(f"\nStarting Gripper Center Test!\n")
        self.start_time = time.time()

    def file_setup(self):
        class_name = self.__class__.__name__
        self.test_name = class_name.lower()
        self.test_tag = f"slot{self.slot}_w{self.jaw_width}"
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

    async def gripper_setup(self):
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data[f"Gripper Width"] = str(self.jaw_width)
        self.test_data[f"Gripper Displacement"] = str(self.jaw_displacement)
        await set_error_tolerance(self.api._backend._messenger, 0.01, 2)

    async def deck_setup(self):
        self.deck_definition = load("ot3_standard", version=3)
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        self.test_data["Slot"] = str(self.slot)

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

    def _get_jaw_displacement(self):
        jaw_displacement = self.api._gripper_handler.gripper.current_jaw_displacement
        return jaw_displacement

    def _get_jaw_width(self):
        jaw_width = self.api._gripper_handler.get_gripper().jaw_width
        return jaw_width

    def _read_gauge(self, axis):
        # Read gauge
        gauge_read = self.gauges[axis].read_stable(timeout=20)
        return gauge_read

    async def _center_slider(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Move to gripper slider height
        gripper_slider = self.nominal_center._replace(z=self.slider_height)
        await api.move_to(mount, gripper_slider)
        time.sleep(1.0)
        # Grip slider
        await api.grip(10)
        time.sleep(2.0)
        self.y_offset = self._read_gauge("Y")
        print(f"-->> Y Offset = {self.y_offset} mm")
        self.test_data[f"Y Offset"] = str(self.y_offset)
        # Ungrip slider
        # await api.ungrip()
        await api.hold_jaw_width(self.jaw_home)
        time.sleep(1.0)

    async def _push_slider(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Move upwards
        current_position = await api.gantry_position(mount)
        slider_position = current_position._replace(z=56)
        await api.move_to(mount, slider_position)
        # Hold gripper jaw width
        await api.hold_jaw_width(self.jaw_width)
        time.sleep(2.0)
        # Measure displacement
        slider = self._read_gauge("Y")
        print(f"-->> Slider = {slider} mm")
        self.test_data[f"Slider"] = str(slider)
        encoder_displacement = round(self._get_jaw_displacement(), 3)
        encoder_width = round(self._get_jaw_width(), 3)
        measured_displacement = round(abs(slider - self.y_offset) + self.slider_gap_half, 3)
        measured_width = round(self.jaw_max - measured_displacement*2, 3)
        encoder_error = round(self.jaw_width - abs(encoder_width), 3)
        measured_error = round(self.jaw_width - abs(measured_width), 3)
        # Show measurements
        print("")
        print(f"--->>> Desired Displacement = {self.jaw_displacement} mm")
        print(f"--->>> Desired Width = {self.jaw_width} mm")
        print(f"--->>> Encoder Displacement = {encoder_displacement} mm")
        print(f"--->>> Encoder Width = {encoder_width} mm")
        print(f"--->>> Measured Displacement = {measured_displacement} mm")
        print(f"--->>> Measured Width = {measured_width} mm")
        print(f"--->>> Encoder Error = {encoder_error} mm")
        print(f"--->>> Measured Error = {measured_error} mm")
        # Save measurements
        self.test_data[f"Encoder Displacement"] = str(encoder_displacement)
        self.test_data[f"Measured Displacement"] = str(measured_displacement)
        self.test_data[f"Encoder Width"] = str(encoder_width)
        self.test_data[f"Measured Width"] = str(measured_width)
        self.test_data[f"Encoder Error"] = str(encoder_error)
        self.test_data[f"Measured Error"] = str(measured_error)
        # Ungrip slider
        # await api.ungrip()
        await api.hold_jaw_width(self.jaw_home)
        time.sleep(1.0)

    async def _reset_slider(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        slider = self._read_gauge("Y")
        print(f"\n(Slider = {slider} mm)")
        print("Resetting Slider...")
        if slider > 0:
            distance = abs(slider + self.y_offset)
            i = round(distance, 3)
            print(f"Pushing Forward! ({i}mm)")
            while slider > 0:
                await api.move_rel(mount, Point(0, -i, 0))
                slider = self._read_gauge("Y")
                i =+ 1
        else:
            distance = self.jaw_length_half + (self.jaw_length_half - (self.slider_thick + (self.jaw_length - self.jaw_width)/2))
            i = round(distance, 3)
            print(f"Pushing Backwards! ({i}mm)")
            while slider < 0:
                await api.move_rel(mount, Point(0, i, 0))
                slider = self._read_gauge("Y")
                i =+ 1

    async def _gripper_error(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Move gripper above slider
        current_position = await api.gantry_position(mount)
        above_staircase = self.nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_staircase)
        # Home gripper jaw only once
        await api.home_gripper_jaw()
        # Close gripper jaw
        await api.grip(self.grip_force)
        time.sleep(1)
        # Measure closed gripper jaw width
        jaw_width = self._get_jaw_width()
        self.jaw_error = round(self.jaw_min - jaw_width, 3)
        self.test_data["Jaw Error"] = str(self.jaw_error)
        print(f"\nClosed Jaw Error = {self.jaw_error} mm (Expected = 60mm / Actual = {jaw_width}mm)\n")
        # Update jaw length
        self.jaw_length = self.jaw_max + self.jaw_error
        self.jaw_length_half = self.jaw_length / 2
        # Update slider gap
        self.slider_gap = self.jaw_length - self.slider_length
        self.slider_gap_half = self.slider_gap / 2
        # Hold gripper jaw width (do not home or ungrip jaw!)
        await api.hold_jaw_width(self.jaw_home)

    async def _measure_gripper_width(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        await self._gripper_error(api, mount)
        await self._center_slider(api, mount)
        await self._push_slider(api, mount)
        await self._reset_slider(api, mount)

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Home gantry
        await api.home()
        # Move above slot estimated center
        nominal_center = Point(*get_calibration_square_position_in_slot(slot))
        current_position = await api.gantry_position(mount)
        above_slot_center = nominal_center._replace(z=current_position.z)
        await api.move_to(mount, above_slot_center)
        # Calibrate gripper
        for position, probe in self.gripper_probes.items():
            await api.home_z()
            input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
            self.gripper_offsets[position] = await calibrate_gripper_jaw(api, probe, slot)

        self.offset = await calibrate_gripper(api, self.gripper_offsets["Front"], self.gripper_offsets["Rear"])

        print(f"New Gripper Offset: {self.offset}")

        await api.home_z()
        input(f"Remove calibration probe, then press ENTER: ")

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home gripper
        await api.home_gripper_jaw()
        await api.home_z()
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
                await self._home(self.api, self.mount)
                if self.calibrate:
                    await self._calibrate_slot(self.api, self.mount, 6)
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    await self._home(self.api, self.mount)
                    await self._measure_gripper_width(self.api, self.mount)
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
    print("\nOT-3 Gripper Width Slider Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Gripper_Width_Slider_Test(args.simulate, args.calibrate, args.cycles, args.force, args.width, args.slot)
    asyncio.run(test.run())
