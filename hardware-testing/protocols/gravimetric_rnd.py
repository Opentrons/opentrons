"""Gravimetric RnD."""
from time import time

from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.measure.weight import GravimetricRecorder, GravimetricRecorderConfig

metadata = {"protocolName": "gravimetric-rnd", "apiLevel": "2.12"}


def _run(protocol: ProtocolContext) -> None:
    run_id = create_run_id()

    _rec = GravimetricRecorder(protocol, GravimetricRecorderConfig(
        test_name=metadata["protocolName"], run_id=run_id, start_time=time(),
        duration=1, frequency=10, stable=False))

    if "y" in input("Calibrate the scale? (y/n): ").lower():
        _rec.calibrate_scale()
    while True:
        recording_name = input("Name of recording: ")
        try:
            recording_duration = float(input("\tDuration (sec): "))
            in_thread = False
        except ValueError:
            recording_duration = 0  # run until stopped
            in_thread = True
        input("\tPress ENTER when ready...")
        _rec.set_tag(recording_name)
        _rec.set_duration(recording_duration)
        _rec.record(in_thread=in_thread)
        if in_thread:
            print('\tRunning in separate thread')
            input("\tPress ENTER to stop")
            _rec.stop()
        print("\tdone")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    ctx = get_api_context(
        api_level=metadata["apiLevel"], is_simulating=args.simulate,
        connect_to_smoothie=False)
    _run(ctx)
