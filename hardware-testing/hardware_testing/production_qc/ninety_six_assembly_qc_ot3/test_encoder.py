"""Test Encoder cleanliness."""
from hardware_testing.opentrons_api import helpers_ot3
from typing import List, Union, Literal, Tuple
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.hardware_control.ot3api import OT3API

from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

STALL_THRESHOLD = 0.25


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    pass_fail = [CSVLine("encoder-96-stall", [bool, CSVResult])]
    cycles = [CSVLine("encoder-96-cycles", [int, CSVResult])]
    cumulative_error = [CSVLine("encoder-96-cumulative-error", [float, CSVResult])]
    abs_avg_error = [CSVLine("encoder-96-abs-avg-error", [float, CSVResult])]

    return pass_fail + cycles + cumulative_error + abs_avg_error  # type: ignore [return-value]


async def _plunger_alignment(
    api: OT3API, mount: OT3Mount
) -> Tuple[float, float, float]:
    print("Checking alignment...\n")
    pipette_ax = Axis.of_main_tool_actuator(mount)
    current_pos = await api.current_position_ot3(mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    if abs(stalled_mm) < STALL_THRESHOLD:
        print(f"=== ALIGNED: {stalled_mm} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
    else:
        print(f"=== STALLED: {stalled_mm} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
    return est, enc, stalled_mm


async def run(
    api: OT3API,
    report: CSVReport,
    section: str,
    pipette_size: Literal[200, 1000],
) -> None:
    """Run."""
    cycles = 100
    mount = OT3Mount.LEFT
    await api.cache_instruments()
    await api.home()
    await api.home_plunger(mount)

    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)
    pipette_ax = Axis.of_main_tool_actuator(mount)

    print("Move to bottom position\n")
    await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)

    print("Take initial reading\n")

    init_pos = await api.current_position_ot3(mount, refresh=True)
    print(f"\t>> Open-loop position read: {init_pos[pipette_ax]} mm\n")

    init_encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    print(f"\t>> Encoder read: {init_encoder_pos[pipette_ax]} mm\n")

    # await api.move_rel(mount, delta=Point(z=10))

    cumulative_error = 0.0
    abs_error = 0.0
    completed_moves = 0
    cycle_count = 0
    stall = False

    for cycle in range(cycles):
        print(f"\n=========== Cycle {cycle + 1}/{cycles} ===========\n")

        try:
            print("Move to top plunger position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, top_pos)
            top_est, top_enc, top_diff = await _plunger_alignment(api, mount)
            cumulative_error += top_diff
            abs_error += abs(top_diff)
            completed_moves += 1
            print(f"\t>> Cumulative error:       {cumulative_error} mm")
            print(f"\t>> Absolute error average: {abs_error / completed_moves} mm\n")
        except StallOrCollisionDetectedError as e:
            print(f"Stall or collision detected while moving to top position: {e}")
            stall = True
            print("Stall detected, stopping test.")
            break

        try:
            print("Move to bottom plunger position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
            bot_est, bot_enc, bot_diff = await _plunger_alignment(api, mount)
            cumulative_error += bot_diff
            abs_error += abs(bot_diff)
            completed_moves += 1
            print(f"\t>> Cumulative error:       {cumulative_error} mm")
            print(f"\t>> Absolute error average: {abs_error / completed_moves} mm")
        except StallOrCollisionDetectedError as e:
            print(f"Stall or collision detected while moving to bottom position: {e}")
            stall = True
            print("Stall detected, stopping test.")
            break
        cycle_count += 1

    print("\n=========== Test Complete ===========\n")
    print("\n*******************************************************************\n")
    print("TEST STATS:")
    print(f"\t>> Cycle count:            {cycle_count}/{cycles}")
    print(f"\t>> Total completed moves:  {completed_moves}")
    print(f"\t>> Stall detected:         {stall}")
    print(f"\t>> Cumulative error:       {cumulative_error} mm")
    print(f"\t>> Absolute error average: {abs_error / completed_moves} mm")
    print("\n*******************************************************************\n")
    report(section, "encoder-96-stall", [stall, CSVResult.from_bool(not stall)])
    report(
        section,
        "encoder-96-cycles",
        [cycle_count, CSVResult.from_bool(cycle_count == cycles)],
    )
    report(
        section,
        "encoder-96-cumulative-error",
        [cumulative_error, CSVResult.from_bool(cumulative_error < STALL_THRESHOLD)],
    )
    report(
        section,
        "encoder-96-abs-avg-error",
        [
            abs_error / completed_moves,
            CSVResult.from_bool((abs_error / completed_moves) < STALL_THRESHOLD),
        ],
    )
