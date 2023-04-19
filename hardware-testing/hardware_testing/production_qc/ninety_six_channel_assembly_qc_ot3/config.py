"""Config."""
from dataclasses import dataclass
import enum
from typing import Dict, Callable

from hardware_testing.data.csv_report import CSVReport, CSVSection

from . import (
    test_plunger,
    test_jaws,
    test_pressure,
    test_tip_sensor,
    test_environmental_sensor,
    test_droplets,
    test_partial_pickup,
)


class TestSection(enum.Enum):
    """Test Section."""

    PLUNGER = "PLUNGER"
    JAWS = "JAWS"
    PRESSURE = "PRESSURE"
    TIP_SENSOR = "TIP-SENSOR"
    ENVIRONMENT_SENSOR = "ENVIRONMENT-SENSOR"
    DROPLETS = "DROPLETS"
    PARTIAL_PICKUP = "PARTIAL_PICKUP"


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
        TestSection.JAWS,
        test_jaws.run,
    ),
    (
        TestSection.PRESSURE,
        test_pressure.run,
    ),
    (
        TestSection.TIP_SENSOR,
        test_tip_sensor.run,
    ),
    (
        TestSection.ENVIRONMENT_SENSOR,
        test_environmental_sensor.run,
    ),
    (
        TestSection.DROPLETS,
        test_droplets.run,
    ),
    (
        TestSection.PARTIAL_PICKUP,
        test_partial_pickup.run,
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
                title=TestSection.JAWS.value, lines=test_jaws.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.PRESSURE.value, lines=test_pressure.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.TIP_SENSOR.value, lines=test_tip_sensor.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.ENVIRONMENT_SENSOR.value, lines=test_environmental_sensor.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.DROPLETS.value, lines=test_droplets.build_csv_lines()
            ),
            CSVSection(
                title=TestSection.PARTIAL_PICKUP.value, lines=test_partial_pickup.build_csv_lines()
            ),
        ],
    )
