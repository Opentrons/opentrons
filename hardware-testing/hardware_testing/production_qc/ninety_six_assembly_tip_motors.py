"""96ch Tip-Motors Assembly."""
import asyncio

from hardware_testing.opentrons_api.types import Axis
from hardware_testing.opentrons_api import helpers_ot3


MOTOR_RETRACT_MM = 5


# test jaws
"""Test Jaws."""
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
from hardware_testing.opentrons_api.types import Axis, OT3Mount

# from opentrons.hardware_control.backends.ot3utils import axis_convert


RETRACT_MM = 0.25  # 0.25
MAX_TRAVEL = 29.8 - RETRACT_MM  # FIXME: what is the max travel?
ENDSTOP_OVERRUN_MM = (
    0.25  # FIXME: position cannot go negative, can't go past limit switch
)
ENDSTOP_OVERRUN_SPEED = 5
SPEEDS_TO_TEST: List[float] = [8, 12]
CURRENTS_SPEEDS: Dict[float, List[float]] = {
    0.7: SPEEDS_TO_TEST,
    1.5: SPEEDS_TO_TEST,
}


async def _check_if_jaw_is_aligned_with_endstop(api: OT3API) -> bool:
    if not api.is_simulator:
        pass_no_hit = ui.get_user_answer("are both endstop Lights OFF?")
    else:
        pass_no_hit = True
    if not pass_no_hit:
        ui.print_error("endstop hit too early")
    return pass_no_hit


async def jaw_precheck(api: OT3API, ax: Axis, speed: float) -> Tuple[bool, bool]:
    """Check the LEDs work and jaws are aligned."""
    # HOME
    print("homing...")
    await helpers_ot3.home_tip_motors(api, False)  # Home with no backoff
    # Check LEDs can turn on when homed
    if not api.is_simulator:
        led_check = ui.get_user_answer("are both endstop Lights ON?")
    else:
        led_check = True
    if not led_check:
        ui.print_error("Endstop LED or homing failure")
        return (led_check, False)
    print(f"retracting {RETRACT_MM} mm")
    await helpers_ot3.move_tip_motor_relative_ot3(api, RETRACT_MM, speed=speed)
    # Check Jaws are aligned
    if not api.is_simulator:
        jaws_aligned = ui.get_user_answer("are both endstop Lights OFF?")
    else:
        jaws_aligned = True
    if not jaws_aligned:
        ui.print_error("Jaws Misaligned")
    return led_check, jaws_aligned


async def _run_test_jaw(api: OT3API):
    ax = Axis.Q
    settings = helpers_ot3.get_gantry_load_per_axis_motion_settings_ot3(api, ax)
    default_current = settings.run_current
    default_speed = settings.max_speed

    async def _save_result(tag: str, led_check: bool, jaws_aligned: bool) -> bool:
        if led_check and jaws_aligned:
            no_hit = await _check_if_jaw_is_aligned_with_endstop(api)
        else:
            no_hit = False
        return led_check and jaws_aligned and no_hit

    await api.home_z(OT3Mount.LEFT)
    slot_5 = helpers_ot3.get_slot_calibration_square_position_ot3(5)
    home_pos = await api.gantry_position(OT3Mount.LEFT)
    await api.move_to(OT3Mount.LEFT, slot_5._replace(z=home_pos.z))
    # LOOP THROUGH CURRENTS + SPEEDS
    current = 0.7
    speed = 12
    ui.print_header(f"CURRENT: {current}, SPEED: {speed}")
    led_check, jaws_aligned = await jaw_precheck(api, ax, speed)

    if led_check and jaws_aligned:
        print(f"lowering run-current to {current} amps")
        await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, default_max_speed=speed
        )
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api, ax, run_current=current
        )
        # MOVE DOWN then UP
        print(f"moving down/up {MAX_TRAVEL} mm at {speed} mm/sec")
        await helpers_ot3.move_tip_motor_relative_ot3(
            api, MAX_TRAVEL, speed=speed, motor_current=current
        )
        await helpers_ot3.move_tip_motor_relative_ot3(
            api, -MAX_TRAVEL, speed=speed, motor_current=current
        )
        # RESET CURRENTS, CHECK
        await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
            api, ax, default_max_speed=default_speed
        )
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api, ax, run_current=default_current
        )
        await _check_if_jaw_is_aligned_with_endstop(api)
    print("homing...")
    await api.home([ax])


async def _main() -> None:
    print("start")
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=False)
    print("homing Q axis")
    await api.home([Axis.Q])
    print(f"moving {RETRACT_MM} away from endstop")
    await helpers_ot3.move_tip_motor_relative_ot3(api, MOTOR_RETRACT_MM)
    print("homing Q axis")
    await api.home([Axis.Q])
    # verify jaws
    await api.home()
    await _run_test_jaw(api)
    print("done")


if __name__ == "__main__":
    asyncio.run(_main())
