"""Gravimetric RnD."""
from opentrons.protocol_api import ProtocolContext

from hardware_testing import get_api_context
from hardware_testing.measure.weight import (
    scale_calibrate,
    record_samples_to_disk,
    RecordConfig,
    RecordToDiskConfig,
)

metadata = {"protocolName": "example-test", "apiLevel": "2.12"}


def _run(protocol: ProtocolContext) -> None:
    if 'y' in input('Calibrate the scale? (y/n): ').lower():
        scale_calibrate(protocol)
    while True:
        try:
            recording_name = input("Name of recording: ")
            recording_duration = float(input("\tDuration (sec): "))
            recording_frequency = float(input("\tFrequency (hz): "))
        except ValueError:
            continue
        input("\tPress ENTER when ready...")
        cfg = RecordToDiskConfig(
            test_name=metadata["protocolName"],
            tag=recording_name,
            record_config=RecordConfig(
                duration=recording_duration,
                frequency=recording_frequency,
                stable=False,
            )
        )
        record_samples_to_disk(protocol, cfg)
        print("\tdone")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    ctx = get_api_context(api_level=metadata["apiLevel"], is_simulating=args.simulate)
    ctx.home()
    _run(ctx)
