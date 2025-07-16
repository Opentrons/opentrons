"""Utility functions for the Flex Stacker EVT QC module."""
import re
from serial.tools.list_ports import comports  # type: ignore[import]

from opentrons.drivers.flex_stacker.driver import FlexStackerDriver
from opentrons.hardware_control.modules.flex_stacker import FlexStacker
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
)

from opentrons.drivers.flex_stacker.types import StackerAxis, Direction


STACKER_VID = 0x483
STACKER_PID = 0xEF24


def find_stacker_port() -> str:
    """Build FLEX Stacker driver."""
    for i in comports():
        if i.vid == STACKER_VID and i.pid == STACKER_PID:
            print(f"Found FLEX Stacker at port: {i.device}")
            return i.device
    raise RuntimeError("could not find connected FLEX Stacker")


async def get_estop(stacker: FlexStacker) -> bool:
    """Get E-Stop status."""
    if stacker.is_simulated:
        return True

    assert isinstance(stacker._driver, FlexStackerDriver)
    _LS_RE = re.compile(r"^M112 E:(\d)$")
    res = await stacker._driver._connection.send_data("M112\n")
    match = _LS_RE.match(res)
    assert match, f"Incorrect Response for E-Stop switch: {res}"
    return bool(int(match.group(1)))


async def test_limit_switches_per_direction(
    stacker: FlexStacker,
    axis: StackerAxis,
    direction: Direction,
    report: CSVReport,
    section: str,
    speed: float | None = None,
    acceleration: float | None = None,
    current: float | None = None,
) -> None:
    """Sequence to test the limit switch for one direction."""
    polarity = direction.polarity()
    opposite_polarity = direction.opposite().polarity()
    ui.print_header(f"{axis} Limit Switch - {polarity} direction")
    # first make sure switch is not already triggered by moving in the opposite direction
    if await stacker._driver.get_limit_switch(axis, direction):
        print(f"{polarity} switch already triggered, moving away...\n")
        SAFE_DISTANCE_MM = 10

        await stacker.move_axis(
            axis, direction.opposite(), SAFE_DISTANCE_MM, speed, acceleration, current
        )

    # move until the limit switch is reached
    print(f"moving towards {polarity} limit switch...\n")
    await stacker.home_axis(axis, direction, speed, acceleration, current)

    result = await stacker._driver.get_limit_switch(axis, direction)
    opposite_result = not await stacker._driver.get_limit_switch(
        axis, direction.opposite()
    )
    print(f"{polarity} switch triggered: {result}")
    print(f"{opposite_polarity} switch untriggered: {opposite_result}")
    report(
        section,
        f"limit-switch-trigger-{polarity}-untrigger-{opposite_polarity}",
        [result, opposite_result, CSVResult.from_bool(result and opposite_result)],
    )
