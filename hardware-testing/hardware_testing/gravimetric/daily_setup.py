"""Setup."""
import argparse
from time import time, sleep

from hardware_testing.data import create_run_id, create_datetime_string, ui
from hardware_testing.gravimetric.measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
    GravimetricRecording,
)
from hardware_testing.gravimetric.measurement.scale import Scale  # type: ignore[import]

STABLE_CHECK_SECONDS = 1.0
STABLE_ATTEMPTS = 5

MAX_ALLOWED_ACCURACY_PERCENT_D = 0.01  # percent


def _get_real_weight() -> float:
    try:
        inp = input("enter weight's TRUE grams: ").strip()
        return float(inp)
    except ValueError as e:
        print(e)
        return _get_real_weight()


def _wait_for_stability(recorder: GravimetricRecorder, is_simulating: bool) -> float:
    recorder.set_tag(create_datetime_string())
    recorder.record(in_thread=True)
    try:
        for i in range(STABLE_ATTEMPTS):
            attempt = i + 1
            ui.print_info(
                f"attempting {STABLE_CHECK_SECONDS} seconds of stability "
                f"(attempt {attempt}/{STABLE_ATTEMPTS})"
            )
            tag = f"wait-for-stable-attempt-{attempt}"
            with recorder.samples_of_tag(tag):
                if is_simulating:
                    # NOTE: give a bit of time during simulation, so some fake data can be stored
                    sleep(0.1)
                else:
                    sleep(STABLE_CHECK_SECONDS)
            segment = GravimetricRecording(
                [
                    sample
                    for sample in recorder.recording
                    if sample.tag and sample.tag == tag
                ]
            )
            if is_simulating and len(segment) == 1:
                segment.append(segment[0])
            stable_only = GravimetricRecording(
                [sample for sample in segment if sample.stable]
            )
            if len(segment) == len(stable_only):
                ui.print_info(f"stable after {attempt}x attempts")
                return stable_only.average
        raise RuntimeError(
            f"unable to reach scale stability after {STABLE_ATTEMPTS}x attempts"
        )
    finally:
        recorder.stop()


def _run(is_simulating: bool) -> None:
    ui.print_title("GRAVIMETRIC DAILY SETUP")
    _rec = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name="gravimetric-daily-setup",
            run_id=create_run_id(),
            start_time=time(),
            duration=0,
            frequency=1000 if is_simulating else 5,
            stable=False,
        ),
        scale=Scale.build(simulate=is_simulating),
        simulate=is_simulating,
    )
    ui.print_info(f"Scale: {_rec.max_capacity}g (SN:{_rec.serial_number})")

    ui.print_header("SETUP SCALE")
    if not is_simulating:
        ui.get_user_ready("INSTALL Radwag's default weighing pan")
        ui.get_user_ready("REMOVE all weights, vials, and labware from scale")
        ui.get_user_ready("CLOSE door and step away from fixture")

    ui.print_header("ZERO SCALE")
    if not is_simulating:
        ui.get_user_ready("about to ZERO the scale:")
    _wait_for_stability(_rec, is_simulating)
    _rec.zero_scale()
    while not is_simulating and ui.get_user_answer("ZERO again"):
        _wait_for_stability(_rec, is_simulating)
        _rec.zero_scale()

    ui.print_header("CALIBRATE SCALE")
    if not is_simulating:
        ui.get_user_ready("about to CALIBRATE the scale:")
    _wait_for_stability(_rec, is_simulating)
    _rec.calibrate_scale()

    ui.print_header("MEASURE WEIGHT")
    if is_simulating:
        _rec.set_simulation_mass(0.0)
    start_grams = _wait_for_stability(_rec, is_simulating)
    weight_grams = 20 if _rec.max_capacity < 200 else 200
    if not is_simulating:
        real_weight = _get_real_weight()
        ui.get_user_ready(f"ADD {weight_grams} gram WEIGHT to scale")
        ui.get_user_ready("CLOSE door and step away from fixture")
    else:
        real_weight = float(weight_grams)
        _rec.set_simulation_mass(float(weight_grams))
    end_grams = _wait_for_stability(_rec, is_simulating)
    found_grams = end_grams - start_grams

    # CALCULATE ACCURACY
    accuracy_d = ((found_grams - real_weight) / real_weight) * 100.0
    ui.print_info(f"found weight: {found_grams} grams ({round(accuracy_d, 3)} %D)")
    ui.print_info(f"%D must be less than {MAX_ALLOWED_ACCURACY_PERCENT_D} %")
    if abs(accuracy_d) > MAX_ALLOWED_ACCURACY_PERCENT_D:
        ui.print_header(f"Result: FAIL")
    else:
        ui.print_header("Result: PASS")
    ui.print_info("done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    _run(args.simulate)
