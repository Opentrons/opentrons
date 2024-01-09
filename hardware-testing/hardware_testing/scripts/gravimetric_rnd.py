"""Gravimetric RnD."""
import argparse
from time import time

from hardware_testing.data import create_run_id, create_datetime_string
from hardware_testing.gravimetric.measurement.record import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)
from hardware_testing.gravimetric.measurement.scale import Scale  # type: ignore[import]

metadata = {"protocolName": "gravimetric-rnd", "apiLevel": "2.12"}
CALIBRATE_SCALE = False


def _run(is_simulating: bool) -> None:
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    _rec = GravimetricRecorder(
        GravimetricRecorderConfig(
            test_name=metadata["protocolName"],
            run_id=create_run_id(),
            start_time=time(),
            duration=0,
            frequency=5,
            stable=False,
        ),
        scale=Scale.build(simulate=is_simulating),
        simulate=is_simulating,
    )
    print(f"Scale: {_rec.max_capacity}g (SN:{_rec.serial_number})")
    if CALIBRATE_SCALE:
        input("Press ENTER to ZERO the scale:")
        _rec.zero_scale()
        input("Press ENTER to CALIBRATE the scale:")
        _rec.calibrate_scale()
    while True:
        input("Press ENTER to Record:")
        tag = create_datetime_string()
        print(f'\tRecording tag: "{tag}"')
        _rec.set_tag(tag)
        _rec.record(in_thread=True)
        input("\tPress ENTER to Stop...")
        _rec.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    args = parser.parse_args()
    CALIBRATE_SCALE = args.calibrate
    _run(args.simulate)
