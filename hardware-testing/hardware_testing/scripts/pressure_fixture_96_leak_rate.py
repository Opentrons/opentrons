"""Standalone 96-channel pressure fixture leak-rate check."""
from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from time import monotonic, sleep
from typing import List, Optional, Sequence

from hardware_testing.drivers.pressure_fixture import (
    FIXTURE_NUM_CHANNELS_96,
    PressureFixture,
    PressureFixtureBase,
    connect_to_fixture96,
)


ROWS = "ABCDEFGH"
COLS = 12
DEFAULT_DURATION_SECONDS = 60.0
DEFAULT_SAMPLE_DELAY_SECONDS = 1.0
DEFAULT_TRIM_COUNT = 1


@dataclass
class PressureSample:
    """One 96-channel fixture sample."""

    target_s: float
    elapsed_s: float
    readings: List[float]


@dataclass
class LeakRateResult:
    """Leak-rate summary for one channel."""

    run_label: str
    well: str
    channel: int
    sample_count: int
    window_s: float
    trim_count: int
    minimum_pa: float
    maximum_pa: float
    span_pa: float
    leak_rate_pa_per_s: float
    leak_rate_pa_per_60s: float
    first_pa: float
    last_pa: float
    delta_pa: float
    slope_pa_per_s: float


def channel_to_well(channel: int) -> str:
    """Convert a 1-based channel number to a row-major 96-well name."""
    if channel < 1 or channel > FIXTURE_NUM_CHANNELS_96:
        raise ValueError(f"Channel must be 1-96, got {channel}")
    index = channel - 1
    row = ROWS[index // COLS]
    col = (index % COLS) + 1
    return f"{row}{col}"


def well_to_channel(well: str) -> int:
    """Convert a 96-well name to a 1-based channel number."""
    well = well.strip().upper()
    if len(well) < 2:
        raise ValueError(f"Invalid well: {well!r}")
    row = well[0]
    if row not in ROWS:
        raise ValueError(f"Invalid well row in {well!r}; expected A-H")
    try:
        col = int(well[1:])
    except ValueError as err:
        raise ValueError(f"Invalid well column in {well!r}; expected 1-12") from err
    if col < 1 or col > COLS:
        raise ValueError(f"Invalid well column in {well!r}; expected 1-12")
    return ROWS.index(row) * COLS + col


def _split_cli_values(values: Optional[Sequence[str]]) -> List[str]:
    if not values:
        return []
    split_values: List[str] = []
    for value in values:
        split_values.extend(part.strip() for part in value.split(",") if part.strip())
    return split_values


def selected_channels(args: argparse.Namespace) -> List[int]:
    """Return selected channels in input order, without duplicates."""
    channels: List[int] = []
    for well in _split_cli_values(args.well):
        channels.append(well_to_channel(well))
    for channel_text in _split_cli_values(args.channel):
        try:
            channels.append(int(channel_text))
        except ValueError as err:
            raise ValueError(
                f"Invalid channel {channel_text!r}; expected 1-96"
            ) from err
    if args.all or not channels:
        channels = list(range(1, FIXTURE_NUM_CHANNELS_96 + 1))

    seen = set()
    unique_channels = []
    for channel in channels:
        if channel < 1 or channel > FIXTURE_NUM_CHANNELS_96:
            raise ValueError(f"Channel must be 1-96, got {channel}")
        if channel not in seen:
            unique_channels.append(channel)
            seen.add(channel)
    return unique_channels


def connect_fixture(args: argparse.Namespace) -> PressureFixtureBase:
    """Connect to the 96-channel pressure fixture."""
    if args.port:
        fixture = PressureFixture.create(port=args.port, slot_side=args.side)
        fixture.connect_96()
        print(f"Found fixture on port {args.port}")
        return fixture
    return connect_to_fixture96(args.simulate, side=args.side)


def _format_channel_value(channel: int, readings: Sequence[float]) -> str:
    return f"{channel_to_well(channel)}/CH{channel}={readings[channel - 1]:.2f}Pa"


def print_pressure_snapshot(
    run_label: str,
    sample_index: int,
    sample: PressureSample,
    display_channels: Sequence[int],
) -> None:
    """Print the pressure values for one sample."""
    prefix = (
        f"{run_label}: sample={sample_index} target={sample.target_s:.0f}s "
        f"elapsed={sample.elapsed_s:.2f}s"
    )
    if len(display_channels) <= 24:
        values = " ".join(
            _format_channel_value(channel, sample.readings)
            for channel in display_channels
        )
        print(f"{prefix} {values}", flush=True)
        return

    print(prefix, flush=True)
    selected = set(display_channels)
    print("       " + "".join(f"{col:>9}" for col in range(1, COLS + 1)), flush=True)
    for row_index, row in enumerate(ROWS):
        row_values = []
        for col in range(1, COLS + 1):
            channel = row_index * COLS + col
            if channel in selected:
                row_values.append(f"{sample.readings[channel - 1]:>9.2f}")
            else:
                row_values.append(f"{'-':>9}")
        print(f"{row}: " + "".join(row_values), flush=True)


def collect_samples(
    fixture: PressureFixtureBase,
    duration_s: float,
    sample_delay_s: float,
    run_label: str,
    display_channels: Sequence[int],
) -> List[PressureSample]:
    """Collect all 96 channels for a fixed duration."""
    samples: List[PressureSample] = []
    start = monotonic()
    sample_index = 0
    while True:
        target_s = sample_index * sample_delay_s
        target_time = start + target_s
        delay_s = target_time - monotonic()
        if delay_s > 0:
            sleep(delay_s)

        readings = fixture.read_all_pressure_channel_96()
        if len(readings) != FIXTURE_NUM_CHANNELS_96:
            raise RuntimeError(
                f"Expected {FIXTURE_NUM_CHANNELS_96} pressure values, "
                f"got {len(readings)}"
            )
        elapsed_s = monotonic() - start
        sample = PressureSample(
            target_s=target_s,
            elapsed_s=elapsed_s,
            readings=readings,
        )
        samples.append(sample)
        print_pressure_snapshot(run_label, sample_index + 1, sample, display_channels)

        if target_s >= duration_s:
            break
        sample_index += 1
    return samples


def _trimmed(values: List[float], trim_count: int) -> List[float]:
    sorted_values = sorted(values)
    if trim_count > 0 and len(sorted_values) > trim_count * 2:
        return sorted_values[trim_count:-trim_count]
    return sorted_values


def calculate_leak_rate(
    samples: Sequence[PressureSample],
    channel: int,
    run_label: str,
    trim_count: int,
) -> LeakRateResult:
    """Calculate leak rate for one 1-based channel."""
    if not samples:
        raise ValueError("No samples collected")
    index = channel - 1
    values = [sample.readings[index] for sample in samples]
    calc_values = _trimmed(values, trim_count)
    window_s = samples[-1].elapsed_s - samples[0].elapsed_s
    if window_s <= 0:
        window_s = samples[-1].elapsed_s
    if window_s <= 0:
        window_s = 1.0

    minimum_pa = min(calc_values)
    maximum_pa = max(calc_values)
    span_pa = maximum_pa - minimum_pa
    leak_rate_pa_per_s = span_pa / window_s
    first_pa = values[0]
    last_pa = values[-1]
    delta_pa = last_pa - first_pa
    return LeakRateResult(
        run_label=run_label,
        well=channel_to_well(channel),
        channel=channel,
        sample_count=len(values),
        window_s=window_s,
        trim_count=trim_count,
        minimum_pa=minimum_pa,
        maximum_pa=maximum_pa,
        span_pa=span_pa,
        leak_rate_pa_per_s=leak_rate_pa_per_s,
        leak_rate_pa_per_60s=leak_rate_pa_per_s * 60.0,
        first_pa=first_pa,
        last_pa=last_pa,
        delta_pa=delta_pa,
        slope_pa_per_s=delta_pa / window_s,
    )


def default_output_path(kind: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return Path(f"pressure_fixture_96_leak_{kind}_{timestamp}.csv")


def write_raw_samples(
    output_path: Path,
    sample_runs: Sequence[tuple[str, Sequence[PressureSample]]],
) -> None:
    """Write raw 96-channel samples."""
    header = ["run_label", "sample_index", "target_s", "elapsed_s"] + [
        f"CH{channel}_{channel_to_well(channel)}"
        for channel in range(1, FIXTURE_NUM_CHANNELS_96 + 1)
    ]
    with output_path.open("w", newline="") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(header)
        for run_label, samples in sample_runs:
            for index, sample in enumerate(samples, start=1):
                writer.writerow(
                    [
                        run_label,
                        index,
                        f"{sample.target_s:.3f}",
                        f"{sample.elapsed_s:.3f}",
                    ]
                    + [f"{reading:.2f}" for reading in sample.readings]
                )


def write_summary(output_path: Path, results: Sequence[LeakRateResult]) -> None:
    """Write leak-rate summary rows."""
    header = [
        "run_label",
        "well",
        "channel",
        "sample_count",
        "window_s",
        "trim_count",
        "min_pa",
        "max_pa",
        "span_pa",
        "leak_rate_pa_per_s",
        "leak_rate_pa_per_60s",
        "first_pa",
        "last_pa",
        "delta_pa",
        "slope_pa_per_s",
    ]
    with output_path.open("w", newline="") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(header)
        for result in results:
            writer.writerow(
                [
                    result.run_label,
                    result.well,
                    result.channel,
                    result.sample_count,
                    f"{result.window_s:.3f}",
                    result.trim_count,
                    f"{result.minimum_pa:.2f}",
                    f"{result.maximum_pa:.2f}",
                    f"{result.span_pa:.2f}",
                    f"{result.leak_rate_pa_per_s:.4f}",
                    f"{result.leak_rate_pa_per_60s:.2f}",
                    f"{result.first_pa:.2f}",
                    f"{result.last_pa:.2f}",
                    f"{result.delta_pa:.2f}",
                    f"{result.slope_pa_per_s:.4f}",
                ]
            )


def print_results(results: Sequence[LeakRateResult]) -> None:
    """Print a compact terminal summary."""
    print(
        "run_label, well, channel, samples, window_s, min_pa, max_pa, "
        "span_pa, leak_rate_pa_per_60s, first_pa, last_pa, delta_pa"
    )
    for result in results:
        print(
            f"{result.run_label}, {result.well}, CH{result.channel}, "
            f"{result.sample_count}, {result.window_s:.1f}, "
            f"{result.minimum_pa:.2f}, {result.maximum_pa:.2f}, "
            f"{result.span_pa:.2f}, {result.leak_rate_pa_per_60s:.2f}, "
            f"{result.first_pa:.2f}, {result.last_pa:.2f}, "
            f"{result.delta_pa:.2f}"
        )


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Measure 60-second leak rate from the 96-channel pressure fixture. "
            "Channel mapping is row-major: CH1=A1, CH12=A12, CH13=B1, CH96=H12."
        )
    )
    parser.add_argument("--simulate", action="store_true", help="Use simulated data.")
    parser.add_argument("--port", help="Serial port. If omitted, auto-search ports.")
    parser.add_argument("--side", choices=["left", "right"], default="left")
    parser.add_argument(
        "--duration",
        type=float,
        default=DEFAULT_DURATION_SECONDS,
        help="Sampling duration in seconds for each run. Default: 60.",
    )
    parser.add_argument(
        "--sample-delay",
        type=float,
        default=DEFAULT_SAMPLE_DELAY_SECONDS,
        help="Delay target between samples in seconds. Default: 1.",
    )
    parser.add_argument(
        "--trim",
        type=int,
        default=DEFAULT_TRIM_COUNT,
        help="Trim this many low/high outliers before span calculation. Default: 1.",
    )
    parser.add_argument(
        "--well",
        action="append",
        help="Target well(s), for example C6 or C5,C6,C7. May be repeated.",
    )
    parser.add_argument(
        "--channel",
        action="append",
        help="Target channel(s), for example 30 or 29,30,31. May be repeated.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Summarize all 96 channels. This is the default when no target is given.",
    )
    parser.add_argument(
        "--walk",
        action="store_true",
        help="Test selected channels one-by-one, prompting before each 60s run.",
    )
    parser.add_argument(
        "--no-prompt",
        action="store_true",
        help="Start each run without waiting for Enter.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Summary CSV path. Default: timestamped CSV in current directory.",
    )
    parser.add_argument(
        "--raw-output",
        type=Path,
        default=None,
        help="Raw sample CSV path. Default: timestamped CSV in current directory.",
    )
    parser.add_argument(
        "--no-raw",
        action="store_true",
        help="Do not write raw 96-channel sample CSV.",
    )
    return parser


def main() -> None:
    args = build_arg_parser().parse_args()
    if args.duration <= 0:
        raise ValueError("--duration must be greater than 0")
    if args.sample_delay <= 0:
        raise ValueError("--sample-delay must be greater than 0")
    if args.trim < 0:
        raise ValueError("--trim must be greater than or equal to 0")

    channels = selected_channels(args)
    summary_path = args.output or default_output_path("summary")
    raw_path = None if args.no_raw else (args.raw_output or default_output_path("raw"))

    fixture = connect_fixture(args)
    all_results: List[LeakRateResult] = []
    sample_runs: List[tuple[str, Sequence[PressureSample]]] = []
    try:
        if args.walk:
            for channel in channels:
                well = channel_to_well(channel)
                run_label = f"{well}_CH{channel}"
                if not args.no_prompt:
                    input(f"Seal {well} / CH{channel}, then press Enter to start...")
                samples = collect_samples(
                    fixture,
                    args.duration,
                    args.sample_delay,
                    run_label,
                    [channel],
                )
                sample_runs.append((run_label, samples))
                result = calculate_leak_rate(
                    samples, channel, run_label, args.trim
                )
                all_results.append(result)
                print_results([result])
        else:
            run_label = "all_channels"
            if not args.no_prompt:
                target_text = ", ".join(
                    f"{channel_to_well(channel)}/CH{channel}" for channel in channels
                )
                input(f"Prepare target channel(s) {target_text}, then press Enter...")
            samples = collect_samples(
                fixture,
                args.duration,
                args.sample_delay,
                run_label,
                channels,
            )
            sample_runs.append((run_label, samples))
            all_results.extend(
                calculate_leak_rate(samples, channel, run_label, args.trim)
                for channel in channels
            )
            print_results(all_results)
    finally:
        fixture.disconnect()

    write_summary(summary_path, all_results)
    print(f"Summary CSV: {summary_path}")
    if raw_path is not None:
        write_raw_samples(raw_path, sample_runs)
        print(f"Raw sample CSV: {raw_path}")


if __name__ == "__main__":
    main()
