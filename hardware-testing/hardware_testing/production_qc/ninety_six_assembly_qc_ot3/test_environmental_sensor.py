"""Test Environmental Sensor."""
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [CSVLine("environment-celsius-humidity", [float, float])]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""
    c, h = await helpers_ot3.get_temperature_humidity_ot3(api, OT3Mount.LEFT)
    print(f"Celsius = {round(c, 2)} degrees")
    print(f"Humidity = {round(h * 100, 2)} percent")
    report(section, "environment-celsius-humidity", [c, h])
