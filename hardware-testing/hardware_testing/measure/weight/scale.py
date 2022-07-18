"""Scale."""
from opentrons.protocol_api import ProtocolContext

from hardware_testing.drivers import (
    find_port,
    RadwagScaleBase,
    RadwagScale,
    SimRadwagScale,
)
from hardware_testing.drivers.radwag.commands import (
    RadwagWorkingMode,
    RadwagFilter,
    RadwagValueRelease,
)


def _scale_find_port() -> str:
    vid, pid = RadwagScale.vid_pid()
    try:
        return find_port(vid=vid, pid=pid)
    except RuntimeError:
        # also try looking for the RS232 USB adapter cable
        return find_port(vid=1659, pid=8963)


def _scale_initialize(scale: RadwagScaleBase) -> str:
    # Some Radwag settings cannot be controlled remotely.
    # Listed below are the things the must be done using the touchscreen:
    #   1) Set profile to USER
    #   2) Set screensaver to NONE
    scale.continuous_transmission(enable=False)
    scale.automatic_internal_adjustment(enable=False)
    scale.working_mode(mode=RadwagWorkingMode.weighing)
    scale.filter(RadwagFilter.very_fast)
    scale.value_release(RadwagValueRelease.reliable)
    scale.set_tare(0)
    return scale.read_serial_number()


def scale_connect_and_initialize(protocol: ProtocolContext) -> RadwagScaleBase:
    """Scale connect and initialize."""
    if protocol.is_simulating():
        scale = SimRadwagScale()
    else:
        scale = RadwagScale.create(_scale_find_port())  # type: ignore[assignment]
    scale.connect()
    _scale_initialize(scale)
    return scale


def scale_calibrate(protocol: ProtocolContext) -> None:
    """Scale calibrate."""
    scale = scale_connect_and_initialize(protocol)
    scale.internal_adjustment()  # this takes quite a few seconds...
    scale.disconnect()
