"""Test Gantry."""
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import types, helpers_ot3
from hardware_testing.opentrons_api.types import Axis
from hardware_testing.data import ui


GANTRY_AXES = [types.Axis.X, types.Axis.Y, types.Axis.Z_L, types.Axis.Z_R]

# NOTE: max travel distances are from EVT robot extents document
MAX_TRAVEL = {Axis.X: 537.49, Axis.Y: 405.815, Axis.Z_L: 215, Axis.Z_R: 215}
COLLISION_AVOID_MARGIN = {Axis.X: 0, Axis.Y: 0, Axis.Z_L: 0, Axis.Z_R: 0}
ALIGNMENT_THRESHOLD_MM = 0.2
CURRENT_PERCENTAGE = 0.66

GANTRY_POS_AS_LIST = [float, float, float, float]

GANTRY_TESTS = [
    "home-start",
    "x-max",
    "x-min",
    "y-max",
    "y-min",
    "zl-max",
    "zl-min",
    "zr-max",
    "zr-min",
    "home-end",
]


@dataclass
class AxisStatus:
    """Axis Status."""

    estimate: Dict[Axis, float]
    encoder: Dict[Axis, float]
    aligned: bool

    def as_lists(self) -> Tuple[List[float], List[float]]:
        """As lists."""
        est = [self.estimate[ax] for ax in GANTRY_AXES]
        enc = [self.encoder[ax] for ax in GANTRY_AXES]
        return est, enc

    @property
    def result(self) -> CSVResult:
        """Result."""
        return CSVResult.PASS if self.aligned else CSVResult.FAIL


async def _read_gantry_position_and_check_alignment(
    api: OT3API, aligned_axis: Optional[Axis]
) -> AxisStatus:
    await api.refresh_positions()
    if not api.is_simulator:
        estimate = {ax: api._current_position[ax] for ax in GANTRY_AXES}
        encoder = {ax: api._encoder_position[ax] for ax in GANTRY_AXES}
    else:
        estimate = {ax: 200.0 for ax in GANTRY_AXES}
        encoder = {ax: 200.0 for ax in GANTRY_AXES}
    # NOTE: DVT2.0 firmware's Z encoders are backwards,
    #       so the absolute encoder position moves in the opposite direction.
    #       For reference, we can know a DVT2.0 firmware Z-Stages passes
    #       if it's "max" encoder value is read close to 468.475
    # FIXME: switch to expected behavior once FW bug is resolved
    all_aligned_axes = [
        ax
        for ax in GANTRY_AXES
        if abs(estimate[ax] - encoder[ax]) <= ALIGNMENT_THRESHOLD_MM
    ]
    if not aligned_axis:
        aligned = len(all_aligned_axes) == len(GANTRY_AXES)
    elif aligned_axis in all_aligned_axes:
        aligned = True
    else:
        aligned = False
    return AxisStatus(estimate=estimate, encoder=encoder, aligned=aligned)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    lines.append(CSVLine("run-currents", GANTRY_POS_AS_LIST))
    for t in GANTRY_TESTS:
        lines.append(CSVLine(f"{t}-estimate", GANTRY_POS_AS_LIST))
        lines.append(CSVLine(f"{t}-encoder", GANTRY_POS_AS_LIST))
        lines.append(CSVLine(f"{t}-aligned", [CSVResult]))
    return lines


async def _record_test_status(
    test: str,
    api: OT3API,
    report: CSVReport,
    section: str,
    axis: Optional[Axis] = None,
) -> None:
    if test not in GANTRY_TESTS:
        raise ValueError(f"unexpected gantry test: {test}")
    status = await _read_gantry_position_and_check_alignment(api, axis)
    if "min" in test and "z" in test:
        status.aligned = True  # TODO: remove once DVT@2.0 FW bug is fixed
    estimate, encoder = status.as_lists()
    print(f"estimate: {estimate}, encoder: {encoder}")
    report(section, f"{test}-estimate", estimate)
    report(section, f"{test}-encoder", encoder)
    report(section, f"{test}-aligned", [status.result])


def _move_rel_point_for_axis(axis: Axis, distance: float) -> types.Point:
    if axis == Axis.X:
        return types.Point(x=distance)
    elif axis == Axis.Y:
        return types.Point(y=distance)
    elif axis == Axis.Z_L or axis == Axis.Z_R:
        return types.Point(z=distance)
    else:
        raise ValueError(f"unexpected axis: {axis}")


async def _move_along_axis_and_record_test_results(
    axis: Axis, api: OT3API, report: CSVReport, section: str
) -> None:
    mount = types.OT3Mount.RIGHT if axis == Axis.Z_R else types.OT3Mount.LEFT
    ax_str = str(axis.name).lower().replace("_", "")
    safety_mm = COLLISION_AVOID_MARGIN[axis]
    rel_distance = MAX_TRAVEL[axis] - (safety_mm * 2)
    print("retracting from endstop")
    await api.move_rel(mount, _move_rel_point_for_axis(axis, -safety_mm), speed=5)
    print("quickly move to axis min")
    await api.move_rel(mount, _move_rel_point_for_axis(axis, -rel_distance))
    await _record_test_status(f"{ax_str}-min", api, report, section, axis=axis)
    print("quickly move to endstop")
    await api.move_rel(mount, _move_rel_point_for_axis(axis, rel_distance))
    await _record_test_status(f"{ax_str}-max", api, report, section, axis=axis)
    print("homing")
    await api.home([axis])


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    print(f"lowering gantry currents to {int(CURRENT_PERCENTAGE * 100)}% of defaults")
    settings: Dict[Axis, helpers_ot3.GantryLoadSettings] = {
        ax: helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, ax)
        for ax in GANTRY_AXES
    }
    old_currents = {ax: settings[ax].run_current for ax in GANTRY_AXES}
    for ax in settings.keys():
        settings[ax].run_current = old_currents[ax] * CURRENT_PERCENTAGE
    await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, settings)
    report(section, "run-currents", [settings[ax].run_current for ax in GANTRY_AXES])
    ui.print_header("homing")
    await api.home(GANTRY_AXES)
    await _record_test_status("home-start", api, report, section)
    for ax in GANTRY_AXES:
        ui.print_header(f"Axis {ax.name} - MIN/MAX")
        await _move_along_axis_and_record_test_results(ax, api, report, section)
    ui.print_header("homing")
    await api.home(GANTRY_AXES)
    await _record_test_status("home-end", api, report, section)
    print("restoring default currents")
    for ax in settings.keys():
        settings[ax].run_current = old_currents[ax]
    await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, settings)
