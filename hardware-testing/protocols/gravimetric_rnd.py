"""Gravimetric RnD."""
from opentrons.protocol_api import ProtocolContext

from hardware_testing.opentrons_api.helpers import get_api_context
from hardware_testing.measure.weight import GravimetricRecorder

metadata = {"protocolName": "example-test", "apiLevel": "2.12"}


def _run(protocol: ProtocolContext) -> None:
    recorder = GravimetricRecorder(protocol, test_name=metadata["protocolName"])
    recorder.activate()
    if "y" in input("Calibrate the scale? (y/n): ").lower():
        recorder.calibrate_scale()
    while True:
        try:
            recording_name = input("Name of recording: ")
            recording_duration = float(input("\tDuration (sec): "))
        except ValueError:
            continue
        input("\tPress ENTER when ready...")
        recorder.set_tag(recording_name)
        recorder.record(duration=recording_duration)
        print("\tdone")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    ctx = get_api_context(api_level=metadata["apiLevel"], is_simulating=args.simulate)
    ctx.home()
    _run(ctx)
