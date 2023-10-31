"""Setup."""
import argparse
from time import time, sleep

from opentrons.types import Point
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import StatusBarState, OT3Mount

from hardware_testing.data import create_run_id, create_datetime_string, ui
from hardware_testing.gravimetric.measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.gravimetric.config import GANTRY_MAX_SPEED
from hardware_testing.gravimetric.measurement.scale import Scale  # type: ignore[import]
from hardware_testing.gravimetric import helpers, workarounds
from hardware_testing.gravimetric.__main__ import API_LEVEL

TEST_NAME = "gravimetric-daily-setup"

STABLE_CHECK_SECONDS = 3.0
STABLE_ATTEMPTS = 5

MAX_ALLOWED_ACCURACY_PERCENT_D = 0.01  # percent

MOVE_X_MM = 450
MOVE_Y_MM = 350
MOVE_MINI_MM = 5

WALKING_SECONDS = 15

COLORS = {
    "white": StatusBarState.IDLE,
    "green": StatusBarState.RUNNING,
    "yellow": StatusBarState.SOFTWARE_ERROR,
    "red-flashing": StatusBarState.HARDWARE_ERROR,
    "blue-pulsing": StatusBarState.PAUSED,
    "green-pulsing": StatusBarState.RUN_COMPLETED,
    "white-pulsing": StatusBarState.UPDATING,
    "blue-quick": StatusBarState.ACTIVATION,
    "green-quick": StatusBarState.CONFIRMATION,
    "disco-quick": StatusBarState.DISCO,
}
COLOR_STATES = {
    "idle": COLORS["white"],
    "interact": COLORS["white-pulsing"],
    "stable": COLORS["yellow"],
    "walking": COLORS["blue-pulsing"],
    "fail": COLORS["red-flashing"],
    "pass": COLORS["green"],
}


def _get_real_weight() -> float:
    try:
        inp = input("enter weight's TRUE grams: ").strip()
        return float(inp)
    except ValueError as e:
        print(e)
        return _get_real_weight()


def _test_stability(recorder: GravimetricRecorder, hw: SyncHardwareAPI) -> None:
    def _check_unstable_count(tag: str) -> None:
        segment = recorder.recording.get_tagged_samples(tag)
        stable_segment = segment.get_stable_samples()
        num_unstable = len(segment) - len(stable_segment)
        if num_unstable:
            raise RuntimeError(
                f"unstable samples during {tag} "
                f"({num_unstable}x out of {len(segment)}x total)"
            )

    hw.set_status_bar_state(COLOR_STATES["stable"])

    # BIG MOVES
    tag = "BIG-MOVES"
    with recorder.samples_of_tag(tag):
        hw.move_rel(
            OT3Mount.LEFT, Point(x=-MOVE_X_MM, y=-MOVE_Y_MM), speed=GANTRY_MAX_SPEED
        )
        hw.move_rel(OT3Mount.LEFT, Point(y=MOVE_Y_MM), speed=GANTRY_MAX_SPEED)
        hw.move_rel(OT3Mount.LEFT, Point(y=-MOVE_Y_MM), speed=GANTRY_MAX_SPEED)
        hw.move_rel(OT3Mount.LEFT, Point(x=MOVE_X_MM), speed=GANTRY_MAX_SPEED)
        hw.move_rel(OT3Mount.LEFT, Point(x=-MOVE_X_MM), speed=GANTRY_MAX_SPEED)
    _check_unstable_count(tag)

    # LITTLE MOVES
    tag = "LITTLE-MOVES"
    with recorder.samples_of_tag(tag):
        for _ in range(5):
            hw.move_rel(OT3Mount.LEFT, Point(y=MOVE_MINI_MM), speed=GANTRY_MAX_SPEED)
            hw.move_rel(OT3Mount.LEFT, Point(y=-MOVE_MINI_MM), speed=GANTRY_MAX_SPEED)
            hw.move_rel(OT3Mount.LEFT, Point(x=MOVE_MINI_MM), speed=GANTRY_MAX_SPEED)
            hw.move_rel(OT3Mount.LEFT, Point(x=-MOVE_MINI_MM), speed=GANTRY_MAX_SPEED)
    _check_unstable_count(tag)

    # GO BACK HOME
    tag = "HOMING"
    with recorder.samples_of_tag(tag):
        hw.move_rel(
            OT3Mount.LEFT, Point(x=MOVE_X_MM, y=MOVE_Y_MM), speed=GANTRY_MAX_SPEED
        )
    _check_unstable_count(tag)

    hw.set_status_bar_state(COLOR_STATES["idle"])

    # WALKING
    ui.print_info(
        "Instructions for next test:\n"
        "\t 1) walk around robot\n"
        "\t 2) move as if you were working normally"
    )
    if not hw.is_simulator:
        ui.get_user_ready("prepare to WALK")
    tag = "WALKING"
    with recorder.samples_of_tag(tag):
        num_disco_cycles = int(WALKING_SECONDS / 5)
        for _ in range(num_disco_cycles):
            hw.set_status_bar_state(COLOR_STATES["walking"])
            if not hw.is_simulator:
                sleep(5)
    _check_unstable_count(tag)


def _wait_for_stability(recorder: GravimetricRecorder, hw: SyncHardwareAPI) -> float:
    prev_light_state = hw.get_status_bar_state()
    hw.set_status_bar_state(COLOR_STATES["stable"])
    for i in range(STABLE_ATTEMPTS):
        attempt = i + 1
        ui.print_info(
            f"attempting {STABLE_CHECK_SECONDS} seconds of stability "
            f"(attempt {attempt}/{STABLE_ATTEMPTS})"
        )
        tag = f"wait-for-stable-attempt-{attempt}"
        with recorder.samples_of_tag(tag):
            if hw.is_simulator:
                # NOTE: give a bit of time during simulation, so some fake data can be stored
                sleep(0.1)
            else:
                sleep(STABLE_CHECK_SECONDS)
        segment = recorder.recording.get_tagged_samples(tag)
        if hw.is_simulator and len(segment) == 1:
            segment.append(segment[0])
        stable_only = segment.get_stable_samples()
        if len(segment) == len(stable_only):
            ui.print_info(f"stable after {attempt}x attempts")
            hw.set_status_bar_state(prev_light_state)
            return stable_only.average
    raise RuntimeError(
        f"unable to reach scale stability after {STABLE_ATTEMPTS}x attempts"
    )


def _run(hw_api: SyncHardwareAPI, recorder: GravimetricRecorder) -> None:
    ui.print_title("GRAVIMETRIC DAILY SETUP")
    ui.print_info(f"Scale: {recorder.max_capacity}g (SN:{recorder.serial_number})")
    hw_api.home()  # home gantry before we start recording from the scale

    ui.print_header("SETUP SCALE")
    hw_api.set_status_bar_state(COLOR_STATES["interact"])
    if not hw_api.is_simulator:
        ui.get_user_ready("INSTALL Radwag's default weighing pan")
        ui.get_user_ready("REMOVE all weights, vials, and labware from scale")
        ui.get_user_ready("CLOSE door and step away from fixture")
    hw_api.set_status_bar_state(COLOR_STATES["idle"])

    ui.print_header("SHAKE STABILITY")
    _wait_for_stability(recorder, hw_api)
    _test_stability(recorder, hw_api)

    ui.print_header("ZERO SCALE")
    if not hw_api.is_simulator:
        ui.get_user_ready("about to ZERO the scale:")
    _wait_for_stability(recorder, hw_api)
    recorder.zero_scale()
    while not hw_api.is_simulator and ui.get_user_answer("ZERO again"):
        _wait_for_stability(recorder, hw_api)
        recorder.zero_scale()

    ui.print_header("CALIBRATE SCALE")
    if not hw_api.is_simulator:
        ui.get_user_ready("about to CALIBRATE the scale:")
    _wait_for_stability(recorder, hw_api)
    recorder.calibrate_scale()

    ui.print_header("MEASURE WEIGHT")
    if hw_api.is_simulator:
        recorder.set_simulation_mass(0.0)
    start_grams = _wait_for_stability(recorder, hw_api)
    ui.print_info(f"start grams: {start_grams}")
    weight_grams = 20 if recorder.max_capacity < 200 else 200
    if not hw_api.is_simulator:
        real_weight = _get_real_weight()
        hw_api.set_status_bar_state(COLOR_STATES["interact"])
        ui.get_user_ready(f"ADD {weight_grams} gram WEIGHT to scale")
        ui.get_user_ready("CLOSE door and step away from fixture")
        hw_api.set_status_bar_state(COLOR_STATES["idle"])
    else:
        real_weight = float(weight_grams)
        recorder.set_simulation_mass(float(weight_grams))
    ui.print_info(f"real grams: {real_weight}")
    end_grams = _wait_for_stability(recorder, hw_api)
    ui.print_info(f"end grams: {start_grams}")
    found_grams = end_grams - start_grams

    # CALCULATE ACCURACY
    accuracy_d = ((found_grams - real_weight) / real_weight) * 100.0
    ui.print_info(f"found weight: {found_grams} grams ({round(accuracy_d, 5)} %D)")
    ui.print_info(f"%D must be less than {MAX_ALLOWED_ACCURACY_PERCENT_D} %")
    if abs(accuracy_d) > MAX_ALLOWED_ACCURACY_PERCENT_D:
        raise RuntimeError(f"accuracy failed: {accuracy_d} %D")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    _ctx = helpers.get_api_context(
        API_LEVEL,  # type: ignore[attr-defined]
        is_simulating=args.simulate,
    )
    _hw = workarounds.get_sync_hw_api(_ctx)
    _hw.set_status_bar_state(COLOR_STATES["idle"])
    _rec = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=TEST_NAME,
            run_id=create_run_id(),
            start_time=time(),
            duration=0,
            frequency=1000 if _hw.is_simulator else 5,
            stable=False,
        ),
        scale=Scale.build(simulate=_hw.is_simulator),
        simulate=_hw.is_simulator,
    )
    _rec.set_tag(create_datetime_string())
    _rec.record(in_thread=True)
    try:
        _run(_hw, _rec)
        _hw.set_status_bar_state(COLOR_STATES["pass"])
        ui.print_header(f"Result: PASS")
    except Exception as e:
        _hw.set_status_bar_state(COLOR_STATES["fail"])
        ui.print_header(f"Result: FAIL")
        ui.print_error(str(e))
    finally:
        if not args.simulate:
            ui.get_user_ready("test done")
        _rec.stop()
        _hw.set_status_bar_state(COLOR_STATES["idle"])
