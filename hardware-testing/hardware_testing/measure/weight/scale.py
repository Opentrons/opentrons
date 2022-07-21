"""Scale."""
from dataclasses import dataclass
from time import time

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


@dataclass
class ScaleConfig:
    continuous_transmission: bool
    automatic_internal_adjustment: bool
    working_mode: RadwagWorkingMode
    filter: RadwagFilter
    value_release: RadwagValueRelease
    tare: float


DEFAULT_SCALE_CONFIG = ScaleConfig(
    continuous_transmission=False, automatic_internal_adjustment=False,
    working_mode=RadwagWorkingMode.weighing, filter=RadwagFilter.very_fast,
    value_release=RadwagValueRelease.fast, tare=0.0,
)


@dataclass
class ScaleReading:
    grams: float
    stable: bool
    time: float


class Scale:
    """Scale Class."""

    def __init__(self, ctx: ProtocolContext, scale: RadwagScaleBase) -> None:
        """Scale Class."""
        self._ctx = ctx
        self._scale = scale

    @classmethod
    def build(cls, ctx: ProtocolContext) -> "Scale":
        """Build."""
        if ctx.is_simulating():
            _scale = SimRadwagScale()
        else:
            _scale = RadwagScale.create(cls.find_port())  # type: ignore[assignment]
        return Scale(ctx, scale=_scale)

    @classmethod
    def find_port(cls) -> str:
        """Find port."""
        vid, pid = RadwagScale.vid_pid()
        try:
            return find_port(vid=vid, pid=pid)
        except RuntimeError:
            # also try looking for the RS232 USB adapter cable
            return find_port(vid=1659, pid=8963)

    def connect(self) -> None:
        """Scale connect."""
        self._scale.connect()

    def disconnect(self) -> None:
        """Scale connect."""
        self._scale.disconnect()

    def initialize(self, cfg: ScaleConfig = DEFAULT_SCALE_CONFIG) -> None:
        """Initialize."""
        # Some Radwag settings cannot be controlled remotely.
        # Listed below are the things the must be done using the touchscreen:
        #   1) Set profile to USER
        #   2) Set screensaver to NONE
        self._scale.continuous_transmission(enable=cfg.continuous_transmission)
        self._scale.automatic_internal_adjustment(enable=cfg.automatic_internal_adjustment)
        self._scale.working_mode(mode=cfg.working_mode)
        self._scale.filter(cfg.filter)
        self._scale.value_release(cfg.value_release)
        self.tare(cfg.tare)

    def tare(self, grams: float) -> None:
        """Tare."""
        self._scale.set_tare(grams)

    def read_serial_number(self) -> str:
        """Read serial number."""
        return self._scale.read_serial_number()

    def calibrate(self) -> None:
        """Calibrate."""
        self._scale.internal_adjustment()

    def read(self) -> ScaleReading:
        """Read."""
        g, s = self._scale.read_mass()
        return ScaleReading(grams=g, stable=s, time=time())
