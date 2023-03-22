"""Test Probe."""
from typing import List, Union

from hardware_testing.data import ui
from opentrons_hardware.firmware_bindings.constants import SensorId, NodeId
from opentrons.hardware_control.ot3api import OT3API
from opentrons_hardware.sensors import sensor_driver, sensor_types


from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, Point, GripperProbe


def _get_test_tag(probe: GripperProbe) -> str:
    return f"{probe.name}-probe"

def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in GripperProbe:
        tag = _get_test_tag(p)
        lines.append(CSVLine(tag, [float, float, float, CSVResult]))
    return lines


async def read_once(
    api: OT3API,
    driver: sensor_driver.SensorDriver,
    sensor: sensor_types.CapacitiveSensor,
    timeout: float = 1.0, 
) -> float:
    """Get the capacitance reading from a gripper."""
    if api.is_simulator:
        return 0.0
    data = await driver.read(
        api._backend._messenger, sensor, offset=False, timeout=timeout
    )
    if isinstance(data, sensor_types.SensorDataType):
        return data.to_float()
    raise helpers_ot3.SensorResponseBad("no response from sensor")


async def read_from_sensor(
        api: OT3API,
        driver: sensor_driver.SensorDriver,
        sensor: sensor_types.CapacitiveSensor,
        num_readings: int = 10,
        timeout: float = 1.0) -> float:
    readings: List[float] = []
    while len(readings) != num_readings:
        try:
            r = await read_once(api, driver, sensor)
            readings.append(r)
        except helpers_ot3.SensorResponseBad:
            continue
    return sum(readings) / num_readings

async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = OT3Axis.Z_G
    g_ax = OT3Axis.G
    mount = OT3Mount.GRIPPER

    s_driver = sensor_driver.SensorDriver()

    async def _save_result(tag: str) -> bool:
        result = CSVResult.from_bool(z_aligned)
        report(section, tag, [z_est, z_enc, result])
        return z_aligned

    for probe, sensor_id in zip(GripperProbe, SensorId):
        ui.print_header(f"Probe: {probe}")
        cap_sensor = sensor_types.CapacitiveSensor.build(sensor_id, NodeId.gripper)
        print("homing and grip...")
        api.home([z_ax, g_ax])
        api.grip(15)
        print(f"taking baseline reading for {probe}...")
        no_probe_baseline = await read_from_sensor(api, s_driver, 10)
        print(f"no probe baseline: {no_probe_baseline}")
        if not api.is_simulator:
            ui.get_user_ready(f"place calibration pin in the {probe.name}")
        print(f"taking baseline reading with pin for {probe}...")
        probe_baseline = await read_from_sensor(api, s_driver, 10)
        print(f"no probe baseline: {probe_baseline}")




