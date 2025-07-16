"""Test E-Stop."""


from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .utils import get_estop
from opentrons.drivers.flex_stacker.types import Direction, StackerAxis
from opentrons.drivers.flex_stacker.errors import EStopTriggered
from opentrons.hardware_control.modules.flex_stacker import FlexStacker

X_DISTANCE = 5
L_DISTANCE = 5


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine("trigger-estop", [CSVResult]),
        CSVLine("x-move-disabled", [CSVResult]),
        CSVLine("z-move-disabled", [CSVResult]),
        CSVLine("l-move-disabled", [CSVResult]),
        CSVLine("untrigger-estop", [CSVResult]),
    ]


async def axis_at_limit(stacker: FlexStacker, axis: StackerAxis) -> Direction:
    """Check which direction an axis is at the limit switch."""
    if stacker.is_simulated:
        return Direction.RETRACT

    if axis is StackerAxis.L:
        # L axis only has one limit switch
        triggered = await stacker._driver.get_limit_switch(axis, Direction.RETRACT)
        if triggered:
            print(axis, "is at ", Direction.RETRACT, "limit switch")
            return Direction.RETRACT
    else:
        for dir in Direction:
            if await stacker._driver.get_limit_switch(axis, dir):
                print(axis, "is at ", dir, "limit switch")
                return dir
    raise RuntimeError(f"{axis} is not at any limit switch")


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    # Get the direction of each axis that is at the limit switch
    x_limit = await axis_at_limit(stacker, StackerAxis.X)
    z_limit = await axis_at_limit(stacker, StackerAxis.Z)
    l_limit = await axis_at_limit(stacker, StackerAxis.L)

    # Move the X and L axis off the limit switch
    await stacker._driver.move_in_mm(
        StackerAxis.X, x_limit.opposite().distance(X_DISTANCE)
    )
    await stacker._driver.move_in_mm(
        StackerAxis.L, l_limit.opposite().distance(L_DISTANCE)
    )

    ui.print_header("Trigger E-Stop")
    if not stacker.is_simulated:
        ui.get_user_ready("Trigger the E-Stop")

        if not await get_estop(stacker):
            print("E-Stop is not triggered")
            report(section, "trigger-estop", [CSVResult.FAIL])
            return

    report(section, "trigger-estop", [CSVResult.PASS])

    print("Check X limit switch...")
    limit_switch_triggered = await stacker._driver.get_limit_switch(
        StackerAxis.X, x_limit
    )
    if limit_switch_triggered:
        ui.print_error("X axis is still on the limit switch")
        report(
            section,
            "x-move-disabled",
            [CSVResult.from_bool(False)],
        )
    else:
        print("try to move X axis back to the limit switch...")
        try:
            await stacker._driver.move_in_mm(
                StackerAxis.X, x_limit.distance(X_DISTANCE)
            )
        except EStopTriggered:
            print("E-Stop Error is raised")
        triggered = await stacker._driver.get_limit_switch(StackerAxis.X, x_limit)
        report(
            section,
            "x-move-disabled",
            [CSVResult.from_bool(not triggered)],
        )

    # The Z axis brake should hold the axis on the limit switch when in E-Stop
    print("try to move Z axis...")
    try:
        await stacker._driver.move_in_mm(StackerAxis.Z, z_limit.opposite().distance(10))
    except EStopTriggered:
        print("E-Stop Error is raised")
    triggered = await stacker._driver.get_limit_switch(StackerAxis.Z, z_limit)
    report(
        section,
        "z-move-disabled",
        [CSVResult.from_bool(triggered)],
    )

    print("Check L limit switch...")
    limit_switch_triggered = await stacker._driver.get_limit_switch(
        StackerAxis.L, l_limit
    )
    if limit_switch_triggered:
        ui.print_error("L axis is still on the limit switch")
        report(
            section,
            "l-move-disabled",
            [CSVResult.from_bool(False)],
        )
    else:
        print("try to move L axis back to the limit switch...")
        try:
            await stacker._driver.move_in_mm(
                StackerAxis.L, l_limit.distance(L_DISTANCE)
            )
        except EStopTriggered:
            print("E-Stop Error is raised")
        triggered = await stacker._driver.get_limit_switch(StackerAxis.L, l_limit)
        report(
            section,
            "l-move-disabled",
            [CSVResult.from_bool(not triggered)],
        )

    if not stacker.is_simulated:
        ui.get_user_ready("Untrigger the E-Stop")
    estop_released = not await get_estop(stacker)
    report(section, "untrigger-estop", [CSVResult.from_bool(estop_released)])

    await stacker.home_axis(StackerAxis.X, x_limit)
    await stacker.home_axis(StackerAxis.L, l_limit)
    await stacker.home_axis(StackerAxis.Z, z_limit)
