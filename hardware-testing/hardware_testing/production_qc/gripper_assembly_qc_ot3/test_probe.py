"""Test Probe."""
from typing import List, Union, Tuple


from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.sensors import sensor_driver, sensor_types

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper,
    calibrate_gripper_jaw,
)
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
JAW_ALIGNMENT_MM_X = 0.5
JAW_ALIGNMENT_MM_Z = 0.5
PROBE_PF_MAX = 6.0
DECK_PF_MIN = 9.0
DECK_PF_MAX = 15.0


def _get_test_tag(probe: GripperProbe) -> str:
    return f"{probe.name}-probe"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in GripperProbe:
        tag = _get_test_tag(p)
        lines.append(CSVLine(f"{tag}-open-air-pf", [float]))
        lines.append(CSVLine(f"{tag}-probe-pf", [float]))
        lines.append(CSVLine(f"{tag}-probe-pf-max-allowed", [float]))
        lines.append(CSVLine(f"{tag}-deck-pf", [float]))
        lines.append(CSVLine(f"{tag}-deck-pf-min-max-allowed", [float, float]))
        lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    for p in GripperProbe:
        lines.append(CSVLine(f"jaw-probe-{p.name.lower()}-xyz", [float, float, float]))
    for axis in ["x", "z"]:
        lines.append(CSVLine(f"jaw-alignment-{axis}-spec", [float]))
        lines.append(CSVLine(f"jaw-alignment-{axis}-actual", [float]))
        lines.append(CSVLine(f"jaw-alignment-{axis}-result", [CSVResult]))
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

    for probe in GripperProbe:
        sensor_id = sensor_id_for_instrument(GripperProbe.to_type(probe))
        ui.print_header(f"Capacitive: {probe.name}")
        cap_sensor = sensor_types.CapacitiveSensor.build(sensor_id, NodeId.gripper)
        print("homing and grip...")
        await api.home([z_ax, g_ax])

        # move to position and grip
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
        if not api._gripper_handler.get_gripper().attached_probe:
            api.add_gripper_probe(probe)
        await api.grip(15)

        # take reading for baseline (1)
        open_air_pf = 0.0
        if not api.is_simulator:
            open_air_pf = await _read_from_sensor(api, s_driver, cap_sensor, 10)
        print(f"baseline without probe: {open_air_pf}")

        # take reading for baseline with pin attached (2)
        if not api.is_simulator:
            ui.get_user_ready(f"place calibration pin in the {probe.name}")
        # add pin to update critical point
        probe_pf = 0.0
        if not api.is_simulator:
            probe_pf = await _read_from_sensor(api, s_driver, cap_sensor, 10)
        print(f"baseline with probe: {probe_pf}")

        # begins probing
        if not api.is_simulator:
            ui.get_user_ready("about to probe the deck")
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
        # move to 5 mm above the deck
        await api.move_to(mount, probe_pos._replace(z=PROBE_PREP_HEIGHT_MM))
        z_ax = Axis.by_mount(mount)
        found_pos = await api.capacitive_probe(mount, z_ax, probe_pos.z, pass_settings)
        print(f"Found deck height: {found_pos}")

        # check against max overrun
        valid_height = found_pos >= z_limit
        deck_pf = 0.0
        if valid_height:
            if not api.is_simulator:
                ui.get_user_ready("about to press into the deck")
            await api.move_to(mount, probe_pos._replace(z=found_pos))
            if not api.is_simulator:
                deck_pf = await _read_from_sensor(api, s_driver, cap_sensor, 10)
        print(f"Reading on deck: {deck_pf}")

        result = (
            open_air_pf < probe_pf < PROBE_PF_MAX < DECK_PF_MIN < deck_pf < DECK_PF_MAX
        )
        _tag = _get_test_tag(probe)
        report(section, f"{_tag}-open-air-pf", [open_air_pf])
        report(section, f"{_tag}-probe-pf", [probe_pf])
        report(section, f"{_tag}-probe-pf-max-allowed", [PROBE_PF_MAX])
        report(section, f"{_tag}-deck-pf", [deck_pf])
        report(section, f"{_tag}-deck-pf-min-max-allowed", [DECK_PF_MIN, DECK_PF_MAX])
        report(section, f"{_tag}-result", [CSVResult.from_bool(result)])
        await api.home_z()
        await api.ungrip()

        if not api.is_simulator:
            ui.get_user_ready(f"remove calibration pin in the {probe.name}")
        api.remove_gripper_probe()

    async def _calibrate_jaw(_p: GripperProbe) -> Point:
        ui.print_header(f"Probe Deck: {_p.name}")
        await api.retract(OT3Mount.GRIPPER)
        if not api.is_simulator:
            ui.get_user_ready(f"attach probe to {_p.name}")
        if api.is_simulator:
            ret = Point(x=0, y=0, z=0)
        else:
            ret = await calibrate_gripper_jaw(api, _p)
        await api.retract(OT3Mount.GRIPPER)
        if not api.is_simulator:
            ui.get_user_ready(f"remove probe from {_p.name}")
        report(section, f"jaw-probe-{_p.name.lower()}-xyz", [ret.x, ret.y, ret.z])
        return ret

    _offsets = {probe: await _calibrate_jaw(probe) for probe in GripperProbe}
    _diff_x = abs(_offsets[GripperProbe.FRONT].x - _offsets[GripperProbe.REAR].x)
    _diff_z = abs(_offsets[GripperProbe.FRONT].z - _offsets[GripperProbe.REAR].z)
    _offset = await calibrate_gripper(
        api,
        offset_front=_offsets[GripperProbe.FRONT],
        offset_rear=_offsets[GripperProbe.REAR],
    )
    print(f"front offset: {_offsets[GripperProbe.FRONT]}")
    print(f"rear offset: {_offsets[GripperProbe.REAR]}")
    print(f"average offset: {_offset}")
    report(section, "jaw-alignment-x-spec", [JAW_ALIGNMENT_MM_X])
    report(section, "jaw-alignment-x-actual", [_diff_x])
    report(
        section,
        "jaw-alignment-x-result",
        [CSVResult.from_bool(_diff_x <= JAW_ALIGNMENT_MM_X)],
    )
    report(section, "jaw-alignment-z-spec", [JAW_ALIGNMENT_MM_Z])
    report(section, "jaw-alignment-z-actual", [_diff_z])
    report(
        section,
        "jaw-alignment-z-result",
        [CSVResult.from_bool(_diff_z <= JAW_ALIGNMENT_MM_Z)],
    )
    await api.retract(OT3Mount.GRIPPER)
