"""Production QC protocol for Z-stage force testing."""
from dataclasses import dataclass
import logging
from statistics import mean
from threading import Thread
from typing import Dict, List, Optional, Tuple, Union

from opentrons.config import IS_ROBOT
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis, OT3Mount
from opentrons.protocol_api import ParameterContext, ProtocolContext

from opentrons_shared_data.errors.exceptions import MoveConditionNotMetError

from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)
from hardware_testing.drivers.mark10.mark10_fg import Mark10, Mark10Base, SimMark10
from hardware_testing.opentrons_api import helpers_ot3

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.CRITICAL)

metadata = {"protocolName": "z-stage production qc"}
requirements = {"robotType": "Flex", "apiLevel": "2.27"}

FORCE_SPEED = 10
FORCE_MARGIN = 35  # Percentage
FORCE_TEST_LEFT_SETTINGS = [
    {"CURRENT": 0.15, "F_MAX": 39},
    {"CURRENT": 0.2, "F_MAX": 63},
    {"CURRENT": 0.3, "F_MAX": 107},
    {"CURRENT": 0.4, "F_MAX": 148},
    {"CURRENT": 0.5, "F_MAX": 189},
    {"CURRENT": 0.6, "F_MAX": 226},
    {"CURRENT": 0.7, "F_MAX": 259},
    {"CURRENT": 1.4, "F_MAX": 498},
    {"CURRENT": 1.5, "F_MAX": 528},
]
FORCE_TEST_RIGHT_SETTINGS = [
    {"CURRENT": 0.15, "F_MAX": 35},
    {"CURRENT": 0.2, "F_MAX": 57},
    {"CURRENT": 0.3, "F_MAX": 98},
    {"CURRENT": 0.4, "F_MAX": 129},
    {"CURRENT": 0.5, "F_MAX": 168},
    {"CURRENT": 0.6, "F_MAX": 196},
    {"CURRENT": 0.7, "F_MAX": 228},
    {"CURRENT": 1.4, "F_MAX": 410},
    {"CURRENT": 1.5, "F_MAX": 448},
]

ONLY_COUNT_USING_CURRENT_YIELD = True
CYCLES_CURRENT = 5

TEST_LEFT_PARAMETERS: Dict[str, float] = {
    "SPEED": FORCE_SPEED,
    "FORCE_MARGIN": FORCE_MARGIN,
    "CYCLES": CYCLES_CURRENT,
}
TEST_RIGHT_PARAMETERS: Dict[str, float] = {
    "SPEED": FORCE_SPEED,
    "FORCE_MARGIN": FORCE_MARGIN,
    "CYCLES": CYCLES_CURRENT,
}

for setting in FORCE_TEST_LEFT_SETTINGS:
    TEST_LEFT_PARAMETERS[str(setting["CURRENT"])] = setting["F_MAX"]

for setting in FORCE_TEST_RIGHT_SETTINGS:
    TEST_RIGHT_PARAMETERS[str(setting["CURRENT"])] = setting["F_MAX"]

OPERATOR_CHOICES = [
    "Unused",
    "Haiyan",
    "Jiqing",
    "Yanglin",
    "Yangyin",
    "Hejie",
    "Zhihua",
    "Huanjun",
    "Chengkun",
    "Xiongjian",
    "Zhougui",
    "Zhiwei",
    "TE",
]

CURRENT_CHOICES = ["None"] + [
    str(setting["CURRENT"]) for setting in FORCE_TEST_LEFT_SETTINGS
]

thread_sensor = False
force_output: List[float] = []
valid_fail: List[str] = []


async def _move_to_with_axis_current(
    self,  # noqa: ANN001
    mount: OT3Mount,
    abs_position,  # noqa: ANN001
    axis: Axis,
    current: float,
    speed: float,
    expect_stalls: bool,
) -> None:
    async with self._backend.motor_current():
        await self._backend.set_active_current({axis: current})
        await self.move_to(
            mount=mount,
            abs_position=abs_position,
            speed=speed,
            expect_stalls=expect_stalls,
        )


@dataclass
class TestConfig:
    """Runtime config for the Z-stage force test."""

    simulate: bool
    skip_left: bool
    skip_right: bool
    user_current: Optional[float]
    operator: str


def _connect_to_mark10_fixture(simulate: bool) -> Mark10Base:
    """Connect to the force gauge."""
    fixture: Mark10Base
    if simulate:
        fixture = SimMark10()
    else:
        fixture = Mark10.create(port="/dev/ttyUSB0")
    fixture.connect()
    LOG.info(fixture)
    return fixture


def _get_test_tag(current: float) -> str:
    """Get test tag for current data."""
    return f"current-{current}"


def build_test_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build the CSV lines for mount data."""
    mount_data_line: List[Union[CSVLine, CSVLineRepeating]] = [
        CSVLine("TEST_CURRENTS", [str, str, str, str, str])
    ]
    for setting in FORCE_TEST_LEFT_SETTINGS:
        mount_data_line.append(
            CSVLine(
                _get_test_tag(setting["CURRENT"]),
                [float, float, float, float, CSVResult],
            )
        )
    return mount_data_line


def _build_csv_report() -> CSVReport:
    """Build the CSVReport object to record data."""
    return CSVReport(
        test_name="z-stage-test-qc-ot3",
        sections=[
            CSVSection(
                title="TEST_LEFT_PARAMETERS",
                lines=[
                    CSVLine(parameter, [int, CSVResult])
                    for parameter in TEST_LEFT_PARAMETERS
                ],
            ),
            CSVSection(
                title="TEST_RIGHT_PARAMETERS",
                lines=[
                    CSVLine(parameter, [int, CSVResult])
                    for parameter in TEST_RIGHT_PARAMETERS
                ],
            ),
            CSVSection(title=OT3Mount.LEFT.name, lines=build_test_lines()),
            CSVSection(title=OT3Mount.RIGHT.name, lines=build_test_lines()),
        ],
    )


def _record_force(mark10: Mark10Base) -> None:
    """Record force in a separate thread."""
    global thread_sensor
    global force_output
    if mark10.is_simulator():
        force_output.append(0.0)
    try:
        while thread_sensor:
            force_output.append(mark10.read_force())
    except Exception as e:
        thread_sensor = False
        print(e)
    except KeyboardInterrupt:
        thread_sensor = False


def analyze_force(readings: List[float]) -> Tuple[bool, float, float]:
    """Analyze force output from the test to check for pass/fail."""
    LOG.debug(f"analyze_force: {readings}")
    if not readings or readings[0] != 0.0:
        return (False, 0, 0)

    max_force = max(readings)
    print(f"Max Force: {max_force}")
    if max_force <= 0:
        return (False, 0, 0)

    count = 0
    total = 0.0
    for force in readings:
        if force > max_force / 2:
            count += 1
            total += force

    average_force = total / count
    print(f"Average Force: {average_force}")
    return (True, max_force, average_force)


def check_force(
    mount: OT3Mount,
    current: float,
    report: CSVReport,
    average_forces: List[float],
    max_forces: List[float],
    max_pass: float,
) -> bool:
    """Check if the force is within the pass criteria."""
    average_force = round(mean(average_forces), 2)
    max_force = round(mean(max_forces), 2)
    average_force_range = round(max(average_forces) - min(average_forces), 2)
    max_force_range = round(max(max_forces) - min(max_forces), 2)

    lower_limit = max_pass * (100 - FORCE_MARGIN) / 100
    upper_limit = max_pass * (100 + FORCE_MARGIN) / 100
    qc_pass = lower_limit < max_force < upper_limit
    report(
        mount.name,
        _get_test_tag(current),
        [
            max_force,
            max_force_range,
            average_force,
            average_force_range,
            CSVResult.from_bool(qc_pass),
        ],
    )
    return qc_pass


def _force_gauge(
    api: SyncHardwareAPI,
    mount: OT3Mount,
    report: CSVReport,
    cfg: TestConfig,
    ctx: ProtocolContext,
) -> bool:
    """Apply force to the gauge and log."""
    global thread_sensor
    global force_output
    ctx.comment(f"Test Force - Mount {mount.name}")
    mark10 = _connect_to_mark10_fixture(cfg.simulate)
    try:
        ctx.comment(f"Testing {mount.name} Mount")
        z_ax = Axis.by_mount(mount)
        api.home([z_ax])
        home_pos = api.gantry_position(mount)
        pre_test_pos = home_pos._replace(z=home_pos.z - 15)
        press_pos = home_pos._replace(z=pre_test_pos.z - 30)

        qc_pass = True
        report(
            mount.name,
            "TEST_CURRENTS",
            ["MAX", "MAX_RANGE", "AVERAGE", "AVERAGE_RANGE", "RESULT"],
        )
        force_test_setting = (
            FORCE_TEST_LEFT_SETTINGS
            if mount == OT3Mount.LEFT
            else FORCE_TEST_RIGHT_SETTINGS
        )
        for test in force_test_setting:
            max_results: List[float] = []
            avg_results: List[float] = []
            test_current = test["CURRENT"]
            if cfg.user_current is not None and test_current != cfg.user_current:
                continue

            for i in range(CYCLES_CURRENT):
                api.move_to(mount=mount, abs_position=pre_test_pos)
                ctx.comment(f"Cycle {i + 1}: Testing Current = {test_current}")
                if mark10.is_simulator():
                    assert isinstance(mark10, SimMark10)
                    mark10.set_simulation_force(test["F_MAX"])

                thread = Thread(target=_record_force, args=(mark10,))
                thread_sensor = True
                force_output = []
                thread.start()
                try:
                    api._move_to_with_axis_current(
                        mount, press_pos, z_ax, test_current, FORCE_SPEED, True
                    )
                finally:
                    thread_sensor = False
                    thread.join()

                analyzed_valid, analyzed_max, analyzed_avg = analyze_force(force_output)
                if analyzed_valid:
                    max_results.append(analyzed_max)
                    avg_results.append(round(analyzed_avg, 1))
                else:
                    valid_fail.append(mount.name)
                    qc_pass = False
                    ctx.comment(
                        "DATA INVALID - z-stage did not contact or gauge not zeroed"
                    )
                    return False

                api._update_position_estimation([Axis.by_mount(mount)])
                api.refresh_positions()
                api.move_to(mount=mount, abs_position=pre_test_pos)

            if not avg_results or not max_results:
                res = False
            else:
                res = check_force(
                    mount,
                    test_current,
                    report,
                    avg_results,
                    max_results,
                    test["F_MAX"],
                )
            ctx.comment(f"CURRENT: {test_current} - {'PASS' if res else 'FAIL'}")
            if ONLY_COUNT_USING_CURRENT_YIELD:
                if test_current in [0.2, 0.5]:
                    qc_pass = qc_pass and res
            else:
                qc_pass = qc_pass and res

        return qc_pass
    finally:
        mark10.disconnect()


def _run(
    api: SyncHardwareAPI, cfg: TestConfig, report: CSVReport, ctx: ProtocolContext
) -> bool:
    """Run the selected tests."""
    qc_pass = True
    if not cfg.skip_left:
        qc_pass = _force_gauge(api, OT3Mount.LEFT, report, cfg, ctx) and qc_pass
    if not cfg.skip_right:
        qc_pass = _force_gauge(api, OT3Mount.RIGHT, report, cfg, ctx) and qc_pass
    return qc_pass


def _record_test_parameters(report: CSVReport) -> None:
    for key, value in TEST_LEFT_PARAMETERS.items():
        report("TEST_LEFT_PARAMETERS", key, [value, CSVResult.PASS])
    for key, value in TEST_RIGHT_PARAMETERS.items():
        report("TEST_RIGHT_PARAMETERS", key, [value, CSVResult.PASS])


def _home_test_axes(api: SyncHardwareAPI) -> None:
    axes = [Axis.X, Axis.Y, Axis.by_mount(OT3Mount.LEFT), Axis.by_mount(OT3Mount.RIGHT)]
    try:
        api.home(axes)
    except MoveConditionNotMetError:
        api.home(axes)


def add_parameters(parameters: ParameterContext) -> None:
    """Build runtime parameters."""
    parameters.add_str(
        display_name="Operator",
        variable_name="operator",
        default="Unused",
        choices=[{"display_name": name, "value": name} for name in OPERATOR_CHOICES],
        description="Operator for this QC run",
    )
    parameters.add_bool(
        display_name="Skip left",
        variable_name="skip_left",
        default=False,
        description="When this is true the robot will not test the left Z-stage.",
    )
    parameters.add_bool(
        display_name="Skip right",
        variable_name="skip_right",
        default=False,
        description="When this is true the robot will not test the right Z-stage.",
    )
    parameters.add_str(
        display_name="Test current",
        variable_name="user_current",
        default="None",
        choices=[
            {"display_name": current, "value": current} for current in CURRENT_CHOICES
        ],
        description="Current to test. Select None to test all standard currents.",
    )


def _build_config(ctx: ProtocolContext) -> TestConfig:
    args = ctx.params.get_all()
    user_current = (
        None if args["user_current"] == "None" else float(args["user_current"])
    )
    return TestConfig(
        simulate=ctx.is_simulating(),
        skip_left=bool(args["skip_left"]),
        skip_right=bool(args["skip_right"]),
        user_current=user_current,
        operator=str(args["operator"]),
    )


def run(ctx: ProtocolContext) -> None:
    """Entry point into testing protocol."""
    global force_output
    global thread_sensor
    global valid_fail
    if ctx.is_simulating() and IS_ROBOT:
        ctx.comment("on robot analysis, skipping.")
        return

    force_output = []
    thread_sensor = False
    valid_fail = []

    ctx.comment("starting Z-stage QC.")
    OT3API._move_to_with_axis_current = _move_to_with_axis_current  # type: ignore[attr-defined]
    api = ctx._core.get_hardware()
    if ctx.is_simulating():
        api.reset()

    cfg = _build_config(ctx)
    api.set_gantry_load(api.gantry_load)
    report = _build_csv_report()
    helpers_ot3.set_csv_report_meta_data_ot3(
        api,
        report,
        operator=cfg.operator,
        dut=helpers_ot3.DeviceUnderTest.OTHER,
        ctx=ctx,
    )
    _record_test_parameters(report)
    _home_test_axes(api)

    qc_pass = False
    try:
        qc_pass = _run(api, cfg, report, ctx)
        _home_test_axes(api)
    finally:
        if qc_pass:
            ctx.comment("Test Done - PASSED")
        else:
            ctx.comment("Test Done - FAILED")
        if valid_fail:
            ctx.comment("Data Invalid, Please Re-Test This Unit.")
            for item in valid_fail:
                ctx.comment(f"Mount {item} Fail")
        report.save_to_disk()

    if not qc_pass or not report.all_succeded():
        raise RuntimeError("Error during QC run.")
