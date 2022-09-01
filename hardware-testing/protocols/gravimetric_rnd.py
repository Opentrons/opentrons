"""Gravimetric RnD."""
import argparse
from time import time

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id, create_datetime_string
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.measure.weight import (
    GravimetricRecorder,
    GravimetricRecorderConfig,
)

metadata = {"protocolName": "gravimetric-rnd", "apiLevel": "2.12"}
CALIBRATE_SCALE = False


def _run(protocol: ProtocolContext) -> None:
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    _rec = GravimetricRecorder(
        protocol,
        GravimetricRecorderConfig(
            test_name=metadata["protocolName"],
            run_id=create_run_id(),
            start_time=time(),
            duration=0,
            frequency=10,
            stable=False,
        ),
    )
    if CALIBRATE_SCALE:
        _rec.calibrate_scale()
    while True:
        protocol.pause("Press ENTER to Record:")
        tag = create_datetime_string()
        protocol.comment(f'\tRecording tag: "{tag}"')
        _rec.set_tag(tag)
        _rec.record(in_thread=True)
        protocol.pause("\tPress ENTER to Stop...")
        _rec.stop()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    args = parser.parse_args()
    CALIBRATE_SCALE = args.calibrate
    ctx = get_api_context(
        api_level=metadata["apiLevel"],
        is_simulating=args.simulate,
        connect_to_smoothie=False,
    )
    _run(ctx)
