"""Test L Axis."""
from typing import List, Union, Tuple, Optional
from hardware_testing.data import ui
from hardware_testing.data.csv_report import (
    CSVReport,
    CSVLine,
    CSVLineRepeating,
    CSVResult,
)

from opentrons.hardware_control.modules.flex_stacker import (
    MAX_TRAVEL,
    FlexStacker,
    STACKER_MOTION_CONFIG,
)
from opentrons.drivers.flex_stacker.types import StackerAxis, Direction
from opentrons_shared_data.errors.exceptions import FlexStackerStallError

TEST_AXIS = StackerAxis.L
HOME_SPEED = STACKER_MOTION_CONFIG[TEST_AXIS]["home"].move_params.max_speed
HOME_CURRENT = STACKER_MOTION_CONFIG[TEST_AXIS]["home"].run_current

TEST_SPEEDS = [50, 100, 150]  # mm/s
TEST_CURRENTS = [1.5, 1.2, 0.8, 0.3]  # A rms
TEST_ACCELERATION = STACKER_MOTION_CONFIG[TEST_AXIS]["move"].move_params.acceleration
CURRENT_THRESHOD = 0.8  # A rms
TEST_TRIALS = 5

# All units in mm

# The distance from retracted to extended limit switch
AXIS_TRAVEL = MAX_TRAVEL[TEST_AXIS]
OFFSET = 2  # The distance to be off the springs from the limit switch
AXIS_TOLERANCE = 0.5  # Distance tolerance of AXIS_TRAVEL in ONE direction
LIMIT_SWICH_CHECK = 0.1
MOVEMENT_TOLERANCE = 0.5  # Maximum allowed movement error in ONE direction


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    lines: List[Union[CSVLine, CSVLineRepeating]] = []
    for speed in TEST_SPEEDS:
        for current in TEST_CURRENTS:
            tag = f"speed-{speed}-current-{current}"
            lines.append(
                CSVLine(f"{tag}-success-failed-pass%", [int, int, float, CSVResult])
            )
            lines.append(CSVLine(f"{tag}-extend-distance", [float] * TEST_TRIALS))
            lines.append(CSVLine(f"{tag}-retract-distance", [float] * TEST_TRIALS))
    return lines


async def test_cycle_per_direction(
    stacker: FlexStacker,
    direction: Direction,
    speed: int,
    current: float,
) -> Tuple[bool, float]:
    """Test one cycle."""
    # latch does not have extend limit switch, so we have to cycle the test
    await stacker.open_latch()

    # Move at homing speed off the springs
    await stacker.move_axis(
        TEST_AXIS, direction, OFFSET, HOME_SPEED, None, HOME_CURRENT
    )

    try:
        # moving at the testing speed and current to just before the springs
        # minus the tolerances
        test_distance = AXIS_TRAVEL - (2 * OFFSET) - AXIS_TOLERANCE - MOVEMENT_TOLERANCE
        await stacker.move_axis(
            TEST_AXIS, direction, test_distance, speed, TEST_ACCELERATION, current
        )

        # Move to the farthest position the limit switch could be
        check_distance = OFFSET + 2 * AXIS_TOLERANCE + 2 * MOVEMENT_TOLERANCE
        try:
            await stacker.move_axis(
                TEST_AXIS,
                direction,
                check_distance,
                HOME_SPEED,
                0,
                HOME_CURRENT,
            )
        except Exception:
            pass

        # Limit switch only has a retract limit switch
        if await stacker._driver.get_limit_switch(TEST_AXIS, Direction.RETRACT):
            # The limit switch was triggered within this amount of distance
            movement_distance = round(
                (AXIS_TRAVEL + OFFSET + AXIS_TOLERANCE + MOVEMENT_TOLERANCE), 1
            )
            ui.print_info(
                f"{TEST_AXIS.name} Axis, {direction}, PASS, {speed}mm/s, {current}A, {movement_distance}mm"
            )
            return True, movement_distance
    except FlexStackerStallError:
        ui.print_error("unexpected axis stall!")
    # If we reach this point, limit switch did not trigger in expected distance
    # Probable stall, Movement distance is unknown, return 0
    return False, 0


async def run(stacker: FlexStacker, report: CSVReport, section: str) -> None:
    """Run."""
    # Home to closed position
    await stacker.home_axis(TEST_AXIS, Direction.RETRACT)

    for speed in TEST_SPEEDS:
        for current in TEST_CURRENTS:
            tag = f"speed-{speed}-current-{current}"
            ui.print_header(
                f"{TEST_AXIS.name} Speed: {speed} mm/s, Current: {current} A"
            )
            trial = 0
            failures = 0
            extend_data: List[Optional[float]] = [None] * TEST_TRIALS
            retract_data: List[Optional[float]] = [None] * TEST_TRIALS
            # Home to closed position
            await stacker.home_axis(TEST_AXIS, Direction.RETRACT)
            while trial < TEST_TRIALS:
                # Can only test retract direction
                retract, dist = await test_cycle_per_direction(
                    stacker, Direction.RETRACT, speed, current
                )
                extend_data[trial] = dist
                if not retract:
                    ui.print_error(
                        f"{TEST_AXIS.name} Axis retract failed at speed {speed} mm/s, "
                        f"current {current} A, Distance {dist} mm"
                    )
                    failures += 1
                    trial += 1
                    continue
                trial += 1

            success_trials = trial - failures
            success_rate = (1 - failures / trial) * 100
            if current >= CURRENT_THRESHOD:
                # If current is above threshold, all trials must pass
                result = CSVResult.from_bool(success_rate == 100.0)
            else:
                result = CSVResult.PASS
            report(
                section,
                f"{tag}-success-failed-pass%",
                [success_trials, failures, success_rate, result],
            )
            report(section, f"{tag}-extend-distance", extend_data)
            report(section, f"{tag}-retract-distance", retract_data)

            # Stop the test if any trial fails
            if result == CSVResult.FAIL:
                ui.print_error(
                    f"{TEST_AXIS.name} Axis failed at speed {speed} mm/s, current {current} A"
                )
                return

    # End test with the latch closed
    await stacker.home_axis(TEST_AXIS, Direction.RETRACT)
