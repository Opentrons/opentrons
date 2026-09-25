"""Test UI LEDs."""

from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.vacuum_module import VacuumModule
from opentrons.drivers.vacuum_module.types import LEDColor, LEDPattern


COLORS = [
    LEDColor.RED,
    LEDColor.GREEN,
    LEDColor.BLUE,
    LEDColor.WHITE,
]


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(f"{loc}-{color}", [CSVResult])
        for loc in ["internal"]
        for color in COLORS
    ]


async def run(vacuum: VacuumModule, report: CSVReport, section: str) -> None:
    """Run."""
    # Reset LEDs to off
    if not vacuum.is_simulated:
        await vacuum._driver.set_led(0, LEDColor.GREEN, False, LEDPattern.STATIC)
        await vacuum._driver.set_led(0, LEDColor.GREEN, True, LEDPattern.STATIC)

    for color in COLORS:
        tag = "internal"
        ui.print_header(f"Check {tag} {color}")
        if not vacuum.is_simulated:
            await vacuum._driver.set_led(1.0, color)
            led_on = ui.get_user_answer(f"Is the {tag} {color} LED on?")
            # turn off led before moving on
            await vacuum._driver.set_led(0.0)
        else:
            led_on = True
        report(section, f"{tag}-{color}", [CSVResult.from_bool(led_on)])

    # Turn LEDs back to green
    if not vacuum.is_simulated:
        await vacuum._driver.set_led(
            0.5, color=LEDColor.GREEN, pattern=LEDPattern.STATIC
        )
