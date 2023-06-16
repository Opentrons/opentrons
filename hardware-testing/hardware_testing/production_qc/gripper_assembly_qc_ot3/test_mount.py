"""Test Mount."""
from typing import List, Union, Tuple, Dict

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point

SLOT_MOUNT_TEST = 5
RETRACT_AFTER_HOME_MM = 0.5
Z_AXIS_TRAVEL_DISTANCE = 150.0
Z_MAX_SKIP_MM = 0.25

SPEEDS_TO_TEST = [25.0, 50.0, 100.0, 200.0]
MIN_PASS_CURRENT = 0.5
CURRENTS_SPEEDS: Dict[float, List[float]] = {
    0.2: SPEEDS_TO_TEST,
    0.3: SPEEDS_TO_TEST,
    0.4: SPEEDS_TO_TEST,
    0.5: SPEEDS_TO_TEST,
    0.6: SPEEDS_TO_TEST,
    0.67: SPEEDS_TO_TEST,
}


def _get_test_tag(
    current: float, speed: float, direction: str, start_or_end: str
) -> str:
    return f"current-{current}-speed-{speed}-{direction}-{start_or_end}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
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


async def _is_z_axis_still_aligned_with_encoder(
    api: OT3API,
) -> Tuple[float, float, bool]:
    enc_pos = await api.encoder_current_position_ot3(OT3Mount.GRIPPER)
    gantry_pos = await api.gantry_position(OT3Mount.GRIPPER)
    z_enc = enc_pos[Axis.Z_G]
    z_est = gantry_pos.z
    is_aligned = abs(z_est - z_enc) < Z_MAX_SKIP_MM
    return z_enc, z_est, is_aligned


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    z_ax = Axis.Z_G
    mount = OT3Mount.GRIPPER
    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, z_ax)
    default_z_current = settings.run_current
    default_z_speed = settings.max_speed

    await api.home([Axis.Z_G])
    home_pos = await api.gantry_position(OT3Mount.GRIPPER)
    target_pos = helpers_ot3.get_slot_calibration_square_position_ot3(SLOT_MOUNT_TEST)
    target_pos = target_pos._replace(z=home_pos.z)
    await helpers_ot3.move_to_arched_ot3(api, OT3Mount.GRIPPER, target_pos)

    async def _save_result(tag: str, include_pass_fail: bool) -> bool:
        z_est, z_enc, z_aligned = await _is_z_axis_still_aligned_with_encoder(api)
        result = CSVResult.from_bool(z_aligned)
        if include_pass_fail:
            report(section, tag, [z_est, z_enc, result])
        else:
            print(f"{tag}: {result}")
            report(section, tag, [z_est, z_enc])
        return z_aligned

    # LOOP THROUGH CURRENTS + SPEEDS
    currents = list(CURRENTS_SPEEDS.keys())
    for current in sorted(currents, reverse=True):
        speeds = CURRENTS_SPEEDS[current]
        for speed in sorted(speeds, reverse=False):
            include_pass_fail = current >= MIN_PASS_CURRENT
            ui.print_header(f"CURRENT: {current}, SPEED: {speed}")
            # HOME
            print("homing...")
            await api.home([z_ax])
            # RETRACT AND LOWER CURRENT
            print("retracting 0.5 mm from endstop")
            await api.move_rel(mount, Point(z=-RETRACT_AFTER_HOME_MM), speed=speed)
            print(f"lowering run-current to {current} amps")
            await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                api, z_ax, run_current=current
            )
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api, z_ax, default_max_speed=speed
            )
            # await api._backend.set_active_current({z_ax: current})
            # MOVE DOWN
            print(f"moving down {Z_AXIS_TRAVEL_DISTANCE} mm at {speed} mm/sec")
            await _save_result(
                _get_test_tag(current, speed, "down", "start"),
                include_pass_fail=include_pass_fail,
            )
            await api.move_rel(mount, Point(z=-Z_AXIS_TRAVEL_DISTANCE), speed=speed)
            down_passed = await _save_result(
                _get_test_tag(current, speed, "down", "end"),
                include_pass_fail=include_pass_fail,
            )
            # MOVE UP
            print(f"moving up {Z_AXIS_TRAVEL_DISTANCE} mm at {speed} mm/sec")
            await _save_result(
                _get_test_tag(current, speed, "up", "start"),
                include_pass_fail=include_pass_fail,
            )
            await api.move_rel(mount, Point(z=Z_AXIS_TRAVEL_DISTANCE), speed=speed)
            up_passed = await _save_result(
                _get_test_tag(current, speed, "up", "end"),
                include_pass_fail=include_pass_fail,
            )
            # RESET CURRENTS AND HOME
            print("homing...")
            await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                api, z_ax, run_current=default_z_current
            )
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api, z_ax, default_max_speed=default_z_speed
            )
            await api.home([z_ax])
            if not down_passed or not up_passed and not api.is_simulator:
                print(f"current {current} failed")
                print("skipping any remaining speeds at this current")
                break
