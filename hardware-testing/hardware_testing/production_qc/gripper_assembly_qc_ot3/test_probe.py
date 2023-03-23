"""Test Probe."""
from typing import List, Union, Dict

from hardware_testing.data import ui
from opentrons.config.types import CapacitivePassSettings
from opentrons_hardware.firmware_bindings.constants import SensorId
from opentrons.hardware_control.ot3api import OT3API


from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Axis, OT3Mount, GripperProbe


PROBE_DISTANCE_MM = 50.0
PROBE_SETTINGS = CapacitivePassSettings(
    prep_distance_mm=PROBE_DISTANCE_MM,
    max_overrun_distance_mm=0.0,
    speed_mm_per_s=10.0,
    sensor_threshold_pf=1.0,
)
CAPACITANCE_TESTS: Dict[str, List[float]] = {
    "open-air": [0.0, 100.0],
    "probe": [0.0, 100.0],
    "square": [0.0, 100.0],
    "sync": [1.0, PROBE_DISTANCE_MM - 1.0],
}


def _get_test_tag(probe: GripperProbe, test_name: str) -> str:
    return f"{probe.name.lower()}-{test_name}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for p in GripperProbe:
        for cap_test in CAPACITANCE_TESTS.keys():
            tag = _get_test_tag(p, cap_test)
            lines.append(CSVLine(tag, [float, float, float, CSVResult]))
    return lines


def _user_prompt_on_start(api: OT3API, test: str, probe: GripperProbe) -> None:
    if test == "open-air":
        pass
    elif test == "probe":
        if not api.is_simulator:
            ui.get_user_ready(f"attach {probe.name.upper()} probe")
        api.add_gripper_probe(probe)
    elif test == "square":
        if not api.is_simulator:
            ui.get_user_ready(f"touch probe with {probe.name.upper()}")
    elif test == "sync":
        if not api.is_simulator:
            ui.get_user_ready("about to probe DOWN, get ready to touch")


def _user_prompt_on_end(api: OT3API, test: str) -> None:
    if test == "open-air":
        pass
    elif test == "probe":
        pass
    elif test == "square":
        pass
    elif test == "sync":
        if not api.is_simulator:
            ui.get_user_ready("remove PROBE from gripper")
        api.remove_gripper_probe()


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    await api.grip(20)
    for probe in GripperProbe:
        for test, threshold in CAPACITANCE_TESTS.items():
            ui.print_header(f"{probe.name.upper()} PROBE - {test.upper()}")
            _user_prompt_on_start(api, test, probe)
            if test == "sync":
                start_pos = await api.gantry_position(OT3Mount.GRIPPER)
                target_z = start_pos.z - PROBE_DISTANCE_MM
                end_z = await api.capacitive_probe(
                    OT3Mount.GRIPPER, OT3Axis.Z_G, target_z, PROBE_SETTINGS
                )
                _val = start_pos.z - end_z
            else:
                _sensor = SensorId.S0 if probe == GripperProbe.FRONT else SensorId.S1
                _val = await helpers_ot3.get_capacitance_ot3(
                    api, OT3Mount.GRIPPER, _sensor
                )
            _result = CSVResult.from_bool(threshold[0] <= _val <= threshold[1])
            _tag = _get_test_tag(probe, test)
            print(f"{_tag}: {_val} ({_result})")
            report(
                section,
                _get_test_tag(probe, test),
                [threshold[0], threshold[1], _val, _result],
            )
            _user_prompt_on_end(api, test)
    await api.ungrip()
