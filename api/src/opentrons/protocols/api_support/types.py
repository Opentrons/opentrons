from __future__ import annotations

from typing import Callable, Literal, NamedTuple, Optional, Tuple, TypedDict


class APIVersion(NamedTuple):
    major: int
    minor: int

    @classmethod
    def from_string(cls, inp: str) -> APIVersion:
        parts = inp.split(".")
        if len(parts) != 2:
            raise ValueError(inp)
        intparts = [int(p) for p in parts]

        return cls(major=intparts[0], minor=intparts[1])

    def __str__(self) -> str:
        return f"{self.major}.{self.minor}"


class TransferArgs(TypedDict, total=False):
    """
    The common arguments for the transfer functions `InstrumentContext.transfer()`,
    `InstrumentContext.distribute()`, `InstrumentContext.consolidate()`.
    """

    mode: Literal["transfer", "distribute", "consolidate"]  # internal use only
    new_tip: Literal["once", "always", "never"]
    trash: bool
    touch_tip: bool
    blow_out: bool
    blowout_location: Literal["trash", "source well", "destination well"]
    mix_before: Tuple[int, float]
    mix_after: Tuple[int, float]
    disposal_volume: float
    air_gap: float
    carryover: bool  # this does nothing!
    gradient_function: Callable[[float], float]  # very mysterious


class ThermocyclerStepBase(TypedDict):
    """Required elements of a thermocycler step: the temperature."""

    temperature: float


class ThermocyclerStep(ThermocyclerStepBase, total=False):
    """Optional elements of a thermocycler step: the hold time. One of these must be present."""

    hold_time_seconds: float
    hold_time_minutes: float
    ramp_rate: Optional[float]
