"""Test Stall-Guard."""
from typing import List, Union, Tuple, Optional
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from .driver import FlexStackerInterface as FlexStacker, FlexStackerStallError
from opentrons.drivers.flex_stacker.driver import (
    STACKER_MOTION_CONFIG,
    STALLGUARD_CONFIG,
)
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction

 # The distance from limit switch to limit switch, mm
TEST_DISTANCE = {StackerAxis.X: 193.5, StackerAxis.Z: 137} 

def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    return [
        CSVLine(
            "stallguard-x", [CSVResult]
        ),
        CSVLine(
            "stallguard-z", [CSVResult]
        ),
    ]

async def test_stallguard(stacker: FlexStacker, test_axis: StackerAxis) -> bool: 
    """Test Stall-Guard."""
    success = False
    try:
        await stacker.move_axis(
            test_axis,
            Direction.RETRACT,
            TEST_DISTANCE[test_axis],
            STACKER_MOTION_CONFIG[test_axis]["move"].move_params.max_speed,
            STACKER_MOTION_CONFIG[test_axis]["move"].move_params.acceleration,
            STACKER_MOTION_CONFIG[test_axis]["move"].run_current,
        )
    except FlexStackerStallError as e:
        ui.print_info("Stall Detected")
        success = True

    await stacker.home_axis(test_axis, Direction.EXTEND)
    return success

    


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    # Home to retract position if we are not already on the switch
    # if not await stacker._driver.get_limit_switch(StackerAxis.X, Direction.RETRACT):
    #     await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
    # if not await stacker._driver.get_limit_switch(StackerAxis.Z, Direction.RETRACT):
    #     await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)

    # Put the axes in the extended position to prepare for testing
    await stacker.home_axis(StackerAxis.Z, Direction.EXTEND)
    await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
    
    # Prompt operator to place the crash block into the stacker
    if not stacker._simulating:
        ui.get_user_ready("Place the crash block into the stacker.")

    ui.print_header("Testing X Axis")
    x_result = await test_stallguard(stacker, StackerAxis.X)
    report(section, f"stallguard-x", [CSVResult.from_bool(x_result)])

    ui.print_header("Testing Z Axis")
    z_result = await test_stallguard(stacker, StackerAxis.Z)
    report(section, f"stallguard-z", [CSVResult.from_bool(z_result)])

    # Prompt operator to remove the crash block
    if not stacker._simulating:
        ui.get_user_ready("Remove the crash block from the stacker.")
    
    # Attetmpt to rehome
    test_reset = False
    while not test_reset:
        try:
            await stacker.home_axis(StackerAxis.X, Direction.RETRACT)
            await stacker.home_axis(StackerAxis.Z, Direction.RETRACT)
            test_reset = True
        except FlexStackerStallError as e:
            # Double check if crash block was actually removed
            await stacker.home_axis(StackerAxis.Z, Direction.EXTEND)
            await stacker.home_axis(StackerAxis.X, Direction.EXTEND)
            if not stacker._simulating:
                ui.get_user_ready("Remove the crash block from the stacker.")


