from __future__ import annotations
from typing import NamedTuple


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

    def __str__(self):
        return f"{self.major}.{self.minor}"
