"""Test Width."""
from typing import List, Union, Tuple

from opentrons.hardware_control.ot3api import OT3API
from opentrons_hardware.firmware_bindings.constants import NodeId

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point


FAILURE_THRESHOLD_MM = 3
GAUGE_HEIGHT_MM = 40
GRIP_HEIGHT_MM = 30
TEST_WIDTHS_MM: List[float] = [85.75, 62]
SLOT_WIDTH_GAUGE: List[int] = [3, 9]
GRIP_FORCES_NEWTON: List[float] = [5, 15, 20]


def _get_test_tag(width: float, force: float) -> str:
    return f"{width}mm-{force}N"


def _get_width_hover_and_grip_positions(api: OT3API, slot: int) -> Tuple[Point, Point]:
    grip_pos = helpers_ot3.get_slot_calibration_square_position_ot3(slot)
    grip_pos += Point(z=GRIP_HEIGHT_MM)
    hover_pos = grip_pos._replace(z=GAUGE_HEIGHT_MM + 15)
    return hover_pos, grip_pos


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = list()
    for width in TEST_WIDTHS_MM:
        for force in GRIP_FORCES_NEWTON:
            tag = _get_test_tag(width, force)
            lines.append(CSVLine(tag, [float, float, float, CSVResult]))
    return lines


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = Axis.Z_G
    g_ax = Axis.G
    mount = OT3Mount.GRIPPER
    gripper = api._gripper_handler.get_gripper()
    max_width = gripper.config.geometry.jaw_width["max"]

    async def _save_result(_width: float, _force: float) -> None:
        # fake the encoder to be in the right place, during simulation
        if api.is_simulator:
            sim_enc_pox = (max_width - width) / 2.0
            api._backend._encoder_position[NodeId.gripper_g] = sim_enc_pox
            await api.refresh_positions()
        _width_actual = api._gripper_handler.get_gripper().jaw_width
        assert _width_actual is not None
        print(f"actual width: {_width_actual}")
        result = CSVResult.from_bool(
            abs(_width - _width_actual) <= FAILURE_THRESHOLD_MM
        )
        tag = _get_test_tag(_width, _force)
        report(section, tag, [_force, _width, _width_actual, result])

    # HOME
    print("homing Z and G...")
    await api.home([z_ax, g_ax])
    # LOOP THROUGH WIDTHS
    for width, slot in zip(TEST_WIDTHS_MM, SLOT_WIDTH_GAUGE):
        hover_pos, target_pos = _get_width_hover_and_grip_positions(api, slot)
        # MOVE TO SLOT
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
        # OPERATOR SETS UP GAUGE
        ui.print_header(f"SETUP {width} MM GAUGE")
        if not api.is_simulator:
            ui.get_user_ready(f"add {width} mm wide gauge to slot {slot}")
        # GRIPPER MOVES TO GAUGE
        await api.ungrip()
        await api.move_to(mount, target_pos)
        if not api.is_simulator:
            ui.get_user_ready(f"prepare to grip {width} mm")
        # grip once to center the thing
        await api.grip(20)
        await api.ungrip()
        # LOOP THROUGH FORCES
        for force in GRIP_FORCES_NEWTON:
            # GRIP AND MEASURE WIDTH
            print(f"width(mm): {width}, force(N): {force}")
            await api.grip(force)
            await _save_result(width, force)
            await api.ungrip()
        # RETRACT
        print("done")
        await helpers_ot3.move_to_arched_ot3(api, mount, hover_pos)
