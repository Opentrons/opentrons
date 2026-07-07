"""Age the gripper mount by cycling the Z_G axis."""

from dataclasses import dataclass
from typing import Optional, Tuple

from opentrons.config.defaults_ot3 import DEFAULT_MAX_SPEEDS, DEFAULT_RUN_CURRENT
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.backends.ot3simulator import (
    _sanitize_attached_instrument,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.peripherals import BarcodeScannerModel
from opentrons.hardware_control.types import Axis, OT3AxisKind, OT3AxisMap, OT3Mount
from opentrons.protocol_api import ParameterContext, ProtocolContext
from opentrons.types import Point

from hardware_testing.data import get_git_description
from hardware_testing.data.csv_report import (
    CSVLine,
    CSVLineRepeating,
    CSVReport,
    CSVResult,
    CSVSection,
)
from hardware_testing.opentrons_api import helpers_ot3

metadata = {"protocolName": "Production qc Gripper lifetime"}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

DEFAULT_CYCLES = 5000
SIMULATED_CYCLES = 2
SLOT_MOUNT_TEST = 5
Z_AXIS_TRAVEL_DISTANCE = 150.0
Z_MAX_SKIP_MM = 0.1
DEFAULT_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Z_G]
DEFAULT_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.Z_G]
SPEEDS_TO_TEST = [DEFAULT_SPEED]
MIN_PASS_CURRENT = round(DEFAULT_CURRENT * 0.6, 1)
CURRENTS_SPEEDS = {
    round(MIN_PASS_CURRENT - 0.2, 1): SPEEDS_TO_TEST,
    round(MIN_PASS_CURRENT - 0.1, 1): SPEEDS_TO_TEST,
    MIN_PASS_CURRENT: SPEEDS_TO_TEST,
    DEFAULT_CURRENT: SPEEDS_TO_TEST,
}
REPORT_SAVE_INTERVAL_CYCLES = 100
TEMP_GRIPPER_CODE = "TEMP-GRIPPER-CODE"

LOCALIZE = helpers_ot3.get_system_langauge() == "zh-CN"


@dataclass
class LifetimeConfig:
    """Runtime configuration for gripper lifetime cycling."""

    cycles: int
    current: float
    speed: float


async def _set_active_current(
    self, axis_currents: OT3AxisMap[float]  # noqa: ANN001
) -> None:
    await self._backend.set_active_current(axis_currents)


def _build_float_choices(
    values: list[float], suffix: str
) -> list[dict[str, float | str]]:
    return [
        {"display_name": f"{value:g} {suffix}", "value": value}
        for value in sorted(values)
    ]


def add_parameters(parameters: ParameterContext) -> None:
    """Build the runtime parameters."""
    parameters.add_int(
        display_name="老化次数" if LOCALIZE else "Lifetime cycles",
        variable_name="cycles",
        minimum=1,
        maximum=100000,
        default=DEFAULT_CYCLES,
        unit="cycles",
        description="Number of up/down gripper mount aging cycles.",
    )
    parameters.add_float(
        display_name="Z_G 电流" if LOCALIZE else "Z_G current",
        variable_name="current",
        default=DEFAULT_CURRENT,
        choices=_build_float_choices(list(CURRENTS_SPEEDS.keys()), "A"),
        unit="A",
        description="Z_G run current for gripper mount lifetime cycling.",
    )
    parameters.add_float(
        display_name="Z_G 速度" if LOCALIZE else "Z_G speed",
        variable_name="speed",
        default=DEFAULT_SPEED,
        choices=_build_float_choices(SPEEDS_TO_TEST, "mm/s"),
        unit="mm/s",
        description="Z_G speed for gripper mount lifetime cycling.",
    )
    parameters.add_str(
        display_name="操作员" if LOCALIZE else "Operator",
        variable_name="operator",
        default="Unused",
        choices=[
            {"display_name": name, "value": name}
            for name in [
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
        ],
        description="Operator for this lifetime run.",
    )


def _build_report(cycles: int) -> CSVReport:
    return CSVReport(
        test_name="gripper-lifetime",
        dont_write_to_disk=True,
        sections=[
            CSVSection(
                title="CONFIG",
                lines=[
                    CSVLine("requested-cycles", [int]),
                    CSVLine("executed-cycles", [int]),
                    CSVLine("completed-cycles", [int]),
                    CSVLine("travel-distance-mm", [float]),
                    CSVLine("speed-mm-per-sec", [float]),
                    CSVLine("run-current-amps", [float]),
                    CSVLine("z-max-skip-mm", [float]),
                    CSVLine("result", [CSVResult]),
                ],
            ),
            CSVSection(
                title="MOUNT-LIFETIME",
                lines=[
                    CSVLineRepeating(
                        cycles, "cycle", [int, float, float, float, float, CSVResult]
                    ),
                ],
            ),
        ],
    )


def _set_csv_report_meta_data_without_barcode(
    api: SyncHardwareAPI,
    report: CSVReport,
    operator: str,
    ctx: ProtocolContext,
) -> None:
    report.set_operator(operator)
    report.set_tag(TEMP_GRIPPER_CODE)
    report.set_device_id(TEMP_GRIPPER_CODE, TEMP_GRIPPER_CODE)
    report.set_robot_id(helpers_ot3.get_robot_serial_ot3(api))
    report.set_firmware(api.fw_version)
    report.set_version("simulation" if ctx.is_simulating() else get_git_description())


def _is_z_axis_still_aligned_with_encoder(
    api: SyncHardwareAPI, target_z: float
) -> Tuple[float, bool]:
    enc_pos = api.encoder_current_position_ot3(OT3Mount.GRIPPER)
    z_enc = enc_pos[Axis.Z_G]
    is_aligned = abs(target_z - z_enc) < Z_MAX_SKIP_MM
    return z_enc, is_aligned


def _save_cycle_result(
    report: CSVReport,
    cycle: int,
    start_z: float,
    down_target_z: float,
    down_encoder_z: float,
    up_encoder_z: float,
    passed: bool,
) -> None:
    line = report["MOUNT-LIFETIME"]["cycle"]
    assert isinstance(line, CSVLineRepeating)
    line[cycle - 1].store(
        [
            cycle,
            start_z,
            down_target_z,
            down_encoder_z,
            up_encoder_z,
            CSVResult.from_bool(passed),
        ],
        print_results=False,
    )


def _prepare_mount(api: SyncHardwareAPI) -> None:
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER

    api.home([z_ax, g_ax])
    home_pos = api.gantry_position(mount)
    target_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_MOUNT_TEST)
    target_pos = target_pos._replace(z=home_pos.z)
    helpers_ot3.move_to_arched_ot3_sync(api, mount, target_pos)


def _run_lifetime_cycles(
    api: SyncHardwareAPI,
    report: CSVReport,
    ctx: ProtocolContext,
    config: LifetimeConfig,
) -> int:
    z_ax = Axis.Z_G
    mount = OT3Mount.GRIPPER
    completed_cycles = 0

    api.home([z_ax])
    start_z = api.gantry_position(mount).z

    for cycle in range(1, config.cycles + 1):
        ctx.comment(
            f"老化循环 {cycle}/{config.cycles}"
            if LOCALIZE
            else f"Lifetime cycle {cycle}/{config.cycles}"
        )
        api.move_rel(
            mount,
            Point(z=-Z_AXIS_TRAVEL_DISTANCE),
            speed=config.speed,
            expect_stalls=True,
        )
        down_target_z = start_z - Z_AXIS_TRAVEL_DISTANCE
        down_encoder_z, down_passed = _is_z_axis_still_aligned_with_encoder(
            api, down_target_z
        )

        up_encoder_z = down_encoder_z
        up_passed = False
        if down_passed:
            api.move_rel(
                mount,
                Point(z=Z_AXIS_TRAVEL_DISTANCE),
                speed=config.speed,
                expect_stalls=True,
            )
            up_encoder_z, up_passed = _is_z_axis_still_aligned_with_encoder(
                api, start_z
            )

        cycle_passed = down_passed and up_passed
        if cycle_passed:
            completed_cycles = cycle
        _save_cycle_result(
            report,
            cycle,
            start_z,
            down_target_z,
            down_encoder_z,
            up_encoder_z,
            cycle_passed,
        )
        if cycle % REPORT_SAVE_INTERVAL_CYCLES == 0:
            report.save_to_disk()
        if not cycle_passed and not api.is_simulator:
            ctx.comment(
                f"老化循环 {cycle} 失败" if LOCALIZE else f"Lifetime cycle {cycle} failed."
            )
            report.save_to_disk()
            break

    return completed_cycles


def _store_config(
    report: CSVReport,
    requested_cycles: int,
    executed_cycles: int,
    completed_cycles: int,
    current: float,
    speed: float,
    passed: bool,
) -> None:
    report("CONFIG", "requested-cycles", [requested_cycles])
    report("CONFIG", "executed-cycles", [executed_cycles])
    report("CONFIG", "completed-cycles", [completed_cycles])
    report("CONFIG", "travel-distance-mm", [Z_AXIS_TRAVEL_DISTANCE])
    report("CONFIG", "speed-mm-per-sec", [speed])
    report("CONFIG", "run-current-amps", [current])
    report("CONFIG", "z-max-skip-mm", [Z_MAX_SKIP_MM])
    report("CONFIG", "result", [CSVResult.from_bool(passed)])


def run(ctx: ProtocolContext) -> None:
    """Entry point into gripper mount lifetime protocol."""
    ctx.comment(
        "开始 Gripper mount 老化" if LOCALIZE else "Starting gripper mount lifetime."
    )
    api = ctx._core.get_hardware()
    if ctx.is_simulating():
        sim_backend = api._backend
        sim_backend._attached_instruments = {
            m: _sanitize_attached_instrument(
                m,
                helpers_ot3._create_attached_instruments_dict(
                    gripper="GRPV1120230323A01"
                ).get(m),
            )
            for m in OT3Mount
        }
        api.create_simulating_peripheral(BarcodeScannerModel.BARCODE_SCANNER_V1)
        api.reset()

    OT3API._set_active_current = _set_active_current  # type: ignore[attr-defined]

    requested_cycles = int(ctx.params.cycles)  # type: ignore[attr-defined]
    config = LifetimeConfig(
        cycles=(
            min(requested_cycles, SIMULATED_CYCLES)
            if ctx.is_simulating()
            else requested_cycles
        ),
        current=float(ctx.params.current),  # type: ignore[attr-defined]
        speed=float(ctx.params.speed),  # type: ignore[attr-defined]
    )
    report = _build_report(config.cycles)
    _set_csv_report_meta_data_without_barcode(
        api,
        report,
        operator=ctx.params.operator,  # type: ignore[attr-defined]
        ctx=ctx,
    )

    if config.speed not in CURRENTS_SPEEDS.get(config.current, []):
        raise RuntimeError(
            f"Unsupported gripper lifetime current/speed combination: "
            f"{config.current:g} A, {config.speed:g} mm/s"
        )

    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, Axis.Z_G)
    default_z_current = settings.run_current
    default_z_speed = settings.max_speed
    completed_cycles = 0
    error: Optional[Exception] = None
    try:
        helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
            api, Axis.Z_G, run_current=config.current
        )
        helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
            api, Axis.Z_G, default_max_speed=config.speed
        )
        api._set_active_current({Axis.Z_G: config.current})
        _prepare_mount(api)
        completed_cycles = _run_lifetime_cycles(api, report, ctx, config)
    except Exception as e:
        error = e
    finally:
        helpers_ot3.set_gantry_load_per_axis_current_settings_ot3_sync(
            api, Axis.Z_G, run_current=default_z_current
        )
        helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3_sync(
            api, Axis.Z_G, default_max_speed=default_z_speed
        )
        api.home([Axis.Z_G])

    passed = error is None and completed_cycles == config.cycles
    _store_config(
        report,
        requested_cycles,
        config.cycles,
        completed_cycles,
        config.current,
        config.speed,
        passed,
    )
    report.save_to_disk()
    if error:
        raise error
    if not passed:
        raise RuntimeError("Gripper mount lifetime run failed.")
