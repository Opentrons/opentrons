"""Perform the robot assembly diagnostics."""

from dataclasses import dataclass
import enum
from typing import Dict, Callable, List, Optional, Union
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.types import Point

from opentrons.config import IS_ROBOT
from opentrons.config.defaults_ot3 import (
    DEFAULT_MAX_SPEEDS,
    DEFAULT_RUN_CURRENT,
)
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import GripperProbe, OT3AxisKind

# ------ TODO remove and move necessary libraries into a standard release library. ----
import importlib
import os
from opentrons.config import infer_config_base_dir
from opentrons import version
import sys


def _download_and_extract(version_str: str, base_dir: str) -> None:
    from urllib.request import urlretrieve
    from zipfile import ZipFile

    zipfile = f"https://github.com/Opentrons/opentrons/archive/refs/tags/v{release}.zip"
    where_to_place = os.path.join(base_dir, "hardware_testing")
    urlretrieve(zipfile, os.path.join(base_dir, "source.zip"))
    zf = ZipFile(os.path.join(base_dir, "source.zip"), "r")
    files = [f for f in zf.namelist() if "hardware_testing" in f and "tests" not in f]
    files = [f for f in files if "py" in f]
    start_path = f"opentrons-{version_str}/hardware-testing/hardware_testing/"
    for f in files:
        dest_name = f.replace(start_path, "")
        dest_file = os.path.join(where_to_place, dest_name)
        dat = zf.read(f)
        os.makedirs(os.path.dirname(dest_file), exist_ok=True)
        out = open(dest_file, "wb")
        out.write(dat)
        out.close()
    with open(os.path.join(where_to_place, "VERSION.txt"), "w") as ver_file:
        ver_file.write(version_str)


if not IS_ROBOT or importlib.util.find_spec("hardware_testing") is None:
    # we're simulating or there is not a vaild hardware-testing yet
    base_dir = str(infer_config_base_dir())
    release = f"{version.replace('a', '-alpha.').replace('b', '-beta.')}"
    version_file_path = os.path.join(base_dir, "hardware_testing", "VERSION.txt")
    if os.path.exists(version_file_path):
        with open(version_file_path, "r") as version_file:
            if version_file.readline() != release:
                _download_and_extract(release, base_dir)
    else:
        _download_and_extract(release, base_dir)
    sys.path.append(base_dir)


# ----- END: TODO ------

from hardware_testing.data.csv_report import (  # noqa: E402
    CSVLineRepeating,
    CSVReport,
    CSVSection,
    CSVResult,
    CSVLine,
)
from hardware_testing.opentrons_api import helpers_ot3  # noqa: E402

metadata = {"protocolName": "Production qc Gripper assembly qc"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

# TEST FORCE CONSTANTS
SLOT_FORCE_GAUGE = 4
GRIP_DUTY_CYCLES: List[int] = [40, 30, 25, 20, 15, 10, 6]
NUM_DUTY_CYCLE_TRIALS = 20
GRIP_FORCES_NEWTON_FORCE: List[int] = [20, 15, 10, 5]
NUM_NEWTONS_TRIALS = 1
FAILURE_THRESHOLD_PERCENTAGES = [20, 20, 20, 40]
WARMUP_SECONDS = 10
FORCE_GAUGE_TRIAL_SAMPLE_INTERVAL = 0.25  # seconds
FORCE_GAUGE_TRIAL_SAMPLE_COUNT = 20  # 20 samples = 5 seconds @ 4Hz
GAUGE_OFFSET = Point(x=2, y=-42, z=75)

# TEST WIDTH CONSTANTS
FAILURE_THRESHOLD_MM = -3
GAUGE_HEIGHT_MM = 75
GRIP_HEIGHT_MM = 48
TEST_WIDTHS_MM: List[float] = [60, 85.75, 62]
SLOT_WIDTH_GAUGE: List[Optional[int]] = [None, 3, 9]
GRIP_FORCES_NEWTON_WIDTH: List[float] = [10, 15, 20]

# TEST MOUNT CONSTANTS
SLOT_MOUNT_TEST = 5
Z_AXIS_TRAVEL_DISTANCE = 150.0
Z_MAX_SKIP_MM = 0.1
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Z_G]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.Z_G]
SPEEDS_TO_TEST = [DEFAULT_SPEED]
MIN_PASS_CURRENT = round(DEFAULT_CURRENT * 0.6, 1)  # 0.67 * 0.6 = ~0.4
CURRENTS_SPEEDS: Dict[float, List[float]] = {
    round(MIN_PASS_CURRENT - 0.2, 1): SPEEDS_TO_TEST,
    round(MIN_PASS_CURRENT - 0.1, 1): SPEEDS_TO_TEST,
    MIN_PASS_CURRENT: SPEEDS_TO_TEST,
    DEFAULT_CURRENT: SPEEDS_TO_TEST,
}

# TEST PROBE CONSTANTS
SLOT_PROBE_TEST = 5
PROBE_PREP_HEIGHT_MM = 5
PROBE_POS_OFFSET = Point(13, 13, 0)
JAW_ALIGNMENT_MM_X = 2.0
JAW_ALIGNMENT_MM_Z = 2.0
PROBE_PF_MAX = 6.0
DECK_PF_MIN = 9.0
DECK_PF_MAX = 15.0

# END CONSTANTS


class TestSection(enum.Enum):
    """Test Section."""

    MOUNT = "MOUNT"
    FORCE = "FORCE"
    WIDTH = "WIDTH"
    PROBE = "PROBE"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]
    increment: bool


def test_mount(api: SyncHardwareAPI, report: CSVReport, section: str) -> None:
    """Test the gripper mount."""
    pass


def test_probe(api: SyncHardwareAPI, report: CSVReport, section: str) -> None:
    """Test the grippers probes."""
    pass


def test_width(api: SyncHardwareAPI, report: CSVReport, section: str) -> None:
    """Test the gripper width."""
    pass


def test_force(api: SyncHardwareAPI, report: CSVReport, section: str) -> None:
    """Test the gripper force."""
    pass


def test_force_increment(api: SyncHardwareAPI, report: CSVReport, section: str) -> None:
    """Test the gripper force increment."""
    pass


TESTS = [
    (
        TestSection.MOUNT,
        test_mount,
    ),
    (
        TestSection.PROBE,
        test_probe,
    ),
    (
        TestSection.WIDTH,
        test_width,
    ),
    (
        TestSection.FORCE,
        test_force,
    ),
]

TESTS_INCREMENT = [
    (
        TestSection.FORCE,
        test_force_increment,  # NOTE: different run method
    ),
]


def build_test_force_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""

    def _get_test_tag(
        trial: int,
        newtons: Optional[int] = None,
        duty_cycle: Optional[int] = None,
    ) -> str:
        if newtons and duty_cycle:
            raise ValueError("must measure either force or duty-cycle, not both")
        if newtons is None and duty_cycle is None:
            raise ValueError("both newtons and duty-cycle are None")
        if newtons is not None:
            return f"newtons-{newtons}-trial-{trial + 1}"
        else:
            return f"duty-cycle-{duty_cycle}-trial-{trial + 1}"

    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for force in GRIP_FORCES_NEWTON_FORCE:
        for trial in range(NUM_NEWTONS_TRIALS):
            tag = _get_test_tag(trial, newtons=force)
            force_data_types = [float] * FORCE_GAUGE_TRIAL_SAMPLE_COUNT
            lines.append(CSVLine(f"{tag}-data", force_data_types))
            lines.append(CSVLine(f"{tag}-average", [float]))
            lines.append(CSVLine(f"{tag}-target", [float]))
            lines.append(CSVLine(f"{tag}-pass-%", [float]))
            lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    for duty_cycle in GRIP_DUTY_CYCLES:
        for trial in range(NUM_DUTY_CYCLE_TRIALS):
            tag = _get_test_tag(trial, duty_cycle=duty_cycle)
            force_data_types = [float] * FORCE_GAUGE_TRIAL_SAMPLE_COUNT
            lines.append(CSVLine(f"{tag}-data", force_data_types))
            lines.append(CSVLine(f"{tag}-average", [float]))
            lines.append(CSVLine(f"{tag}-duty-cycle", [float]))
    return lines


def build_test_mount_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""

    def _get_test_tag(
        current: float, speed: float, direction: str, start_or_end: str
    ) -> str:
        return f"current-{current}-speed-{speed}-{direction}-{start_or_end}"

    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    currents = list(CURRENTS_SPEEDS.keys())
    for current in sorted(currents):
        speeds = CURRENTS_SPEEDS[current]
        for speed in sorted(speeds):
            for dir in ["down", "up"]:
                for step in ["start", "end"]:
                    tag = _get_test_tag(current, speed, dir, step)
                    if current < MIN_PASS_CURRENT:
                        lines.append(CSVLine(tag, [float, float]))
                    else:
                        lines.append(CSVLine(tag, [float, float, CSVResult]))
    return lines


def build_test_probe_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""

    def _get_test_tag(probe: GripperProbe) -> str:
        return f"{probe.name}-probe"

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


def build_test_width_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""

    def _get_test_tag(width: float, force: float) -> str:
        return f"{width}mm-{force}N"

    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for width in TEST_WIDTHS_MM:
        for force in GRIP_FORCES_NEWTON_WIDTH:
            tag = _get_test_tag(width, force)
            lines.append(CSVLine(f"{tag}-force", [float]))
            lines.append(CSVLine(f"{tag}-width", [float]))
            lines.append(CSVLine(f"{tag}-width-actual", [float]))
            lines.append(CSVLine(f"{tag}-width-error", [float]))
            lines.append(CSVLine(f"{tag}-width-error-adjusted", [float]))
            lines.append(CSVLine(f"{tag}-result", [CSVResult]))
    return lines


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.MOUNT.value, lines=build_test_mount_csv_lines()
            ),
            CSVSection(
                title=TestSection.PROBE.value, lines=build_test_probe_csv_lines()
            ),
            CSVSection(
                title=TestSection.WIDTH.value, lines=build_test_width_csv_lines()
            ),
            CSVSection(
                title=TestSection.FORCE.value, lines=build_test_force_csv_lines()
            ),
        ],
    )


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    for s in TestSection:
        parameters.add_bool(
            display_name=f"Skip {s.value.lower()}",
            variable_name=f"skip_{s.value.lower()}",
            default=False,
            description=f"When this is true the robot will not test {s.value.lower()}",
        )

    parameters.add_bool(
        display_name="Increment test",
        variable_name="increment",
        default=False,
        description="When this is true the scanned sku will be inserted into the report.",
    )


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    ctx.comment("starting robot test.")
    test_name = "gripper-assembly-qc-ot3"
    api = ctx._core.get_hardware()
    report = build_report(test_name)
    dut = helpers_ot3.DeviceUnderTest.GRIPPER
    helpers_ot3.set_csv_report_meta_data_ot3(api, report, dut=dut)
    args = ctx.params.get_all()
    t_sections = {s: f for s, f in TESTS if not args[f"skip_{s.value.lower()}"]}
    if args["increment"]:
        t_sections = {s: f for s, f in TESTS_INCREMENT}

    config = TestConfig(
        simulate=ctx.is_simulating(),
        tests=t_sections,
        increment=bool(args["increment"]),
    )

    for section, test_run in config.tests.items():
        test_run(api, report, section.value)

    # SAVE REPORT
    report.save_to_disk()
    report.print_results()
