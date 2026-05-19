"""96-channel pressure fixture leak-rate test for P1000S/P1000M."""

from __future__ import annotations

import argparse
import asyncio
import csv
import math
import statistics
from dataclasses import dataclass
from pathlib import Path
from time import time
from typing import Dict, List, Literal, Optional, Sequence, Tuple, cast

from hardware_testing import data
from hardware_testing.data import ui
from hardware_testing.drivers.pressure_fixture import PressureFixtureBase, connect_to_fixture96
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point
from opentrons.hardware_control.ot3api import OT3API
from hardware_testing.production_qc.pressure import (
    PRESSURE_FIXTURE_EVENT_CONFIGS as PRESSURE_CFG,
    PRESSURE_FIXTURE_INSERT_DEPTH,
    PressureEvent,
    PressureEventConfig,
    pressure_fixture_a1_location,
)


LEAK_RATE_WINDOW_SECONDS = 60.0
SAFE_HEIGHT_TRAVEL = 15.0
TRASH_HEIGHT_MM = 45.0
TIP_RACK_LOAD_NAME = "opentrons_flex_96_tiprack_1000ul"
PIPETTE_MAX_VOLUME_UL = 1000
MAX_TEST_VOLUME_UL = 200.0

DEFAULT_SLOT_TIP_RACK_1000 = 1
DEFAULT_SLOT_FIXTURE = 3
DEFAULT_SLOT_TRASH = 12
DEFAULT_FIXTURE_SIDE = "left"

PRESSURE_DATA_HEADER = ["PHASE", "TARGET", "SAMPLE"] + [f"CH{i}" for i in range(1, 97)]


@dataclass
class TestConfig:
    simulate: bool
    pipette: Literal["p1000s", "p1000m"]
    fixture_side: Literal["left", "right"]
    slot_tip_rack_1000: int
    slot_fixture: int
    slot_trash: int
    repeat_count: int
    volumes: List[float]
    leak_threshold: float
    cv_threshold: float
    fail_count_threshold: int


@dataclass
class ChannelStats:
    phase: str
    channel: int
    median: float
    cv: float
    fail_count: int
    pass_result: bool


PRESSURE_DATA_CACHE: List[List[str]] = []


def _channel_name(index: int) -> str:
    row = "ABCDEFGH"[index // 12]
    col = (index % 12) + 1
    return f"{row}{col}"


def _well_offset(index: int) -> Point:
    row = index // 12
    col = index % 12
    return Point(x=col * 9, y=row * -9)


def _tip_offset(tip_name: str) -> Point:
    row_lookup = ["A", "B", "C", "D", "E", "F", "G", "H"]
    row = row_lookup.index(tip_name[0])
    col = int(tip_name[1:]) - 1
    return Point(x=col * 9, y=row * -9)


def _average(values: Sequence[float]) -> float:
    return sum(values) / len(values)


def _cv(values: Sequence[float]) -> float:
    if len(values) <= 1:
        return 0.0
    mean_value = statistics.fmean(values)
    std_value = statistics.pstdev(values)
    if math.isclose(mean_value, 0.0, abs_tol=1e-9):
        return 0.0 if math.isclose(std_value, 0.0, abs_tol=1e-9) else math.inf
    return std_value / abs(mean_value)


def _leak_rate(values: Sequence[float]) -> float:
    return (max(values) - min(values)) / LEAK_RATE_WINDOW_SECONDS


def _phase_name(volume: float) -> str:
    return f"holding-{volume}ul"


def _build_output_paths(tag: str) -> Tuple[Path, Path]:
    run_id = data.create_run_id()
    test_name = data.create_test_name_from_file(__file__)
    test_path = data.create_folder_for_test_data(test_name)
    run_path = data.create_folder_for_test_data(test_path / run_id)
    summary = run_path / data.create_file_name(test_name, run_id, f"{tag}-summary")
    raw = run_path / data.create_file_name(test_name, run_id, f"{tag}-raw")
    return summary, raw


def _cache_phase_data(phase: str, target: str, samples: Sequence[Sequence[float]]) -> None:
    for idx, sample in enumerate(samples, start=1):
        row = [phase, target, str(idx)] + [f"{v:.4f}" for v in sample]
        PRESSURE_DATA_CACHE.append(row)


def _fixture_channel_values(samples: Sequence[Sequence[float]], ch: int) -> List[float]:
    return [row[ch] for row in samples]


def _calc_leak_for_channels(
    samples: Sequence[Sequence[float]],
    channels_under_test: Sequence[int],
) -> Dict[int, float]:
    leak_rates: Dict[int, float] = {}
    for ch in channels_under_test:
        values = _fixture_channel_values(samples, ch)
        values = sorted(values)
        if len(values) > 2:
            values = values[1:-1]
        leak_rates[ch] = _leak_rate(values)
    return leak_rates


def _read_fixture_pressures(fixture: PressureFixtureBase) -> List[float]:
    readings = fixture.read_all_pressure_channel_96()
    if len(readings) != 96:
        raise RuntimeError(f"Expected 96 pressure values, got {len(readings)}")
    return readings


async def _read_phase_samples(
    api: OT3API,
    fixture: PressureFixtureBase,
    event_cfg: PressureEventConfig,
    phase: str,
    target: str,
) -> List[List[float]]:
    if not api.is_simulator:
        await asyncio.sleep(event_cfg.stability_delay)
    samples: List[List[float]] = []
    for _ in range(event_cfg.sample_count):
        sample_start = time()
        samples.append(_read_fixture_pressures(fixture))
        delay = event_cfg.sample_delay - (time() - sample_start)
        if not api.is_simulator and delay > 0:
            await asyncio.sleep(delay)
    _cache_phase_data(phase, target, samples)
    return samples


async def _move_to_or_calibrate(
    api: OT3API,
    mount: OT3Mount,
    expected: Point,
    actual: Optional[Point],
) -> Point:
    current = await api.gantry_position(mount)
    if actual is None:
        safe = max(expected.z, current.z) + SAFE_HEIGHT_TRAVEL
        await helpers_ot3.move_to_arched_ot3(api, mount, expected, safe_height=safe)
        await helpers_ot3.jog_mount_ot3(api, mount, display=False)
        return await api.gantry_position(mount)
    safe = max(actual.z, current.z) + SAFE_HEIGHT_TRAVEL
    await helpers_ot3.move_to_arched_ot3(api, mount, actual, safe_height=safe)
    return actual


async def _pick_up_tip(
    api: OT3API,
    mount: OT3Mount,
    rack_actual: Point,
    tip_name: str,
) -> None:
    tip_pos = rack_actual + _tip_offset(tip_name)
    await helpers_ot3.move_to_arched_ot3(
        api, mount, tip_pos, safe_height=tip_pos.z + SAFE_HEIGHT_TRAVEL
    )
    await api.pick_up_tip(mount, tip_length=helpers_ot3.get_default_tip_length(1000))


async def _drop_tip(
    api: OT3API,
    mount: OT3Mount,
    trash_pos: Point,
) -> None:
    await helpers_ot3.move_to_arched_ot3(
        api, mount, trash_pos, safe_height=trash_pos.z + SAFE_HEIGHT_TRAVEL
    )
    try:
        await api.drop_tip(mount, home_after=False)
    except Exception:
        pass
    await api.home_z(mount)


def _p1000_model_for_sim(pipette: Literal["p1000s", "p1000m"]) -> str:
    return "p1000_single_flex_v1.0" if pipette == "p1000s" else "p1000_multi_flex_v1.0"


def _validate_attached_pipette(api: OT3API, pipette: Literal["p1000s", "p1000m"]) -> int:
    hw_pip = api.hardware_pipettes[OT3Mount.LEFT.to_mount()]
    assert hw_pip is not None, "left mount has no attached pipette"
    channels = int(hw_pip.channels)
    working_volume = int(hw_pip.working_volume)
    if working_volume != PIPETTE_MAX_VOLUME_UL:
        raise RuntimeError(f"Expected {PIPETTE_MAX_VOLUME_UL}uL pipette, got {working_volume}uL")
    if pipette == "p1000s" and channels != 1:
        raise RuntimeError(f"Expected P1000S (1 channel), got {channels} channels")
    if pipette == "p1000m" and channels != 8:
        raise RuntimeError(f"Expected P1000M (8 channels), got {channels} channels")
    return channels


def _channels_for_target(cfg: TestConfig, target_index: int) -> List[int]:
    if cfg.pipette == "p1000s":
        return [target_index]
    col = target_index % 12
    start = col
    return [start + 12 * row for row in range(8)]


def _target_tip_name(cfg: TestConfig, target_index: int) -> str:
    if cfg.pipette == "p1000s":
        return _channel_name(target_index)
    col = (target_index % 12) + 1
    return f"A{col}"


def _target_indices(cfg: TestConfig) -> List[int]:
    if cfg.pipette == "p1000s":
        return list(range(96))
    return list(range(12))


def _target_label(cfg: TestConfig, target_index: int) -> str:
    if cfg.pipette == "p1000s":
        return _channel_name(target_index)
    col = (target_index % 12) + 1
    return f"column-{col}"


async def _run_single_target(
    api: OT3API,
    fixture: PressureFixtureBase,
    cfg: TestConfig,
    fixture_actual: Point,
    rack_actual: Point,
    trash_actual: Point,
    target_index: int,
    repeat_index: int,
    leak_histories: Dict[str, Dict[int, List[float]]],
) -> None:
    mount = OT3Mount.LEFT
    target_label = _target_label(cfg, target_index)
    channels_under_test = _channels_for_target(cfg, target_index)
    tip_name = _target_tip_name(cfg, target_index)
    fixture_pos = fixture_actual + _well_offset(target_index)

    await _pick_up_tip(api, mount, rack_actual, tip_name)
    await helpers_ot3.move_to_arched_ot3(
        api, mount, fixture_pos, safe_height=fixture_pos.z + SAFE_HEIGHT_TRAVEL
    )

    _ = await _read_phase_samples(
        api,
        fixture,
        PRESSURE_CFG[PressureEvent.PRE],
        f"pre-{repeat_index}",
        target_label,
    )
    await api.move_rel(mount, Point(z=-PRESSURE_FIXTURE_INSERT_DEPTH[1000]))
    _ = await _read_phase_samples(
        api,
        fixture,
        PRESSURE_CFG[PressureEvent.INSERT],
        f"insert-{repeat_index}",
        target_label,
    )

    for volume in cfg.volumes:
        await api.aspirate(mount, volume)
        holding_samples = await _read_phase_samples(
            api,
            fixture,
            PRESSURE_CFG[PressureEvent.ASPIRATE_P1000],
            f"holding-{volume}ul-{repeat_index}",
            target_label,
        )
        phase = _phase_name(volume)
        phase_history = leak_histories.setdefault(phase, {})
        leak_rate_map = _calc_leak_for_channels(holding_samples, channels_under_test)
        for channel, leak_rate in leak_rate_map.items():
            phase_history.setdefault(channel, []).append(leak_rate)

        await api.dispense(mount, volume)
        _ = await _read_phase_samples(
            api,
            fixture,
            PRESSURE_CFG[PressureEvent.DISPENSE],
            f"dispensed-{volume}ul-{repeat_index}",
            target_label,
        )

    await api.move_rel(mount, Point(z=PRESSURE_FIXTURE_INSERT_DEPTH[1000]))
    await _drop_tip(api, mount, trash_actual)
    _ = await _read_phase_samples(
        api,
        fixture,
        PRESSURE_CFG[PressureEvent.POST],
        f"post-{repeat_index}",
        target_label,
    )


def _summarize(
    leak_histories: Dict[str, Dict[int, List[float]]],
    leak_threshold: float,
    cv_threshold: float,
    fail_count_threshold: int,
) -> Tuple[bool, List[ChannelStats]]:
    results: List[ChannelStats] = []
    overall_pass = True
    for phase in sorted(leak_histories.keys()):
        for channel in sorted(leak_histories[phase].keys()):
            values = leak_histories[phase][channel]
            if not values:
                continue
            median = statistics.median(values)
            cv = _cv(values)
            fail_count = sum(1 for v in values if v > leak_threshold)
            passed = True
            if median > leak_threshold and cv <= cv_threshold:
                passed = False
            elif median > leak_threshold and cv > cv_threshold:
                passed = fail_count <= fail_count_threshold
            results.append(
                ChannelStats(
                    phase=phase,
                    channel=channel + 1,
                    median=median,
                    cv=cv,
                    fail_count=fail_count,
                    pass_result=passed,
                )
            )
            overall_pass = overall_pass and passed
    return overall_pass, results


def _write_summary_csv(path: Path, stats: Sequence[ChannelStats], cfg: TestConfig) -> None:
    with open(path, "w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["pipette", cfg.pipette])
        writer.writerow(["repeat-count", cfg.repeat_count])
        writer.writerow(["volumes-ul", "|".join(str(v) for v in cfg.volumes)])
        writer.writerow(["leak-threshold", cfg.leak_threshold])
        writer.writerow(["cv-threshold", cfg.cv_threshold])
        writer.writerow(["fail-count-threshold", cfg.fail_count_threshold])
        writer.writerow([])
        writer.writerow(
            [
                "phase",
                "channel",
                f"{LEAK_RATE_WINDOW_SECONDS}s-leak-rate-median",
                "cv",
                "fail-count",
                "pass",
            ]
        )
        for row in stats:
            writer.writerow(
                [
                    row.phase,
                    f"CH{row.channel}",
                    round(row.median, 6),
                    "inf" if math.isinf(row.cv) else round(row.cv, 6),
                    row.fail_count,
                    "PASS" if row.pass_result else "FAIL",
                ]
            )


def _write_raw_csv(path: Path) -> None:
    with open(path, "w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(PRESSURE_DATA_HEADER)
        writer.writerows(PRESSURE_DATA_CACHE)


async def _main(cfg: TestConfig) -> None:
    PRESSURE_DATA_CACHE.clear()
    fixture = connect_to_fixture96(cfg.simulate, side=cfg.fixture_side)
    api: Optional[OT3API] = None
    try:
        fixture.connect_96()
        api = await helpers_ot3.build_async_ot3_hardware_api(
            is_simulating=cfg.simulate,
            pipette_left=_p1000_model_for_sim(cfg.pipette) if cfg.simulate else None,
        )
        _validate_attached_pipette(api, cfg.pipette)
        await api.home([Axis.X, Axis.Y, Axis.Z_L])

        fixture_slot_pos = helpers_ot3.get_slot_bottom_left_position_ot3(cfg.slot_fixture)
        fixture_expected = fixture_slot_pos + pressure_fixture_a1_location(cfg.fixture_side) + Point(z=-8)
        rack_expected = helpers_ot3.get_theoretical_a1_position(cfg.slot_tip_rack_1000, TIP_RACK_LOAD_NAME)
        trash_expected = (
            helpers_ot3.get_slot_calibration_square_position_ot3(cfg.slot_trash) + Point(z=TRASH_HEIGHT_MM)
        )

        ui.print_header("Calibrate tip rack A1")
        rack_actual = await _move_to_or_calibrate(api, OT3Mount.LEFT, rack_expected, None)
        ui.print_header("Calibrate fixture A1")
        fixture_actual = await _move_to_or_calibrate(api, OT3Mount.LEFT, fixture_expected, None)

        leak_histories: Dict[str, Dict[int, List[float]]] = {}
        for repeat_index in range(1, cfg.repeat_count + 1):
            ui.print_header(f"Trial {repeat_index}/{cfg.repeat_count}")
            for target_index in _target_indices(cfg):
                await _run_single_target(
                    api=api,
                    fixture=fixture,
                    cfg=cfg,
                    fixture_actual=fixture_actual,
                    rack_actual=rack_actual,
                    trash_actual=trash_expected,
                    target_index=target_index,
                    repeat_index=repeat_index,
                    leak_histories=leak_histories,
                )

        overall_pass, summary = _summarize(
            leak_histories,
            leak_threshold=cfg.leak_threshold,
            cv_threshold=cfg.cv_threshold,
            fail_count_threshold=cfg.fail_count_threshold,
        )
        summary_path, raw_path = _build_output_paths(f"fixturepressure-{cfg.pipette}")
        _write_summary_csv(summary_path, summary, cfg)
        _write_raw_csv(raw_path)
        ui.print_info(f"summary csv: {summary_path}")
        ui.print_info(f"raw csv: {raw_path}")
        ui.print_test_results(
            f"pressure fixture 96 channels ({cfg.pipette})",
            overall_pass,
        )
    finally:
        try:
            fixture.disconnect()
        except Exception:
            pass
        if api is not None:
            try:
                await api.home()
            except Exception:
                pass


def _parse_volumes(value: str) -> List[float]:
    volumes = [float(v.strip()) for v in value.split(",") if v.strip()]
    if not volumes:
        raise argparse.ArgumentTypeError("volumes cannot be empty")
    for vol in volumes:
        if vol <= 0:
            raise argparse.ArgumentTypeError(f"volume must be > 0, got {vol}")
        if vol > MAX_TEST_VOLUME_UL:
            raise argparse.ArgumentTypeError(
                f"volume must be <= {MAX_TEST_VOLUME_UL}uL for this test, got {vol}"
            )
    return volumes


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="P1000S/P1000M test for 96-channel pressure fixture leak-rate."
    )
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", choices=["p1000s", "p1000m"], default="p1000s")
    parser.add_argument("--fixture-side", choices=["left", "right"], default=DEFAULT_FIXTURE_SIDE)
    parser.add_argument("--slot-tip-rack-1000", type=int, default=DEFAULT_SLOT_TIP_RACK_1000)
    parser.add_argument("--slot-fixture", type=int, default=DEFAULT_SLOT_FIXTURE)
    parser.add_argument("--slot-trash", type=int, default=DEFAULT_SLOT_TRASH)
    parser.add_argument("--repeat-count", type=int, default=5)
    parser.add_argument(
        "--volumes",
        type=_parse_volumes,
        default=[1.0, 50.0, 200.0],
        help="Comma separated aspirate/dispense volumes, e.g. 1,50 or 1,50,200",
    )
    parser.add_argument("--leak-threshold", type=float, default=1.35)
    parser.add_argument("--cv-threshold", type=float, default=0.2)
    parser.add_argument("--fail-count-threshold", type=int, default=3)
    return parser


if __name__ == "__main__":
    args = _build_parser().parse_args()
    cfg = TestConfig(
        simulate=args.simulate,
        pipette=cast(Literal["p1000s", "p1000m"], args.pipette),
        fixture_side=cast(Literal["left", "right"], args.fixture_side),
        slot_tip_rack_1000=args.slot_tip_rack_1000,
        slot_fixture=args.slot_fixture,
        slot_trash=args.slot_trash,
        repeat_count=args.repeat_count,
        volumes=args.volumes if isinstance(args.volumes, list) else [1.0, 50.0],
        leak_threshold=args.leak_threshold,
        cv_threshold=args.cv_threshold,
        fail_count_threshold=args.fail_count_threshold,
    )
    asyncio.run(_main(cfg))
