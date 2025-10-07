"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_cycles,
)


class TestSection(enum.Enum):
    """Test Section."""

    CYCLES = "CYCLES"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.CYCLES,
        test_cycles.run,
    )
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.CYCLES.value,
                lines=test_cycles.build_csv_lines(),
            ),
        ],
    )
