"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_ui_leds,
)


class TestSection(enum.Enum):
    """Test Section."""

    UI_LEDS = "UI_LEDS"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.UI_LEDS,
        test_ui_leds.run,
    ),
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.UI_LEDS.value,
                lines=test_ui_leds.build_csv_lines(),
            ),
        ],
    )
