from __future__ import annotations
from typing import NamedTuple, TYPE_CHECKING

if TYPE_CHECKING:
    from .definitions import MAX_SUPPORTED_VERSION


class APIVersion(NamedTuple):
    major: int
    minor: int

    @classmethod
    def validate_api_version(cls, api_version: str):
        if cls.from_string(api_version) > MAX_SUPPORTED_VERSION:
            raise RuntimeError(
                f"API version {api_version} is not supported by this "
                f"robot software. Please either reduce your requested API "
                f"version or update your robot."
            )

    @classmethod
    def from_string(cls, inp: str) -> APIVersion:
        parts = inp.split(".")
        if len(parts) != 2:
            raise ValueError(inp)
        intparts = [int(p) for p in parts]

        return cls(major=intparts[0], minor=intparts[1])

    def __str__(self):
        return f"{self.major}.{self.minor}"
