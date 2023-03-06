"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_gantry,
    test_signals,
    test_instruments,
    test_connectivity,
    test_peripherals,
)


class TestSection(enum.Enum):
    """Test Section."""

    GANTRY = "GANTRY"
    SIGNALS = "SIGNALS"
    INSTRUMENTS = "INSTRUMENTS"
    CONNECTIVITY = "CONNECTIVITY"
    PERIPHERALS = "PERIPHERALS"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.GANTRY,
        test_gantry.run,
    ),
    (
        TestSection.SIGNALS,
        test_signals.run,
    ),
    (
        TestSection.INSTRUMENTS,
        test_instruments.run,
    ),
    (
        TestSection.CONNECTIVITY,
        test_connectivity.run,
    ),
    (
        TestSection.PERIPHERALS,
        test_peripherals.run,
    ),
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.GANTRY.value, lines=test_gantry.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.SIGNALS.value, lines=test_signals.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.INSTRUMENTS.value,
                lines=test_instruments.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.CONNECTIVITY.value,
                lines=test_connectivity.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.PERIPHERALS.value,
                lines=test_peripherals.build_csv_lines(),
            ),
        ],
    )
