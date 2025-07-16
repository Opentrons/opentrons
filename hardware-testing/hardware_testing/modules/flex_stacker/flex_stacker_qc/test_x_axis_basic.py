"""Test X Axis."""
from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .utils import test_limit_switches_per_direction
from opentrons.hardware_control.modules.flex_stacker import FlexStacker
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(
            "limit-switch-trigger-positive-untrigger-negative", [bool, bool, CSVResult]
        ),
        CSVLine(
            "limit-switch-trigger-negative-untrigger-positive", [bool, bool, CSVResult]
        ),
        CSVLine(
            "platform-sensor-trigger-positive-untrigger-negative",
            [bool, bool, CSVResult],
        ),
        CSVLine(
            "platform-sensor-trigger-negative-untrigger-positive",
            [bool, bool, CSVResult],
        ),
    ]


async def test_platform_sensors_for_direction(
    stacker: FlexStacker, direction: Direction, report: CSVReport, section: str
) -> None:
    """Test platform sensors for a given direction."""
    ui.print_header(f"Platform Sensor - {direction} direction")
    sensor_result = await stacker._driver.get_platform_sensor(direction)
    polarity = direction.polarity()
    opposite_polarity = direction.opposite().polarity()
    opposite_result = not await stacker._driver.get_platform_sensor(
        direction.opposite()
    )
    print(f"{polarity} sensor triggered: {sensor_result}")
    print(f"{opposite_polarity} sensor untriggered: {opposite_result}")
    report(
        section,
        f"platform-sensor-trigger-{polarity}-untrigger-{opposite_polarity}",
        [
            sensor_result,
            opposite_result,
            CSVResult.from_bool(sensor_result and opposite_result),
        ],
    )


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    await test_limit_switches_per_direction(
        stacker, StackerAxis.X, Direction.EXTEND, report, section
    )

    await test_platform_sensors_for_direction(
        stacker, Direction.EXTEND, report, section
    )

    await test_limit_switches_per_direction(
        stacker, StackerAxis.X, Direction.RETRACT, report, section
    )

    await test_platform_sensors_for_direction(
        stacker, Direction.RETRACT, report, section
    )
