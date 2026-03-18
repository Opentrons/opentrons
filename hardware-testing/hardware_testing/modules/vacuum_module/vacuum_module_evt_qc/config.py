"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_ui_leds,
    test_connectivity,
    test_pressure_abs_basic,
    test_pressure_atm_basic,
    test_vent,
    test_pump_basic,
    test_vacuum_functional,
)


class TestSection(enum.Enum):
    """Test Section."""

    CONNECTIVITY = "CONNECTIVITY"
    UI_LEDS = "UI_LEDS"
    PRESSURE_ABS_BASIC = "PRESSURE_ABS_BASIC"
    PRESSURE_ATM_BASIC = "PRESSURE_ATM_BASIC"
    VENT = "VENT"
    PUMP_BASIC = "PUMP_BASIC"
    VACUUM_FUNCTIONAL = "VACUUM_FUNCTIONAL"


@dataclass
class TestConfig:
    """Test Config."""

    simulate: bool
    tests: Dict[TestSection, Callable]


TESTS = [
    (
        TestSection.CONNECTIVITY,
        test_connectivity.run,
    ),
    (
        TestSection.UI_LEDS,
        test_ui_leds.run,
    ),
    (
        TestSection.PRESSURE_ABS_BASIC,
        test_pressure_abs_basic.run,
    ),
    (
        TestSection.PRESSURE_ATM_BASIC,
        test_pressure_atm_basic.run,
    ),
    (
        TestSection.VENT,
        test_vent.run,
    ),
    (
        TestSection.PUMP_BASIC,
        test_pump_basic.run,
    ),
    (
        TestSection.VACUUM_FUNCTIONAL,
        test_vacuum_functional.run,
    ),
]


def build_report(test_name: str) -> CSVReport:
    """Build report."""
    return CSVReport(
        test_name=test_name,
        sections=[
            CSVSection(
                title=TestSection.CONNECTIVITY.value,
                lines=test_connectivity.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.UI_LEDS.value,
                lines=test_ui_leds.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.PRESSURE_ABS_BASIC.value,
                lines=test_pressure_abs_basic.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.PRESSURE_ATM_BASIC.value,
                lines=test_pressure_atm_basic.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.VENT.value,
                lines=test_vent.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.PUMP_BASIC.value,
                lines=test_pump_basic.build_csv_lines(),
            ),
            CSVSection(
                title=TestSection.VACUUM_FUNCTIONAL.value,
                lines=test_vacuum_functional.build_csv_lines(),
            ),
        ],
    )
