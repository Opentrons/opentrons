"""Test Stall-Guard."""
from typing import List, Union, Any
from hardware_testing.data import ui
import asyncio
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
TEST_DISTANCE = {StackerAxis.X: 300, StackerAxis.Z: 200}
TRIALS = 50
TEST_DIRECTION = Direction.RETRACT

def generate_test_thresholds(test_axis: StackerAxis) -> List[int]:
    """Generate test thresholds."""
    thresholds = []
    # default_threshold = STALLGUARD_CONFIG[test_axis].threshold
    default_threshold = 0
    # for sgt in range(default_threshold - 2, default_threshold + 3):
    #     thresholds.append(sgt)
    for sgt in range(default_threshold, default_threshold + 5):
        for c in range(1, TRIALS+1):
            thresholds.append((c, sgt))
    ui.print_info(f"Generated threshold for {test_axis}: {thresholds}")
    return thresholds


def _get_test_tag(trial: int, test_axis: StackerAxis, sgt: int) -> str:
    """Get test tag."""
    return f"stallguard-{test_axis}-SGT-({sgt})-trial-{trial}"


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = []
    for axis in [StackerAxis.X, StackerAxis.Z]:
        for sgt in generate_test_thresholds(axis):
            lines.append(CSVLine(_get_test_tag(sgt[0], axis, sgt[1]), [CSVResult]))
    return lines

async def move(stacker: FlexStacker, test_axis: StackerAxis) -> Any:
    """Move the stacker axis in the specified direction and distance"""
    try:
        print('Stacker Moving')
        # Move the stacker axis
        result = await stacker.move_axis(test_axis,
                                TEST_DIRECTION,
                                TEST_DISTANCE[test_axis],
                                STACKER_MOTION_CONFIG[test_axis]["move"].move_params.max_speed,
                                STACKER_MOTION_CONFIG[test_axis]["move"].move_params.acceleration,
                                STACKER_MOTION_CONFIG[test_axis]["move"].run_current
                    )
        return result
    except Exception as e:
        ui.print_header(f"Motor Stall detected: {e}")
        return e
    
async def home(stacker: FlexStacker, test_axis: StackerAxis) -> Any:
    """Move the stacker axis in the specified direction and distance"""
    try:
        print('Stacker Moving')
        # Move the stacker axis
        result = await stacker.home_axis(test_axis, TEST_DIRECTION)
        return result
    except Exception as e:
        ui.print_header(f"Motor Stall detected: {e}")
        return e

async def test_stallguard(
    stacker: FlexStacker, test_axis: StackerAxis, report: CSVReport, section: str
) -> None:
    """Test Stall-Guard."""
    ui.print_header(f"Testing {test_axis} Axis")
    ui.print_header(f"{generate_test_thresholds(test_axis)}")
    csv_result = []
    for sgt in generate_test_thresholds(test_axis):
        ui.print_header(f"Testing Stallguard Threshold: {sgt[1]}")
        await stacker._driver.set_stallguard_threshold(test_axis, True, sgt[1])
        await asyncio.sleep(1)
        stall_detected = False
        move_task = asyncio.create_task(move(stacker, test_axis))
        # move_task = asyncio.create_task(home(stacker, test_axis))
        try:
            sg_state = await asyncio.gather(move_task, return_exceptions=True)
            ui.print_info(f"Move Result: {sg_state}")
            ui.print_info(f"test: {isinstance(sg_state[0], FlexStackerStallError)}")
            if isinstance(sg_state[0], FlexStackerStallError) == True:
                stall_detected = True
                ui.print_info(f"Stallguard detected a stall at threshold {sgt[1]} for {test_axis} axis")
            if isinstance(sg_state[0], bool) == True:
                stall_detected = False
                ui.print_error(f"StallGuard did not TRIGGER: {sg_state}")
            await asyncio.sleep(1) # Allow time for the stacker to recover from the stall
            await stacker._driver.set_stallguard_threshold(test_axis, False, 0)
            await asyncio.sleep(1) # Allow time for the stacker to recover from the stall
        except Exception as e:
            ui.print_info(f"Exception: {e}")
            stall_detected = False
        if TEST_DIRECTION == Direction.RETRACT:
            Dir = Direction.EXTEND
        else:
            Dir = Direction.RETRACT
        await stacker.home_axis(test_axis, Dir)
        csv_result.append(CSVResult.from_bool(stall_detected))
        # success = [CSVResult.from_bool(stall_detected)]
        ui.print_info(f"Stallguard state: {csv_result}")

        report(section, _get_test_tag(sgt[0], test_axis, sgt[1]), [CSVResult.from_bool(stall_detected)])

    # Restore default stallguard threshold
    await stacker._driver.set_stallguard_threshold(
        test_axis, True, STALLGUARD_CONFIG[test_axis].threshold
    )
    await asyncio.sleep(1) # Allow time for the stacker to recover from the stall
    return


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    # Home to retract position if we are not already on the switch
    # if not await stacker._driver.get_limit_switch(StackerAxis.X, Direction.RETRACT):
    #     await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    # if not await stacker._driver.get_limit_switch(StackerAxis.Z, Direction.RETRACT):
    #     await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
    # Put the axes in the extended position to prepare for testing
    if TEST_DIRECTION == Direction.RETRACT:
        await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
        await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    else:
        await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
        await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    # Prompt operator to place the crash block into the stacker
    if not stacker.is_simulated:
        ui.get_user_ready("Place the crash block into the stacker")

    # Test Axes
    await test_stallguard(stacker, StackerAxis.X, report, section)
    # await test_stallguard(stacker, StackerAxis.Z, report, section)

    # Prompt operator to remove the crash block
    if not stacker.is_simulated:
        ui.get_user_ready("Remove the crash block from the stacker")

    # Attetmpt to rehome
    test_reset = False
    while not test_reset:
        try:
            if TEST_DIRECTION == Direction.RETRACT:
                await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
                await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
            else:
                await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
                await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
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
