"""Gravimetric RnD."""
import atexit

from serial.tools.list_ports import comports  # type: ignore[import]

from opentrons.protocol_api import ProtocolContext

from hardware_testing import get_api_context

from hardware_testing.drivers import RadwagScaleBase, RadwagScale, SimRadwagScale
from hardware_testing.drivers.radwag.commands import (
    RadwagWorkingMode,
    RadwagFilter,
    RadwagValueRelease,
)
from hardware_testing.gravimetric import (
    record_samples_to_disk,
    RecordConfig,
    RecordToDiskConfig,
)

metadata = {"protocolName": "example-test", "apiLevel": "2.12"}


def _find_scale_port() -> str:
    vid, pid = RadwagScale.vid_pid()
    for p in comports():
        if p.vid == vid and p.pid == pid:
            return p.device
    # also try looking for the RS232 USB adapter cable
    for p in comports():
        if p.vid == 1659 and p.pid == 8963:
            return p.device
    raise RuntimeError(f"No scale found from available serial ports: {comports()}")


def _initialize_scale(scale: RadwagScaleBase) -> str:
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)
    scale.working_mode(mode=RadwagWorkingMode.weighing)
    scale.filter(RadwagFilter.very_fast)
    scale.value_release(RadwagValueRelease.reliable)
    if "y" in input('Run "INTERNAL ADJUSTMENT" ? (y/n) ').lower():
        scale.internal_adjustment()  # this takes quite a few seconds...
    scale.set_tare(0)
    return scale.read_serial_number()


def _run(protocol: ProtocolContext) -> None:
    if protocol.is_simulating():
        scale = SimRadwagScale()
    else:
        scale = RadwagScale.create(_find_scale_port())  # type: ignore[assignment]
    scale.connect()
    atexit.register(scale.disconnect)
    _initialize_scale(scale)

    while True:
        try:
            recording_name = input("Name of recording: ")
            recording_duration = float(input("\tDuration (sec): "))
            recording_interval = float(input("\tInterval (sec): "))
        except ValueError:
            continue
        input("\tPress ENTER when ready...")
        rec_cfg = RecordConfig(
            length=None,
            duration=recording_duration,
            interval=recording_interval,
            stable=False,
        )
        cfg = RecordToDiskConfig(
            record_config=rec_cfg,
            test_name=metadata["protocolName"],
            tag=recording_name,
        )
        record_samples_to_disk(scale, cfg)
        print("\tdone")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(metadata["protocolName"])
    parser.add_argument("--simulate", action="store_true")
    args = parser.parse_args()
    ctx = get_api_context(api_level=metadata["apiLevel"], is_simulating=args.simulate)
    ctx.home()
    _run(ctx)
