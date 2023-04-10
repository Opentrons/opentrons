"""Gripper Threshold Test."""
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
    _probe_deck_at,
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
from opentrons_hardware.firmware_bindings.constants import SensorId
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Gripper Threshold Test')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-t', '--trials', type=int, required=False, help='Number of measuring trials', default=10)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-p', '--probe', choices=['front','rear','both'], required=False, help='The gripper probe to be tested', default='both')
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    return arg_parser

class Gripper_Threshold_Test:
    def __init__(
        self, simulate: bool, cycles: int, trials: int, slot: int, probes
    ) -> None:
        self.simulate = simulate
        self.cycles = cycles
        self.trials = trials
        self.slot = slot
        self.probes = probes
        self.api = None
        self.mount = None
        self.home = None
        self.gripper_id = None
        self.deck_definition = None
        self.deck_height = None
        self.nominal_center = None
        self.jog_step_forward = 0.1
        self.jog_step_backward = -0.01
        self.jog_speed = 10 # mm/s
        self.GRIP_FORCE = 20 # N
        self.START_HEIGHT = 3 # mm
        self.PROBE_DIA = 4 # mm
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.axes = [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R]
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
        self.Z_PREP_OFFSET = Point(x=13, y=13, z=0)
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Trial":"None",
            "Slot":"None",
            "Gripper":"None",
            "Probe":"None",
            "Z Gauge":"None",
            "Z Zero":"None",
            "Deck Height":"None",
            "Threshold":"None",
            "Current Position":"None",
        }
        self.gauges = {}
        self.gauge_ports = {
            # "X":"/dev/ttyUSB0",
            # "Y":"/dev/ttyUSB1",
            "Z":"/dev/ttyUSB2",
        }
        self.gauge_offsets = {
            "X":Point(x=5, y=-5, z=9),
            "Y":Point(x=-5, y=-5, z=9),
            "Z":Point(x=0, y=0, z=9),
        }
        self.gripper_probes = {
            "Front":GripperProbe.FRONT,
            "Rear":GripperProbe.REAR,
        }
        self.thresholds = [1.0, 2.0, 3.0, 4.0, 5.0]

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate, use_defaults=True)
        self.mount = OT3Mount.GRIPPER
        self.nominal_center = _get_calibration_square_position_in_slot(self.slot)
        if self.simulate:
            self.gripper_id = "SIMULATION"
        else:
            self.gripper_id = self.api._gripper_handler.get_gripper().gripper_id
        self.test_data["Gripper"] = str(self.gripper_id)
        self.test_data["Slot"] = str(self.slot)
        self.deck_definition = load("ot3_standard", version=3)
        self.start_time = time.time()
        print(f"\nStarting Test on Deck Slot #{self.slot}:\n")

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

    def gauge_setup(self):
        for key, value in self.gauge_ports.items():
            self.gauges[key] = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port=value)
            self.gauges[key].connect()

    def dict_keys_to_line(self, dict):
        return str.join(",", list(dict.keys()))+"\n"

    def dict_values_to_line(self, dict):
        return str.join(",", list(dict.values()))+"\n"

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

    async def _read_gauge(self, axis):
        # current_position = await self.api.gantry_position(self.mount)
        gauge_position = self.nominal_center + self.gauge_offsets[axis]
        if axis == "X":
            jog_position = gauge_position._replace(x=current_position.x + step)
        elif axis == "Y":
            jog_position = gauge_position._replace(y=current_position.y - step)
        elif axis == "Z":
            jog_position = self.nominal_center._replace(z=self.deck_height)
        # Move to gauge position
        await self.api.move_to(self.mount, gauge_position, speed=10)
        # Move to jog position
        await self.api.move_to(self.mount, jog_position, speed=self.jog_speed)
        # Read gauge
        gauge = self.gauges[axis].read_stable(timeout=20)
        # Get current position
        current_position = await self.api.gantry_position(self.mount)
        self.test_data["Current Position"] = str(current_position).replace(", ",";")
        print(f"Current Position = {current_position}")
        # Return to gauge position
        await self.api.move_to(self.mount, gauge_position, speed=10)
        return gauge

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

    def _record_data(self, cycle, trial, threshold):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        self.test_data["Trial"] = str(trial)
        self.test_data["Threshold"] = str(threshold)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    def _update_threshold(
        self, threshold: float
    ) -> None:
        self.PROBE_SETTINGS_Z_AXIS = CapacitivePassSettings(
            prep_distance_mm=5,
            max_overrun_distance_mm=5,
            speed_mm_per_s=1,
            sensor_threshold_pf=threshold,
        )

    async def _measure_gauge(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Move up
        current_pos = await api.gantry_position(mount)
        z_offset = current_pos + self.gauge_offsets["Z"]
        await api.move_to(mount, z_offset, speed=10)
        # Move above slot center
        above_slot_center = self.nominal_center + self.gauge_offsets["Z"]
        await api.move_to(mount, above_slot_center, speed=10)
        # Measure Z-axis gauge
        print("Measuring Z Gauge...")
        z_gauge = await self._read_gauge("Z")
        self.test_data["Z Gauge"] = str(z_gauge)
        print(f"Z Gauge = ", self.test_data["Z Gauge"])
        api.remove_gripper_probe()

    async def _get_deck_height(
        self, api: OT3API, mount: OT3Mount, nominal_center: Point
    ) -> float:
        z_pass_settings = self.PROBE_SETTINGS_Z_AXIS
        z_prep_point = nominal_center + self.Z_PREP_OFFSET
        deck_z = await _probe_deck_at(api, mount, z_prep_point, z_pass_settings)
        return deck_z

    async def _calibrate_probe(
        self, api: OT3API, mount: OT3Mount, slot: int, nominal_center: Point, gripper_probe
    ) -> None:
        # Calibrate gripper probe
        await api.home_gripper_jaw()
        api.add_gripper_probe(gripper_probe)
        await api.grip(self.GRIP_FORCE)
        home = await api.gantry_position(mount)
        self.deck_height = await self._get_deck_height(api, mount, nominal_center)
        self.test_data["Deck Height"] = str(self.deck_height)
        print(f"Deck Height: {self.deck_height}")

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
                input(f"Add FRONT and REAR Calibration Probes to gripper, then press ENTER: ")
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    for probe in self.probes:
                        self.test_data["Probe"] = probe
                        gripper_probe = self.gripper_probes[probe]
                        for j in range(len(self.thresholds)):
                            threshold = self.thresholds[j]
                            self._update_threshold(threshold)
                            print(f"\nUpdated Z Threshold to {self.PROBE_SETTINGS_Z_AXIS.sensor_threshold_pf} pF!")
                            await self._home(self.api, self.mount)
                            for k in range(self.trials):
                                trial = k + 1
                                print(f"\n-->> Measuring Trial {trial}/{self.trials} (Threshold = {threshold})")
                                await self._calibrate_probe(self.api, self.mount, self.slot, self.nominal_center, gripper_probe)
                                await self._measure_gauge(self.api, self.mount, self.slot)
                                self._record_data(cycle, trial, threshold)
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
    print("\nOT-3 Gripper Threshold Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    probes = []
    if args.probe == 'both':
        probes.append("Front")
        probes.append("Rear")
    elif args.probe == 'front':
        probes.append("Front")
    elif args.probe == 'rear':
        probes.append("Rear")
    test = Gripper_Threshold_Test(args.simulate, args.cycles, args.trials, args.slot, probes)
    asyncio.run(test.run())
