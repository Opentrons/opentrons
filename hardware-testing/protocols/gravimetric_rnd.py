"""Gravimetric RnD."""
from opentrons.protocol_api import ProtocolContext

from hardware_testing.data import create_run_id
from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.measure.weight import GravimetricRecorder, GravimetricRecorderConfig

metadata = {"protocolName": "gravimetric-rnd", "apiLevel": "2.12"}


def _run(protocol: ProtocolContext) -> None:
    run_id = create_run_id()
    recorder = GravimetricRecorder(protocol, GravimetricRecorderConfig(
        test_name=metadata["protocolName"], run_id=run_id,
        duration=0, frequency=10, stable=False))
    recorder.activate()
    if "y" in input("Calibrate the scale? (y/n): ").lower():
        recorder.calibrate_scale()
    while True:
        recording_name = input("Name of recording: ")
        try:
            recording_duration = float(input("\tDuration (sec): "))
            in_thread = False
        except ValueError:
            recording_duration = 0  # run until stopped
            in_thread = True
        input("\tPress ENTER when ready...")
        recorder.set_tag(recording_name)
        recorder.set_duration(recording_duration)
        recorder.record(in_thread=in_thread)
        if in_thread:
            print('\tRunning in separate thread')
            recorder.record_start()
            input("\tPress ENTER to stop")
            recorder.record_stop()
            recorder.wait_for_finish()
        print("\tdone")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    ctx = get_api_context(api_level=metadata["apiLevel"], is_simulating=args.simulate)
    ctx.home()
    _run(ctx)
