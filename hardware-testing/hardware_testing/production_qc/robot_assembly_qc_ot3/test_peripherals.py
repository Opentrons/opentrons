"""Test Peripherals."""
from typing import List, Union

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("screen-on", [CSVResult]),
        CSVLine("screen-touch", [CSVResult]),
        CSVLine("deck-lights-on", [CSVResult]),
        CSVLine("deck-lights-off", [CSVResult]),
        CSVLine("status-light-on", [CSVResult]),
        CSVLine("door-switch", [CSVResult]),
        CSVLine("camera-active", [CSVResult]),
        CSVLine("camera-image", [CSVResult]),
    ]


async def run(api: OT3API, report: CSVReport, section: str) -> None:
    """Run."""

    def _get_user_confirmation(question: str) -> bool:
        if api.is_simulator:
            return True
        return "y" in input(f"{question} (y/n): ").lower()

    # ODD
    result = _get_user_confirmation("is ODD on?")
    report(section, "screen-on", [CSVResult.from_bool(result)])
    result = _get_user_confirmation("is ODD touchscreen working?")
    report(section, "screen-touch", [CSVResult.from_bool(result)])

    # DECK LIGHTS
    result = _get_user_confirmation("are the DECK-LIGHTS on?")
    report(section, "deck-lights-on", [CSVResult.from_bool(result)])
    # TODO: enable once we are able to turn off the deck lights
    # result = "y" in input("are the DECK-LIGHTS off? (y/n): ")
    # report(section, "deck-lights-off", [CSVResult.from_bool(result)])

    # STATUS LIGHTS
    result = _get_user_confirmation("is the STATUS-LIGHT on?")
    report(section, "status-light-on", [CSVResult.from_bool(result)])
    # TODO: do more testing (colors, on/off, etc.) once implemented

    # DOOR SWITCH
    # TODO: add test once implemented

    # CAMERA:
    # TODO: read camera image once ffmpeg (or other tool) is implemented in OS

