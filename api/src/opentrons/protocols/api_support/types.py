from __future__ import annotations
from typing import NamedTuple, TypedDict


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


class ThermocyclerStepBase(TypedDict):
    """Required elements of a thermocycler step: the temperature."""

    temperature: float


class ThermocyclerStep(ThermocyclerStepBase, total=False):
    """Optional elements of a thermocycler step: the hold time. One of these must be present."""

    hold_time_seconds: float
    hold_time_minutes: float
