"""Useful types for testing."""

from dataclasses import dataclass
from .stackup_spec import StackupSpec


@dataclass(frozen=True)
class SuccessfulTest:
    """The data from a test that retrieved coordinates (they have not yet been compared to snapshot)."""

    spec: StackupSpec
    coordinates: tuple[float, float, float]


@dataclass(frozen=True)
class CoordinateMismatch:
    """The data from a test that failed because of mismatched coordinates."""

    spec: StackupSpec
    snapshotted: tuple[float, float, float]
    this_test: tuple[float, float, float]
    diff: tuple[float, float, float]


@dataclass(frozen=True)
class ResultSummary:
    """A human-oriented summary of a test pass.

    Any critical failures cause the overall run to fail; any warnings do not, but should be fixed.
    """

    critical_failures: list[str]
    warnings: list[str]
