import argparse
import asyncio
import csv

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data
from typing import List, Union, Literal, Tuple
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point, Axis

from opentrons.hardware_control.ot3api import OT3API

from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

from hardware_testing.data.csv_report import (
    CSVReport,
    CSVResult,
    CSVLine,
    CSVLineRepeating,
)

STALL_THRESHOLD = 0.25
MOTOR_MM_PER_REV = 2
ENCODER_TICKS_PER_REV = 1000
# there is 4 pulses per tick
PULSE_PER_MM = (4 * ENCODER_TICKS_PER_REV) / MOTOR_MM_PER_REV


def build_csv_lines() -> List[Union[CSVLine, CSVLineRepeating]]:
    """Build CSV Lines."""
    pass_fail = [CSVLine("encoder-96-stall", [bool, CSVResult])]
    cycles = [CSVLine("encoder-96-cycles", [int, CSVResult])]
    cumulative_error = [CSVLine("encoder-96-cumulative-error", [float, CSVResult])]
    abs_avg_error = [CSVLine("encoder-96-abs-avg-error", [float, CSVResult])]
    max_error_mm = [CSVLine("encoder-96-max-error-mm-error", [float])]
    max_error_pulses = [CSVLine("encoder-96-max-error-pulses-error", [float])]
    max_error_ticks = [CSVLine("encoder-96-max-error-ticks-error", [float])]

    return pass_fail + cycles + cumulative_error + abs_avg_error + max_error_mm + max_error_pulses + max_error_ticks  # type: ignore [return-value]


async def _plunger_alignment(
    api: OT3API, mount: OT3Mount
) -> Tuple[float, float, float, float]:
    print("Checking alignment...\n")
    pipette_ax = types.Axis.of_main_tool_actuator(mount)
    current_pos = await api.current_position_ot3(mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    stall_detected = False
    if abs(stalled_mm) < STALL_THRESHOLD:
        print(f"=== ALIGNED: {stalled_mm} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
    else:
        stall_detected = True
        print(f"=== STALLED: {stalled_mm} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
    return est, enc, stalled_mm, stall_detected


async def run(
    api: OT3API,
    report: CSVReport,
    section: str,
    pipette_size: Literal[200, 1000],
) -> None:
    cycles = 5
    mount = types.OT3Mount.LEFT
    await api.cache_instruments()
    await api.home()
    await api.home_plunger(mount)

    pipette = helpers_ot3._get_pipette_from_mount(api, mount)
    test_tag = pipette.name

    test_name = "pipette-mixing-test"

    top_pos, bottom_pos, _, _ = helpers_ot3.get_plunger_positions_ot3(api, mount)
    pipette_ax = types.Axis.of_main_tool_actuator(mount)

    # await api.move_rel(mount, delta=Point(z=10))

    cumulative_error = 0.0
    abs_error = 0.0
    completed_moves = 0
    cycle_count = 0
    stall = False
    max_error_mm = 0.0
    max_error_pulses = 0.0
    max_error_ticks = 0.0
    with open(report.parent / "encoder_debug.csv", "w") as csvfile:
        csv_writer = csv.writer(csvfile)
        csv_writer.writerow(
            [
                "cycle",
                "revolution",
                "direction",
                "encoder position",
                "motor position",
                "encoder_pulses",
                "encoder ticks",
                "diff mm",
                "diff pulses",
                "diff ticks",
            ]
        )
        for cycle in range(cycles):
            print(f"\n=========== Cycle {cycle + 1}/{cycles} ===========\n")
            print("Move to 0 position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, 0)

            print("Take initial reading\n")

            init_pos = await api.current_position_ot3(mount, refresh=True)
            print(f"\t>> Open-loop position read: {init_pos[pipette_ax]} mm\n")

            init_encoder_pos = await api.encoder_current_position_ot3(
                mount, refresh=True
            )
            prev_encoder_tick = (
                init_encoder_pos[pipette_ax] / MOTOR_MM_PER_REV * ENCODER_TICKS_PER_REV
            )
            prev_encoder_pulse = init_encoder_pos[pipette_ax] * PULSE_PER_MM
            print(f"\t>> Encoder read: {init_encoder_pos[pipette_ax]} mm\n")
            for i in range(int((bottom_pos - top_pos) / MOTOR_MM_PER_REV)):
                try:
                    print(f"Move to plunger position {(i + 1) * MOTOR_MM_PER_REV}\n")
                    await helpers_ot3.move_plunger_absolute_ot3(
                        api, mount, (i + 1) * MOTOR_MM_PER_REV
                    )
                    (
                        mot_est,
                        enc_pos,
                        diff,
                        stalled_this_move,
                    ) = await _plunger_alignment(api, mount)
                    next_enc_tick = enc_pos / MOTOR_MM_PER_REV * ENCODER_TICKS_PER_REV
                    next_enc_pulse = enc_pos * PULSE_PER_MM
                    pulse_error = int(abs(next_enc_pulse - prev_encoder_pulse)) - (
                        ENCODER_TICKS_PER_REV * 4
                    )
                    tick_error = (
                        int(abs(next_enc_tick - prev_encoder_tick))
                        - ENCODER_TICKS_PER_REV
                    )
                    print(
                        f"encoder pulse {next_enc_pulse} encoder tick {next_enc_tick}"
                    )
                    print(
                        f"Prev encoder pulse {prev_encoder_pulse} Prev encoder tick {prev_encoder_tick}"
                    )
                    prev_encoder_pulse = next_enc_pulse
                    prev_encoder_tick = next_enc_tick
                    cumulative_error += diff
                    abs_error += abs(diff)
                    max_error_mm = max(abs(diff), max_error_mm)
                    max_error_pulses = max(abs(pulse_error), max_error_pulses)
                    max_error_ticks = max(abs(tick_error), max_error_ticks)
                    completed_moves += 1
                    csv_writer.writerow(
                        [
                            cycle,
                            (i + 1),
                            "down" if cycle == 1 else "up",
                            enc_pos,
                            mot_est,
                            next_enc_pulse,
                            next_enc_tick,
                            diff,
                            pulse_error,
                            tick_error,
                        ]
                    )
                    if stalled_this_move:
                        stall = True
                        print(f"Minor Stall or collision detected")
                        break
                    print(f"\t>> Cumulative error:       {cumulative_error} mm")
                    print(f"\t>> 1 rev error:       {diff} mm")
                    print(f"\t>> pulse_error:       {pulse_error} pulses")
                    print(f"\t>> tick_error:       {tick_error} ticks")
                    print(
                        f"\t>> Absolute error average: {abs_error / completed_moves} mm\n"
                    )
                except StallOrCollisionDetectedError as e:
                    print(
                        f"Stall or collision detected while moving to top position: {e}"
                    )
                    stall = True
                    print("Stall detected, stopping test.")
                    break

            cycle_count += 1
            if stall:
                break

    print("\n=========== Test Complete ===========\n")
    print("\n*******************************************************************\n")
    print("TEST STATS:")
    print(f"\t>> Cycle count:            {cycle_count}/{cycles}")
    print(f"\t>> Total completed moves:  {completed_moves}")
    print(f"\t>> Stall detected:         {stall}")
    print(f"\t>> Cumulative error:       {cumulative_error} mm")
    print(f"\t>> Absolute error average: {abs_error / completed_moves} mm")
    print(f"\t>> max diff: {max_error_mm} mm")
    print(f"\t>> max pulse diff: {max_error_pulses} pulses")
    print(f"\t>> max tick diff: {max_error_ticks} ticks")
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
    report(
        section,
        "encoder-96-max-error-mm-error",
        [
            max_error_mm,
        ],
    )
    report(
        section,
        "encoder-96-max-error-pulses-error",
        [
            max_error_pulses,
        ],
    )
    report(
        section,
        "encoder-96-max-error-ticks-error",
        [
            max_error_ticks,
        ],
    )
