"""Test Probe."""
from typing import List, Union, Tuple


from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.sensors import sensor_driver, sensor_types

from opentrons.config.types import CapacitivePassSettings
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.backends.ot3controller import OT3Controller
from opentrons.hardware_control.backends.ot3utils import sensor_id_for_instrument


from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point, GripperProbe


TEST_SLOT = 5
PROBE_PREP_HEIGHT_MM = 5
PROBE_POS_OFFSET = Point(13, 13, 0)


def _get_test_tag(probe: GripperProbe) -> str:
    return f"{probe.name}-probe"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in GripperProbe:
        tag = _get_test_tag(p)
        lines.append(CSVLine(tag, [float, float, float, float, float, CSVResult]))
    return lines


async def read_once(
    api: OT3API,
    driver: sensor_driver.SensorDriver,
    sensor: sensor_types.CapacitiveSensor,
    timeout: int = 1,
) -> float:
    """Get the capacitance reading from a gripper."""
    if not api.is_simulator and isinstance(api._backend, OT3Controller):
        data = await driver.read(
            api._backend._messenger, sensor, offset=False, timeout=timeout
        )
        if isinstance(data, sensor_types.SensorDataType):
            return data.to_float()
        raise helpers_ot3.SensorResponseBad("no response from sensor")
    return 0.0


async def _read_from_sensor(
    api: OT3API,
    driver: sensor_driver.SensorDriver,
    sensor: sensor_types.CapacitiveSensor,
    num_readings: int = 10,
) -> float:
    readings: List[float] = []
    while len(readings) != num_readings:
        try:
            r = await read_once(api, driver, sensor)
            readings.append(r)
        except helpers_ot3.SensorResponseBad:
            continue
    return sum(readings) / num_readings


def _get_hover_and_probe_pos(api: OT3API) -> Tuple[Point, Point]:
    probe_pos = helpers_ot3.get_slot_calibration_square_position_ot3(TEST_SLOT)
    probe_pos += PROBE_POS_OFFSET
    hover_pos = probe_pos._replace(z=api.get_instrument_max_height(OT3Mount.GRIPPER))
    return hover_pos, probe_pos


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER

    s_driver = sensor_driver.SensorDriver()
    pass_settings = api.config.calibration.z_offset.pass_settings
    hover_pos, probe_pos = _get_hover_and_probe_pos(api)
    z_limit = probe_pos.z - pass_settings.max_overrun_distance_mm

    async def _save_result(
        tag: str,
        no_probe: float,
        probe: float,
        found: float,
        z_limit: float,
        deck: float,
        valid: bool,
    ) -> None:
        result = CSVResult.from_bool(valid)
        report(section, tag, [no_probe, probe, found, z_limit, deck, result])

    for probe in GripperProbe:
        sensor_id = sensor_id_for_instrument(GripperProbe.to_type(probe))
        ui.print_header(f"Probe: {probe}")
        cap_sensor = sensor_types.CapacitiveSensor.build(sensor_id, NodeId.gripper)
        print("homing and grip...")
        await api.home([z_ax, g_ax])

        # move to position and grip
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
        if not api._gripper_handler.get_gripper().attached_probe:
            api.add_gripper_probe(probe)
        await api.grip(15)

        # take reading for baseline (1)
        no_probe_baseline = 0.0
        if not api.is_simulator:
            no_probe_baseline = await _read_from_sensor(api, s_driver, cap_sensor, 10)
        print(f"baseline without probe: {no_probe_baseline}")

        # take reading for baseline with pin attached (2)
        if not api.is_simulator:
            ui.get_user_ready(f"place calibration pin in the {probe.name}")
        # add pin to update critical point
        probe_baseline = 0.0
        if not api.is_simulator:
            probe_baseline = await _read_from_sensor(api, s_driver, cap_sensor, 10)
        print(f"baseline with probe: {probe_baseline}")

        # begins probing
        if not api.is_simulator:
            ui.get_user_ready("about to probe the deck")
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
        # move to 5 mm above the deck
        await api.move_to(mount, probe_pos._replace(z=PROBE_PREP_HEIGHT_MM))
        z_ax = Axis.by_mount(mount)
        # NOTE: currently there's an issue where the 1st time an instrument
        #       probes, it won't trigger when contacting the deck. However all
        #       following probes work fine. So, here we do a "fake" probe
        #       in case this gripper was just turned on
        await api.capacitive_probe(
            mount,
            z_ax,
            PROBE_PREP_HEIGHT_MM,
            CapacitivePassSettings(
                prep_distance_mm=0.0,
                max_overrun_distance_mm=1.0,
                speed_mm_per_s=2.0,
                sensor_threshold_pf=0.1,
            ),
        )
        found_pos = await api.capacitive_probe(mount, z_ax, probe_pos.z, pass_settings)
        print(f"Found deck height: {found_pos}")

        # check against max overrun
        valid_height = found_pos >= z_limit
        reading_on_deck = 0.0
        if valid_height:
            if not api.is_simulator:
                ui.get_user_ready("about to press into the deck")
            await api.move_to(mount, probe_pos._replace(z=found_pos))
            if not api.is_simulator:
                reading_on_deck = await _read_from_sensor(api, s_driver, cap_sensor, 10)
        print(f"Reading on deck: {reading_on_deck}")

        result = valid_height and reading_on_deck > probe_baseline

        await _save_result(
            _get_test_tag(probe),
            no_probe_baseline,
            probe_baseline,
            found_pos,
            z_limit,
            reading_on_deck,
            result,
        )
        await api.home_z()
        await api.ungrip()

        if not api.is_simulator:
            ui.get_user_ready(f"remove calibration pin in the {probe.name}")
        api.remove_gripper_probe()
