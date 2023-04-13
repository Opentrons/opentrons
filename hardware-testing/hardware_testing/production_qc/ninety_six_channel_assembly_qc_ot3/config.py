"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_plunger,
    test_droplets,
)


class TestSection(enum.Enum):
    """Test Section."""

    PLUNGER = "PLUNGER"
    DROPLETS = "DROPLETS"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.PLUNGER,
        test_plunger.run,
    ),
    (
        TestSection.DROPLETS,
        test_droplets.run,
    ),
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.PLUNGER.value, lines=test_plunger.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.DROPLETS.value, lines=test_droplets.build_csv_lines()
            ),
        ],
    )
