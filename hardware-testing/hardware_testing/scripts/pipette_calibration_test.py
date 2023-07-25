"""Pipette Calibration Test."""
import asyncio
import argparse
import time

from opentrons_shared_data.deck import load
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_pipette,
    find_calibration_structure_height,
    _probe_deck_at,
)
from opentrons_shared_data.deck import (
    get_calibration_square_position_in_slot,
)
from hardware_testing import data
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point, GantryLoad
from hardware_testing.opentrons_api.helpers_ot3 import (
    home_ot3,
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_per_axis_setting_ot3
)
from opentrons.config.types import (
    CapacitivePassSettings,
)
from hardware_testing.drivers import mitutoyo_digimatic_indicator

import logging

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.INFO)
# logging.getLogger('opentrons.hardware_control.ot3api.OT3API').setLevel(logging.INFO) #tells all movement settings
# logging.getLogger('opentrons_hardware.hardware_control').setLevel(logging.INFO) #confirms speeds are being reduced
logging.getLogger('opentrons.hardware_control.ot3_calibration').setLevel(logging.INFO) #gives calibration data


# loggers = [logging.getLogger(name) for name in logging.root.manager.loggerDict]


def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description='OT-3 Pipette Calibration Test')
    arg_parser.add_argument('-m', '--mount', choices=['l','r'], required=False, help='The pipette mount to be tested', default='l')
    arg_parser.add_argument('-c', '--cycles', type=int, required=False, help='Number of testing cycles', default=1)
    arg_parser.add_argument('-o', '--slot', type=int, required=False, help='Deck slot number', default=5)
    arg_parser.add_argument('-s', '--simulate', action="store_true", required=False, help='Simulate this test script')
    arg_parser.add_argument('-x0', '--xzero', type=float, required=False, help='manual gauge zero for x', default=-1)
    arg_parser.add_argument('-y0', '--yzero', type=float, required=False, help='manual gauge zero for y', default=-1)
    return arg_parser

GAUGE_BLOCK_SIZE = 12 #mm
PROBE_RADIUS = 2.75 #mm

class Pipette_Calibration_Test:
    def __init__(
        self, simulate: bool, cycles: int, slot: int, x_zero: float, y_zero: float
    ) -> None:
        self.api = None
        self.mount = None
        self.home = None
        self.pipette_id = None
        self.deck_definition = None
        self.slot_center = None
        self.nominal_center = None
        self.simulate = simulate
        self.cycles = cycles
        self.slot = slot
        self.z_offset = 25
        self.jog_speed = 10 # mm/s
        self.CUTOUT_SIZE = 20 # mm
        self.CUTOUT_HALF = self.CUTOUT_SIZE / 2
        self.jog_distance = self.CUTOUT_HALF + GAUGE_BLOCK_SIZE # mm
        self.axes = [Axis.X, Axis.Y, Axis.Z]
        self.Z_PREP_OFFSET = Point(x=13, y=13, z=0)
        self.test_data ={
            "Time":"None",
            "Cycle":"None",
            "Slot":"None",
            "Pipette":"None",
            "X Zero":str(x_zero),
            "Y Zero":str(y_zero),
            "Z Zero":"None",
            "X Gauge":"None",
            "Y Gauge":"None",
            "Z Gauge":"None",
            "X Center":"None",
            "Y Center":"None",
            "Deck Height":"None",
        }
        self.gauges = {}
        self.gauge_ports = {
            "X":"/dev/ttyUSB0",
            "Y":"/dev/ttyUSB1",
            # "Z":"/dev/ttyUSB2",
        }
        self.gauge_offsets = {
            "X":Point(x=0, y=0, z=5),
            "Y":Point(x=0, y=0, z=5),
            "Z":Point(x=0, y=0, z=5),
        }

    async def test_setup(self):
        self.file_setup()
        self.gauge_setup()
        self.api = await build_async_ot3_hardware_api(is_simulating=self.simulate,
                                                      pipette_left="p1000_96_v3.4",
                                                      use_defaults=True)
        self.mount = OT3Mount.LEFT if args.mount == "l" else OT3Mount.RIGHT
        self.nominal_center = Point(*get_calibration_square_position_in_slot(self.slot))
        if self.simulate:
            self.pipette_id = "SIMULATION"
        else:
            self.pipette_id = self.api.get_attached_pipettes()[self.mount.to_mount()]['pipette_id']
            # self.pipette_id = self.api._pipette_handler.get_pipette(self.mount)._pipette_id
            # self.pipette_id = 5
        self.deck_definition = load("ot3_standard", version=3)
        self.test_data["Slot"] = str(self.slot)
        self.test_data["Pipette"] = str(self.pipette_id)
        self.start_time = time.time()
        print(f"\nStarting Pipette Calibration Test!\n")

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

    async def _read_gauge(self, axis):
        gauge_encoder = "{} Gauge Encoder".format(axis)
        gauge_position = self.slot_center + self.gauge_offsets[axis]

        if axis == "X":
            # jog_position = gauge_position._replace(x=gauge_position.x - self.jog_distance) #X to the left
            jog_position = gauge_position._replace(x=gauge_position.x + self.jog_distance) #X to the right
            LOG.info(f"{axis}: gauge_position: {gauge_position.x}")
            LOG.info(f"{axis}: jog_position: {jog_position}")
        elif axis == "Y":
            # jog_position = gauge_position._replace(y=gauge_position.y + self.jog_distance) #Y to back
            jog_position = gauge_position._replace(y=gauge_position.y - self.jog_distance) #Y to front
            LOG.info(f"{axis}: gauge_position: {gauge_position.y}")
            LOG.info(f"{axis}: jog_position: {jog_position}")
        elif axis == "Z":
            jog_position = self.slot_center

        # Move to gauge position
        await self.api.move_to(self.mount, gauge_position, speed=20)
        slot_encoder = await self.api.encoder_current_position_ot3(mount=self.mount, refresh=True)
        LOG.info(f"{axis}: slot encoder position: {slot_encoder}")
        # Move to jog position
        await self.api.move_to(self.mount, jog_position, speed=self.jog_speed)
        # if axis == "X":
        #     tmp = self.jog_distance
        #     while tmp > 0:
        #         tmp = tmp - 2
        #         await self.api.move_rel(mount=self.mount,
        #                                 delta=Point(x=2),
        #                                 speed=self.jog_speed) #X to the right
        # elif axis == "Y":
        #     tmp = self.jog_distance
        #     while tmp > 0:
        #         tmp = tmp - 2
        #         await self.api.move_rel(mount=self.mount,
        #                                 delta=Point(y=-2),
        #                                 speed=self.jog_speed) #Y to front
        # Read gauge
        gauge = self.gauges[axis].read_stable(timeout=20)
        gauge_encoder = await self.api.encoder_current_position_ot3(mount=self.mount, refresh=True)
        LOG.info(f"{axis}: gauge encoder position: {gauge_encoder}")

        # Return to gauge position
        await self.api.move_to(self.mount, gauge_position, speed=20)

        # delete
        # for i in range(9):
        #     if axis == "X":
        #         jog_position = gauge_position._replace(x=gauge_position.x - 20)
        #         LOG.info(f"{axis}: gauge_position: {gauge_position.x}")
        #         LOG.info(f"{axis}: jog_position: {jog_position}")
        #     elif axis == "Y":
        #         jog_position = gauge_position._replace(y=gauge_position.y + 20)
        #         LOG.info(f"{axis}: gauge_position: {gauge_position.y}")
        #         LOG.info(f"{axis}: jog_position: {jog_position}")
        #     elif axis == "Z":
        #         jog_position = self.slot_center
        #
        #     # Move to gauge position
        #     await self.api.move_to(self.mount, gauge_position, speed=20)
        #     # Move to jog position
        #     await self.api.move_to(self.mount, jog_position, speed=self.jog_speed)
        #     slot_encoder = await self.api.encoder_current_position_ot3(mount=self.mount, refresh=True)
        #     LOG.info(f"{axis}: slot encoder position: {slot_encoder}")
        #     # Read gauge
        #     gauge_int = self.gauges[axis].read_stable(timeout=20)
        #     print(gauge_int)
        #
        #     if axis == "X":
        #         jog_position = gauge_position._replace(x=gauge_position.x - (20 + i))
        #         LOG.info(f"{axis}: gauge_position: {gauge_position.x}")
        #         LOG.info(f"{axis}: jog_position: {jog_position}")
        #     elif axis == "Y":
        #         jog_position = gauge_position._replace(y=gauge_position.y + (20 + i))
        #         LOG.info(f"{axis}: gauge_position: {gauge_position.y}")
        #         LOG.info(f"{axis}: jog_position: {jog_position}")
        #
        #     # Move to jog position
        #     await self.api.move_to(self.mount, jog_position, speed=self.jog_speed)
        #     gauge_encoder = await self.api.encoder_current_position_ot3(mount=self.mount, refresh=True)
        #     LOG.info(f"{axis}: gauge encoder position: {gauge_encoder}")
        #
        #     gauge_fin = self.gauges[axis].read_stable(timeout=20)
        #     print(gauge_fin)
        #     print(f"{axis} - Dist: {i}")
        #     movement = float(gauge_fin) - float(gauge_int)
        #     print(f"Move: {movement}, Error:{movement-i}")
        #     # Return to gauge position
        #     await self.api.move_to(self.mount, gauge_position, speed=20)
        #
        # gauge = 0
        # delete

        return gauge

    def _zero_gauges(self):
        print(f"\nPlace Gauge Block on Deck Slot #{self.slot}")
        for axis in self.gauges:
            gauge_zero = "{} Zero".format(axis)
            if float(self.test_data[gauge_zero]) == -1:
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
            else:
                print(f"{axis} Gauge Zero = {self.test_data[gauge_zero]}mm")

    async def _measure_gauges(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Add calibration tip
        await api.add_tip(mount, api.config.calibration.probe_length)
        # Move up
        current_pos = await api.gantry_position(mount)
        z_offset = current_pos + self.gauge_offsets["Z"]
        await api.move_to(mount, z_offset, speed=20)
        # Move above slot center
        above_slot_center = self.slot_center + self.gauge_offsets["Z"]
        await api.move_to(mount, above_slot_center, speed=20)
        # Measure X-axis gauge
        if "X" in self.gauge_ports:
            print("Measuring X Gauge...")
            x_gauge = await self._read_gauge("X")
            self.test_data["X Gauge"] = str(x_gauge)
            print(f"X Gauge = ", self.test_data["X Gauge"])
        # Measure Y-axis gauge
        if "Y" in self.gauge_ports:
            print("Measuring Y Gauge...")
            y_gauge = await self._read_gauge("Y")
            self.test_data["Y Gauge"] = str(y_gauge)
            print(f"Y Gauge = ", self.test_data["Y Gauge"])
        # Measure Z-axis gauge
        if "Z" in self.gauge_ports:
            print("Measuring Z Gauge...")
            z_gauge = await self._read_gauge("Z")
            self.test_data["Z Gauge"] = str(z_gauge)
            print(f"Z Gauge = ", self.test_data["Z Gauge"])
        # Remove tip
        await api.remove_tip(mount)

    async def _record_data(self, cycle):
        elapsed_time = (time.time() - self.start_time)/60
        self.test_data["Time"] = str(round(elapsed_time, 3))
        self.test_data["Cycle"] = str(cycle)
        test_data = self.dict_values_to_line(self.test_data)
        data.append_data_to_file(self.test_name, self.test_file, test_data)

    async def _calibrate_probe(
        self, api: OT3API, mount: OT3Mount, slot: int, nominal_center: Point
    ) -> None:
        # Add calibration tip
        await api.add_tip(mount, api.config.calibration.probe_length)
        home = await api.gantry_position(mount)
        self.deck_height = await find_calibration_structure_height(api, mount, nominal_center)
        self.slot_center = self.nominal_center._replace(z=self.deck_height)
        self.test_data["Deck Height"] = str(self.deck_height)
        print(f"Deck Height: {self.deck_height}")
        # Remove calibration tip
        await api.remove_tip(mount)

    async def _calibrate_slot(
        self, api: OT3API, mount: OT3Mount, slot: int
    ) -> None:
        # Calibrate pipette
        # returns offset = nominal_center - found_center
        self.offset = await calibrate_pipette(api, mount, slot)
        self.slot_center = self.nominal_center - self.offset


        print(f"Nominal Slot Center: {self.nominal_center}")
        print(f"New Slot Center: {self.slot_center}")
        print(f"New Pipette Offset: {self.offset}")

        self.test_data["X Center"] = str(self.slot_center.x)
        self.test_data["Y Center"] = str(self.slot_center.y)
        self.test_data["Deck Height"] = str(self.slot_center.z)

    def _convert_position_to_str(self, position):
        return str(position).replace(", ",";")

    async def _home(
        self, api: OT3API, mount: OT3Mount
    ) -> None:
        # Home grantry
        # await home_ot3(api, self.axes)
        await self.api.home()
        self.home = await api.gantry_position(mount)

    async def exit(self):
        if self.api:
            await self.api.disengage_axes(self.axes)

    async def run(self) -> None:
        try:
            await self.test_setup()
            if self.api and self.mount:
                await self.api.home()
                if len(self.gauges) > 0:
                    self._zero_gauges()
                for i in range(self.cycles):
                    cycle = i + 1
                    print(f"\n-> Starting Test Cycle {cycle}/{self.cycles}")
                    self.slot_center = self.nominal_center
                    await self._home(self.api, self.mount)

                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.X,
                    #     load=GantryLoad.LOW_THROUGHPUT,
                    #     value=20
                    # )
                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.Y,
                    #     load=GantryLoad.LOW_THROUGHPUT,
                    #     value=20
                    # )
                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.X,
                    #     load=GantryLoad.HIGH_THROUGHPUT,
                    #     value=20
                    # )
                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.Y,
                    #     load=GantryLoad.HIGH_THROUGHPUT,
                    #     value=20
                    # )

                    await self._calibrate_slot(self.api, self.mount, self.slot)
                    if len(self.gauges) > 0:
                        await self._measure_gauges(self.api, self.mount)
                        for axis in self.gauges:
                            gauge_zero_key = "{} Zero".format(axis)
                            gauge_key = "{} Gauge".format(axis)
                            gauge_zero = float(self.test_data[gauge_zero_key])
                            gauge_result = float(self.test_data[gauge_key])
                            print(f"{axis} Error: {gauge_result - gauge_zero - PROBE_RADIUS}")

                    await self._record_data(cycle)

                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.X,
                    #     load=GantryLoad.LOW_THROUGHPUT,
                    #     value=300
                    # )
                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.Y,
                    #     load=GantryLoad.LOW_THROUGHPUT,
                    #     value=300
                    # )
                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.X,
                    #     load=GantryLoad.HIGH_THROUGHPUT,
                    #     value=300
                    # )
                    # set_gantry_per_axis_setting_ot3(
                    #     settings=self.api.config.motion_settings.default_max_speed,
                    #     axis=Axis.Y,
                    #     load=GantryLoad.HIGH_THROUGHPUT,
                    #     value=300
                    # )
        except Exception as e:
            await self.exit()
            raise e
        except KeyboardInterrupt:
            await self.exit()
            print("Test Cancelled!")
        finally:
            print(f"{self.test_path}/{self.test_file}")
            await self.exit()
            print("Test Completed!")

if __name__ == '__main__':
    print("\nOT-3 Pipette Calibration Test\n")
    arg_parser = build_arg_parser()
    args = arg_parser.parse_args()
    test = Pipette_Calibration_Test(args.simulate, args.cycles, args.slot,
                                    args.xzero, args.yzero)
    asyncio.run(test.run())
