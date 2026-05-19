"""Stable pressure fixture test for 96ch pipette.

Design goals:
1) robust leak-rate estimation under spikes/noise
2) clear phase/repeat data model for post-analysis
3) fail-safe stop/recover behavior for fixture protection
"""

import argparse
import asyncio
import csv
import math
import statistics
from dataclasses import dataclass
from pathlib import Path
from time import time
from typing import Any, Dict, List, Literal, Optional, Tuple

from hardware_testing import data
from hardware_testing.data import ui
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.types import OT3Mount, Point
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.drivers.pressure_fixture import (  # type: ignore[import]
    PressureFixtureBase,
    connect_to_fixture96,
)

from .pressure import (  # type: ignore[import]
    PRESSURE_FIXTURE_ASPIRATE_VOLUME,
    PRESSURE_FIXTURE_EVENT_CONFIGS,
    PressureEvent,
    PressureEventConfig,
)


LEAK_RATE_WINDOW_SECONDS = 60.0
INSERT_PRESSURE_MIN = 500.0
DEFAULT_DELAY_BETWEEN_MOTION_SECONDS = 3.0
SAFE_RETRACT_Z = 20.0
ALL_CHANNEL_COUNT = 96


class StopTestError(RuntimeError):
    """Raised when test should stop immediately and recover hardware state."""


@dataclass
class Config:
    simulate: bool
    pipette: Literal[200, 1000]
    repeat_count: int
    leak_threshold_1ul: float
    leak_threshold_50ul: float
    leak_threshold_200ul: float
    cv_threshold_1ul: float
    cv_threshold_50ul: float
    cv_threshold_200ul: float
    fail_count_threshold: int
    retest_mode: bool
    movement_delay_seconds: float


def _parse_bool(value: str) -> bool:
    lowered = value.lower()
    if lowered in {"true", "1", "yes", "y", "on"}:
        return True
    if lowered in {"false", "0", "no", "n", "off"}:
        return False
    raise argparse.ArgumentTypeError(f"invalid boolean value: {value}")


def _pipette_model(pipette_ul: int) -> str:
    return "p1000_96_v3.4" if pipette_ul == 1000 else "p200_96_v3.0"


def _aspirate_event(pipette_ul: int) -> PressureEvent:
    if pipette_ul == 50:
        return PressureEvent.ASPIRATE_P50
    if pipette_ul == 200:
        return PressureEvent.ASPIRATE_P200
    return PressureEvent.ASPIRATE_P1000


def _holding_phase_name(aspirate_ul: int) -> str:
    return f"holding-{aspirate_ul}ul"


def _volume_key(aspirate_ul: int) -> str:
    if aspirate_ul == 1:
        return "1ul"
    if aspirate_ul == 50:
        return "50ul"
    if aspirate_ul == 200:
        return "200ul"
    return "default"


def _compute_channel_leak_rate(samples: List[float]) -> Tuple[float, float, float, str, int]:
    """Return leak_rate, c_min, c_max, trim_mode, samples_used."""
    sorted_samples = sorted(samples)
    if len(sorted_samples) >= 3:
        used = sorted_samples[1:-1]
        mode = "symmetric-trim-1"
    else:
        used = sorted_samples
        mode = "no-trim-small-sample"
    if not used:
        used = sorted_samples
    c_min = min(used)
    c_max = max(used)
    leak_rate = (c_max - c_min) / LEAK_RATE_WINDOW_SECONDS
    return leak_rate, c_min, c_max, mode, len(used)


def _median(values: List[float]) -> float:
    return statistics.median(values)


def _mad(values: List[float], med: Optional[float] = None) -> float:
    if med is None:
        med = _median(values)
    return statistics.median([abs(v - med) for v in values])


def _cv(values: List[float]) -> float:
    mean = statistics.mean(values)
    if math.isclose(mean, 0.0, abs_tol=1e-12):
        return float("inf")
    return statistics.pstdev(values) / mean


def _create_csv_path(test_name: str, pipette_sn: str) -> Path:
    run_id = data.create_run_id()
    folder_path = data.create_folder_for_test_data(test_name)
    run_path = data.create_folder_for_test_data(folder_path / run_id)
    file_name = data.create_file_name(test_name, run_id, pipette_sn)
    return Path(run_path) / file_name


async def _read_samples(
    api: OT3API,
    fixture: PressureFixtureBase,
    event_cfg: PressureEventConfig,
    phase: str,
    repeat_index: int,
    csv_rows: List[List[Any]],
) -> List[List[float]]:
    if not api.is_simulator:
        await asyncio.sleep(event_cfg.stability_delay)
    all_samples: List[List[float]] = []
    for idx in range(event_cfg.sample_count):
        ts = round(time(), 3)
        sample = fixture.read_all_pressure_channel_96()
        all_samples.append(sample)
        csv_rows.append([ts, f"{phase}-{repeat_index}"] + [round(v, 4) for v in sample])
        await asyncio.sleep(max(event_cfg.sample_delay, 0))
    return all_samples


def _summarize_holding_phase(
    phase_name: str,
    channel_values: Dict[int, List[float]],
    leak_threshold: float,
    cv_threshold: float,
    fail_count_threshold: int,
    insert_fail_count: Dict[int, int],
    retest_mode: bool,
    csv_rows: List[List[Any]],
) -> Tuple[bool, List[str]]:
    overall_pass = True
    abnormal: List[str] = []
    for ch in range(1, ALL_CHANNEL_COUNT + 1):
        vals = channel_values.get(ch, [])
        if not vals:
            continue
        med = _median(vals)
        mad = _mad(vals, med)
        cv = _cv(vals)
        fail_count = sum(1 for v in vals if v > leak_threshold)
        ins_fail = insert_fail_count.get(ch, 0)
        if ins_fail >= fail_count_threshold:
            passed = False
            reason = "insert-fail-count"
        elif med <= leak_threshold:
            passed = True
            reason = "median-ok"
        elif cv <= cv_threshold:
            passed = False
            reason = "median-high-low-cv"
        else:
            passed = fail_count <= fail_count_threshold
            reason = "high-cv-fail-count-check"
        status = "PASS" if passed else ("MECHANICAL_FAIL_AFTER_RETEST" if retest_mode else "SUSPECT_MECHANICAL")
        overall_pass = overall_pass and passed
        if not passed:
            abnormal.append(
                f"{phase_name} CH{ch}: status={status}, median={med:.4f}, "
                f"threshold={leak_threshold}, cv={cv if math.isinf(cv) else round(cv, 4)}, "
                f"cv-threshold={cv_threshold}, mad={mad:.4f}, fail-count={fail_count}, insert-fail-count={ins_fail}"
            )
        csv_rows.append(
            [
                "",
                "CHANNEL-LEAK-SUMMARY",
                phase_name,
                f"CH{ch}",
                leak_threshold,
                round(med, 4),
                cv_threshold,
                "inf" if math.isinf(cv) else round(cv, 4),
                round(mad, 4),
                fail_count,
                ins_fail,
                reason,
                status,
                "PASS" if passed else "FAIL",
            ]
        )
    return overall_pass, abnormal


async def _recover_drop_tip(api: OT3API) -> None:
    await api.move_rel(OT3Mount.LEFT, Point(z=SAFE_RETRACT_Z))
    try:
        await api.drop_tip(OT3Mount.LEFT)
    except Exception:
        pass


async def run(cfg: Config) -> None:
    model = _pipette_model(cfg.pipette)
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=cfg.simulate,
        pipette_left=model,
    )
    fixture = connect_to_fixture96(simulate=False)
    pip = api.hardware_pipettes[OT3Mount.LEFT.to_mount()]
    assert pip is not None
    pipette_sn = helpers_ot3.get_pipette_serial_ot3(pip)

    csv_path = _create_csv_path("ninety-six-fixturepressure-stable", pipette_sn)
    csv_rows: List[List[Any]] = []
    csv_rows.append(["meta", "pipette_sn", pipette_sn])
    csv_rows.append(["meta", "repeat_count", cfg.repeat_count])
    csv_rows.append(["meta", "leak_threshold_1ul", cfg.leak_threshold_1ul])
    csv_rows.append(["meta", "leak_threshold_50ul", cfg.leak_threshold_50ul])
    csv_rows.append(["meta", "leak_threshold_200ul", cfg.leak_threshold_200ul])
    csv_rows.append(["meta", "cv_threshold_1ul", cfg.cv_threshold_1ul])
    csv_rows.append(["meta", "cv_threshold_50ul", cfg.cv_threshold_50ul])
    csv_rows.append(["meta", "cv_threshold_200ul", cfg.cv_threshold_200ul])
    csv_rows.append(["meta", "insert_pressure_min", INSERT_PRESSURE_MIN])
    csv_rows.append(["meta", "fail_count_threshold", cfg.fail_count_threshold])
    csv_rows.append(["time", "phase", *[f"CH{i}" for i in range(1, 97)]])

    insert_fail_count: Dict[int, int] = {}
    holding_values: Dict[str, Dict[int, List[float]]] = {
        "holding-1ul": {},
        "holding-50ul": {},
        "holding-200ul": {},
    }

    try:
        await api.home()
        ui.get_user_ready("Ready to jog to fixture pickup point")
        await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, Point(x=342, y=288, z=111.5))
        await helpers_ot3.jog_mount_ot3(api, OT3Mount.LEFT)
        fixture_pickup_point = await api.gantry_position(OT3Mount.LEFT)

        aspirates = PRESSURE_FIXTURE_ASPIRATE_VOLUME[cfg.pipette]
        for r in range(1, cfg.repeat_count + 1):
            await api.home()
            await helpers_ot3.move_to_arched_ot3(api, OT3Mount.LEFT, fixture_pickup_point)

            pre_samples = await _read_samples(
                api,
                fixture,
                PRESSURE_FIXTURE_EVENT_CONFIGS[PressureEvent.PRE],
                "pre",
                r,
                csv_rows,
            )

            await api.pick_up_tip_96_fixture(OT3Mount.LEFT, helpers_ot3.get_default_tip_length(1000))
            await asyncio.sleep(cfg.movement_delay_seconds)

            insert_samples = await _read_samples(
                api,
                fixture,
                PRESSURE_FIXTURE_EVENT_CONFIGS[PressureEvent.INSERT],
                "insert",
                r,
                csv_rows,
            )

            for ch in range(ALL_CHANNEL_COUNT):
                ch_no = ch + 1
                vals = [s[ch] for s in insert_samples]
                if all(math.isclose(v, 0.0, abs_tol=1e-9) for v in vals):
                    raise StopTestError(
                        f"stop-test: ch{ch_no} insert samples all 0. 程序自动停止测试，原因工装可能存在线脱落"
                    )
                avg_insert = sum(vals) / len(vals)
                if avg_insert <= INSERT_PRESSURE_MIN:
                    insert_fail_count[ch_no] = insert_fail_count.get(ch_no, 0) + 1

            for asp in aspirates:
                await api.aspirate(OT3Mount.LEFT, asp)
                await asyncio.sleep(cfg.movement_delay_seconds)
                hold_event = _aspirate_event(cfg.pipette)
                hold_samples = await _read_samples(
                    api,
                    fixture,
                    PRESSURE_FIXTURE_EVENT_CONFIGS[hold_event],
                    f"holding-{asp}ul",
                    r,
                    csv_rows,
                )
                phase = _holding_phase_name(int(asp))
                for ch in range(ALL_CHANNEL_COUNT):
                    ch_no = ch + 1
                    leak, cmin, cmax, trim_mode, used_n = _compute_channel_leak_rate([s[ch] for s in hold_samples])
                    holding_values.setdefault(phase, {}).setdefault(ch_no, []).append(leak)
                    csv_rows.append(["", f"{phase}-stats-r{r}", f"CH{ch_no}", "min", round(cmin, 4)])
                    csv_rows.append(["", f"{phase}-stats-r{r}", f"CH{ch_no}", "max", round(cmax, 4)])
                    csv_rows.append(["", f"{phase}-stats-r{r}", f"CH{ch_no}", "trim-mode", trim_mode])
                    csv_rows.append(["", f"{phase}-stats-r{r}", f"CH{ch_no}", "samples-used", used_n])
                    csv_rows.append(["", f"{phase}-stats-r{r}", f"CH{ch_no}", "60s-leak-rate", round(leak, 4)])

                await api.dispense(OT3Mount.LEFT, asp)
                await asyncio.sleep(cfg.movement_delay_seconds)
                await _read_samples(
                    api,
                    fixture,
                    PRESSURE_FIXTURE_EVENT_CONFIGS[PressureEvent.DISPENSE],
                    f"dispensed-{asp}ul",
                    r,
                    csv_rows,
                )
                await api.prepare_for_aspirate(OT3Mount.LEFT)

            await _recover_drop_tip(api)
            await _read_samples(
                api,
                fixture,
                PRESSURE_FIXTURE_EVENT_CONFIGS[PressureEvent.POST],
                "post",
                r,
                csv_rows,
            )

        leak_thresholds = {
            "1ul": cfg.leak_threshold_1ul,
            "50ul": cfg.leak_threshold_50ul,
            "200ul": cfg.leak_threshold_200ul,
            "default": cfg.leak_threshold_50ul,
        }
        cv_thresholds = {
            "1ul": cfg.cv_threshold_1ul,
            "50ul": cfg.cv_threshold_50ul,
            "200ul": cfg.cv_threshold_200ul,
            "default": cfg.cv_threshold_50ul,
        }
        overall = True
        abnormal_all: List[str] = []
        for phase in ("holding-1ul", "holding-50ul", "holding-200ul"):
            vol_key = _volume_key(int(phase.split("-")[1].replace("ul", "")))
            phase_pass, abnormal = _summarize_holding_phase(
                phase_name=phase,
                channel_values=holding_values.get(phase, {}),
                leak_threshold=leak_thresholds[vol_key],
                cv_threshold=cv_thresholds[vol_key],
                fail_count_threshold=cfg.fail_count_threshold,
                insert_fail_count=insert_fail_count,
                retest_mode=cfg.retest_mode,
                csv_rows=csv_rows,
            )
            overall = overall and phase_pass
            abnormal_all.extend(abnormal)

        if abnormal_all:
            print("Abnormal channels:")
            for line in abnormal_all:
                print(" -", line)
        else:
            print("Abnormal channels: none")
        print("Final result:", "PASS" if overall else "FAIL")

    except StopTestError as err:
        print("run fail:", err)
        await _recover_drop_tip(api)
    except Exception as err:
        print("run fail:", err)
        await _recover_drop_tip(api)
    finally:
        await api.home()
        csv_path.parent.mkdir(parents=True, exist_ok=True)
        with csv_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            for row in csv_rows:
                writer.writerow(row)
        print("CSV saved:", csv_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--pipette", type=int, choices=[200, 1000], default=1000)
    parser.add_argument("--repeat-count", type=int, default=10)
    parser.add_argument("--leak-threshold-1ul", type=float, default=2.45)
    parser.add_argument("--leak-threshold-50ul", type=float, default=0.88)
    parser.add_argument("--leak-threshold-200ul", type=float, default=3.07)
    parser.add_argument("--cv-threshold-1ul", type=float, default=0.2)
    parser.add_argument("--cv-threshold-50ul", type=float, default=0.2)
    parser.add_argument("--cv-threshold-200ul", type=float, default=0.2)
    parser.add_argument("--fail-count-threshold", type=int, default=3)
    parser.add_argument("--retest-mode", type=_parse_bool, default=False)
    parser.add_argument("--movement-delay-seconds", type=float, default=DEFAULT_DELAY_BETWEEN_MOTION_SECONDS)
    args = parser.parse_args()
    cfg = Config(
        simulate=args.simulate,
        pipette=args.pipette,
        repeat_count=args.repeat_count,
        leak_threshold_1ul=args.leak_threshold_1ul,
        leak_threshold_50ul=args.leak_threshold_50ul,
        leak_threshold_200ul=args.leak_threshold_200ul,
        cv_threshold_1ul=args.cv_threshold_1ul,
        cv_threshold_50ul=args.cv_threshold_50ul,
        cv_threshold_200ul=args.cv_threshold_200ul,
        fail_count_threshold=args.fail_count_threshold,
        retest_mode=args.retest_mode,
        movement_delay_seconds=args.movement_delay_seconds,
    )
    asyncio.run(run(cfg))


if __name__ == "__main__":
    main()

