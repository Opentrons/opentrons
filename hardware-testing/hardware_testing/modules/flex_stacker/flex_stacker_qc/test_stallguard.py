"""Test Stall-Guard."""
from typing import List, Union
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.flex_stacker import FlexStacker
from opentrons_shared_data.errors.exceptions import FlexStackerStallError
from opentrons.drivers.flex_stacker.driver import (
    STACKER_MOTION_CONFIG,
    STALLGUARD_CONFIG,
)
from opentrons.drivers.flex_stacker.types import (
    StackerAxis,
    Direction,
)

# The distance from limit switch to limit switch, mm
TEST_DISTANCE = {StackerAxis.X: 193.5, StackerAxis.Z: 137}


def generate_test_thresholds(test_axis: StackerAxis) -> List[int]:
    """Generate test thresholds."""
    thresholds = []
    default_threshold = STALLGUARD_CONFIG[test_axis].threshold
    for sgt in range(default_threshold - 2, default_threshold + 3):
        thresholds.append(sgt)
    return thresholds


def _get_test_tag(test_axis: StackerAxis, sgt: int) -> str:
    """Get test tag."""
    return f"stallguard-{test_axis}-SGT-{sgt}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = []
    for axis in [StackerAxis.X, StackerAxis.Z]:
        for sgt in generate_test_thresholds(axis):
            lines.append(CSVLine(_get_test_tag(axis, sgt), [CSVResult]))
    return lines


async def test_stallguard(
    stacker: FlexStacker, test_axis: StackerAxis, report: CSVReport, section: str
) -> None:
    """Test Stall-Guard."""
    ui.print_header(f"Testing {test_axis} Axis")

    for sgt in generate_test_thresholds(test_axis):
        ui.print_header(f"Testing Stallguard Threshold: {sgt}")
        await stacker._driver.set_stallguard_threshold(test_axis, True, sgt)
        stall_detected = False
        try:
            await stacker.move_axis(
                test_axis,
                Direction.RETRACT,
                TEST_DISTANCE[test_axis],
                STACKER_MOTION_CONFIG[test_axis]["move"].move_params.max_speed,
                STACKER_MOTION_CONFIG[test_axis]["move"].move_params.acceleration,
                STACKER_MOTION_CONFIG[test_axis]["move"].run_current,
            )
        except FlexStackerStallError:
            ui.print_info("Stall Detected")
            stall_detected = True
            await stacker._driver.set_stallguard_threshold(test_axis, False, 0)

        await stacker.home_axis(test_axis, Direction.EXTEND)

        report(
            section,
            _get_test_tag(test_axis, sgt),
            [CSVResult.from_bool(stall_detected)],
        )

    # Restore default stallguard threshold
    await stacker._driver.set_stallguard_threshold(
        test_axis, True, STALLGUARD_CONFIG[test_axis].threshold
    )

    return


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    # Home to retract position if we are not already on the switch
    if not await stacker._driver.get_limit_switch(StackerAxis.X, Direction.RETRACT):
        await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    if not await stacker._driver.get_limit_switch(StackerAxis.Z, Direction.RETRACT):
        await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)

    # Put the axes in the extended position to prepare for testing
    await stacker.home_axis(StackerAxis.Z, Direction.EXTEND)
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)

    # Prompt operator to place the crash block into the stacker
    if not stacker.is_simulated:
        ui.get_user_ready("Place the crash block into the stacker")

    # Test Axes
    await test_stallguard(stacker, StackerAxis.X, report, section)
    await test_stallguard(stacker, StackerAxis.Z, report, section)

    # Prompt operator to remove the crash block
    if not stacker.is_simulated:
        ui.get_user_ready("Remove the crash block from the stacker")

    # Attetmpt to rehome
    test_reset = False
    while not test_reset:
        try:
            await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
            await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
            test_reset = True
        except FlexStackerStallError:
            # Double check if crash block was actually removed
            await stacker._driver.set_stallguard_threshold(StackerAxis.Z, False, 0)
            await stacker._driver.set_stallguard_threshold(StackerAxis.X, False, 0)
            await stacker._driver.set_stallguard_threshold(
                StackerAxis.Z, True, STALLGUARD_CONFIG[StackerAxis.Z].threshold
            )
            await stacker._driver.set_stallguard_threshold(
                StackerAxis.X, True, STALLGUARD_CONFIG[StackerAxis.X].threshold
            )
            if not stacker.is_simulated:
                ui.get_user_ready("Remove the crash block from the stacker")
