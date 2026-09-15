#!/usr/bin/env python3
"""Vacuum module pressure hold regulation test.

Assumes exclusive serial access (robot-server stopped).
Optionally enables waste detection, runs targets, prints samples, and writes
JSON and/or CSV incrementally so a host-side report can update live.
"""
from __future__ import annotations

import argparse
import asyncio
import sys
import time
from typing import Any, Optional

from opentrons.drivers import vacuum_module
from opentrons.drivers.vacuum_module.errors import WasteContainerFull
from opentrons.drivers.vacuum_module.types import VentState

from hardware_testing.modules.common.utils import find_module_port
from hardware_testing.modules.vacuum_module.scripts.pressure_regulation import (
    hold_results,
)


DEFAULT_CSV_PATH = hold_results.DEFAULT_CSV_PATH
DEFAULT_JSON_PATH = hold_results.DEFAULT_JSON_PATH
OUTPUT_CHOICES = hold_results.OUTPUT_CHOICES
OUTPUT_JSON = hold_results.OUTPUT_JSON
steady_stats = hold_results.steady_stats
write_results = hold_results.write_results

VACUUM_VID = 0x0483
VACUUM_PID = 0xEF40

DEFAULT_TARGETS = [float(p) for p in range(0, -801, -50)]  # 0, -50, ..., -800 mbar
DEFAULT_DURATION_S = 120  # 2 minutes each
SAMPLE_PERIOD_S = 0.5
TIMEOUT_S = 180
DEFAULT_KP = 13.1
DEFAULT_KI = 4.59
DEFAULT_KD = 0.15


def _waste_label(enabled: bool, g_sealed_max: Optional[float]) -> str:
    base = "enabled (M127 E1)" if enabled else "disabled (M127 E0)"
    if g_sealed_max is None:
        return base
    return f"{base} G={g_sealed_max}"


async def _read_sample(
    pump: vacuum_module.VacuumModuleDriver,
    target_gauge: float,
    t0: float,
) -> tuple[dict[str, Any], bool, Optional[str]]:
    """Poll vacuum + pump state. Returns (sample, tripped, async_line)."""
    elapsed = round(time.time() - t0, 3)
    tripped = False
    async_line: Optional[str] = None
    st = None
    pump_st = None
    try:
        st = await pump.get_vacuum_state()
    except WasteContainerFull as exc:
        tripped = True
        async_line = str(exc.response) if hasattr(exc, "response") else str(exc)
    except Exception as exc:
        print(f"t={elapsed:6.2f}s BAD_RESP vacuum {exc!r}", flush=True)
        return (
            {
                "t_s": elapsed,
                "current_mbar": None,
                "target_mbar": target_gauge,
                "error_mbar": None,
                "enabled": 0,
                "duration_remaining_s": 0,
                "abs_a": None,
                "abs_b": None,
                "atm": None,
                "vent": None,
                "rpm": None,
                "target_rpm": None,
                "pwm": None,
                "target_pwm": None,
                "err401": tripped,
            },
            tripped,
            async_line,
        )

    try:
        pump_st = await pump.get_pump_state()
    except WasteContainerFull as exc:
        tripped = True
        async_line = str(exc.response) if hasattr(exc, "response") else str(exc)
    except Exception as exc:
        print(f"t={elapsed:6.2f}s BAD_RESP pump {exc!r}", flush=True)

    if st is None:
        return (
            {
                "t_s": elapsed,
                "current_mbar": None,
                "target_mbar": target_gauge,
                "error_mbar": None,
                "enabled": 0,
                "duration_remaining_s": 0,
                "abs_a": None,
                "abs_b": None,
                "atm": None,
                "vent": None,
                "rpm": None if pump_st is None else pump_st.current_rpm,
                "target_rpm": None if pump_st is None else pump_st.target_rpm,
                "pwm": None if pump_st is None else pump_st.current_pwm,
                "target_pwm": None if pump_st is None else pump_st.target_pwm,
                "err401": tripped,
            },
            tripped,
            async_line,
        )

    err = st.current_gauge_pressure - target_gauge
    sample = {
        "t_s": elapsed,
        "current_mbar": st.current_gauge_pressure,
        "target_mbar": st.target_gauge_pressure,
        "error_mbar": round(err, 3),
        "enabled": int(st.vacuum_enabled),
        "duration_remaining_s": st.vacuum_duration,
        "abs_a": st.pressure_abs_a,
        "abs_b": st.pressure_abs_b,
        "atm": st.pressure_atm,
        "vent": st.vent_state.value,
        "rpm": None if pump_st is None else pump_st.current_rpm,
        "target_rpm": None if pump_st is None else pump_st.target_rpm,
        "pwm": None if pump_st is None else pump_st.current_pwm,
        "target_pwm": None if pump_st is None else pump_st.target_pwm,
        "err401": tripped,
    }
    return sample, tripped, async_line


async def run_target(
    pump: vacuum_module.VacuumModuleDriver,
    target_gauge: float,
    duration_s: int,
    sample_period: float,
    result: dict[str, Any],
    output: str,
    bottle: Optional[str],
    expect_trip: bool,
    waste_detection: bool,
) -> dict[str, Any]:
    print(f"\n=== Target {target_gauge} mbar for {duration_s}s ===", flush=True)
    await pump.set_vent_state(VentState.CLOSED)
    print("close vent: CLOSED", flush=True)
    await pump.set_vacuum_state(enable_vacuum=False)
    print("stop pump", flush=True)
    await asyncio.sleep(0.4)
    await pump.set_vacuum_state(
        enable_vacuum=True,
        gauge_pressure_mbar=target_gauge,
        duration_s=duration_s,
        timeout_s=TIMEOUT_S,
        vent_after=True,
    )
    print(
        f"start: P={target_gauge} D={duration_s} T={TIMEOUT_S} V=1",
        flush=True,
    )

    samples: list[dict[str, Any]] = []
    async_lines: list[str] = []
    run: dict[str, Any] = {
        "target_mbar": target_gauge,
        "duration_s": duration_s,
        "bottle": bottle,
        "expect_trip": expect_trip,
        "stats": {"n": 0, "note": "in progress"},
        "samples": samples,
        "async_lines": async_lines,
        "status": "running",
        "tripped": False,
        "trip_t_s": None,
        "pass": None,
    }
    result["runs"].append(run)
    result["current_target_mbar"] = target_gauge
    write_results(result, output=output)

    t0 = time.time()
    last_write = 0.0
    while time.time() - t0 < duration_s + 1.5:
        sample, tripped, async_line = await _read_sample(pump, target_gauge, t0)
        elapsed = sample["t_s"]
        if async_line:
            async_lines.append(async_line)
        samples.append(sample)

        rpm = sample.get("rpm")
        pwm = sample.get("pwm")
        rpm_s = "   n/a" if rpm is None else f"{rpm:6.0f}"
        pwm_s = "  n/a" if pwm is None else f"{int(pwm):3d}"
        cur = sample.get("current_mbar")
        tgt = sample.get("target_mbar")
        err = sample.get("error_mbar")
        if cur is None or tgt is None or err is None:
            print(
                f"t={elapsed:6.2f}s incomplete sample"
                + ("  ERR401" if tripped else ""),
                flush=True,
            )
        else:
            print(
                f"t={elapsed:6.2f}s  C={cur:8.2f}  T={tgt:8.2f}  "
                f"err={err:7.2f}  E={sample['enabled']}  "
                f"D={sample['duration_remaining_s']:3d}  "
                f"A={sample['abs_a']:.1f} B={sample['abs_b']:.1f} "
                f"H={sample['atm']:.1f}  "
                f"rpm={rpm_s} pwm={pwm_s}"
                + ("  ERR401" if tripped else ""),
                flush=True,
            )

        stopped_early = (
            waste_detection
            and sample.get("enabled") == 0
            and elapsed < (duration_s - 1.5)
        )
        if tripped or stopped_early:
            run["tripped"] = True
            run["trip_t_s"] = elapsed
            break

        if elapsed - last_write >= 2.0:
            run["stats"] = steady_stats(samples, duration_s)
            write_results(result, output=output)
            last_write = elapsed
        await asyncio.sleep(sample_period)

    stats = steady_stats(samples, duration_s)
    run["stats"] = stats
    run["async_lines"] = list(async_lines)
    if waste_detection:
        run["pass"] = bool(run["tripped"]) if expect_trip else (not run["tripped"])
    else:
        run["pass"] = None
    run["status"] = "complete"
    if stats.get("n", 0):
        print(
            f"STEADY n={stats['n']} mean={stats['mean_current']:.2f} "
            f"mean_err={stats['mean_err']:.2f} mean_abs={stats['mean_abs_err']:.2f} "
            f"stdev={stats['stdev_err']:.2f} p95_abs={stats['p95_abs_err']:.2f} "
            f"max_abs={stats['max_abs_err']:.2f}",
            flush=True,
        )
    else:
        print("STEADY empty", flush=True)
    if waste_detection:
        print(
            f"WASTE bottle={bottle} expect_trip={expect_trip} "
            f"tripped={run['tripped']} trip_t={run['trip_t_s']} pass={run['pass']}",
            flush=True,
        )

    await pump.set_vacuum_state(enable_vacuum=False)
    print("stop", flush=True)
    await pump.set_vent_state(VentState.OPENED)
    print("open vent: OPENED", flush=True)
    write_results(result, output=output)
    await asyncio.sleep(2)
    return run


async def main(args: argparse.Namespace) -> int:
    targets = args.targets
    duration_s = args.duration_s
    run_name = args.run_name
    kp = args.kp
    ki = args.ki
    kd = args.kd
    waste_detection = bool(args.waste_detection)
    expect_trip = bool(args.expect_trip)
    bottle = args.bottle
    g_sealed_max = args.g_sealed_max

    print(
        f"Run: {run_name}  Targets: {targets[0]} .. {targets[-1]} "
        f"({len(targets)} points, {duration_s}s each, "
        f"~{len(targets) * duration_s / 60:.0f} min hold time)",
        flush=True,
    )

    port = find_module_port(VACUUM_VID, VACUUM_PID)
    loop = asyncio.get_running_loop()
    pump = await vacuum_module.VacuumModuleDriver.create(port=port, loop=loop)

    exit_code = 0
    try:
        info = await pump.get_device_info()
        fw = (
            f"FW:{info['version']} HW:Opentrons-vacuum-module-{info['model']} "
            f"SerialNo:{info['serial']}"
        )
        print("M115:", fw, flush=True)
        await pump.set_waste_configs(
            enable_waste_full_detection=waste_detection,
            g_sealed_max=g_sealed_max,
        )
        waste = await pump.get_waste_configs()
        waste_label = _waste_label(waste.waste_detection_enabled, waste.g_sealed_max)
        print(f"waste detection: {waste_label}", flush=True)
        print("M128:", waste, flush=True)
        print("M121:", await pump.get_vacuum_state(), flush=True)
        await pump.set_pressure_control_tunings(kp=kp, ki=ki, kd=kd)
        control_tunings = await pump.get_pressure_control_tunings()
        print("M126:", control_tunings, flush=True)

        result: dict[str, Any] = {
            "run_name": run_name,
            "firmware": fw,
            "targets": targets,
            "kp": control_tunings.kp,
            "ki": control_tunings.ki,
            "kd": control_tunings.kd,
            "duration_s": duration_s,
            "sample_period_s": SAMPLE_PERIOD_S,
            "waste_detection": waste_label,
            "waste_detection_enabled": bool(waste.waste_detection_enabled),
            "g_sealed_max": waste.g_sealed_max,
            "bottle": bottle,
            "expect_trip": expect_trip,
            "runs": [],
            "status": "running",
            "current_target_mbar": None,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        write_results(result, output=args.output)

        for tgt in targets:
            await run_target(
                pump,
                tgt,
                duration_s,
                SAMPLE_PERIOD_S,
                result,
                args.output,
                bottle=bottle,
                expect_trip=expect_trip,
                waste_detection=waste_detection,
            )

        result["status"] = "complete"
        result["current_target_mbar"] = None
        info = await pump.get_device_info()
        result["firmware"] = (
            f"FW:{info['version']} HW:Opentrons-vacuum-module-{info['model']} "
            f"SerialNo:{info['serial']}"
        )
        written = write_results(result, output=args.output)
        print(f"\nWrote {', '.join(str(path) for path in written)}", flush=True)

        print("\n======== STEADY-STATE SUMMARY (last ~30s) ========", flush=True)
        for run in result["runs"]:
            st = run["stats"]
            waste_bit = ""
            if waste_detection:
                waste_bit = (
                    f" bottle={run.get('bottle')} expect_trip={run.get('expect_trip')} "
                    f"tripped={run.get('tripped')} trip_t={run.get('trip_t_s')} "
                    f"waste_pass={run.get('pass')}"
                )
                if run.get("pass") is False:
                    exit_code = 1
            if st.get("n", 0) == 0:
                print(
                    f"target={run['target_mbar']:+.0f} NO_STEADY_DATA{waste_bit}",
                    flush=True,
                )
                continue
            passed = st["mean_abs_err"] <= 2.0 and st["p95_abs_err"] <= 4.0
            print(
                f"target={run['target_mbar']:+.0f} mean_abs={st['mean_abs_err']:.2f} "
                f"mean_err={st['mean_err']:.2f} stdev={st['stdev_err']:.2f} "
                f"p95_abs={st['p95_abs_err']:.2f} max_abs={st['max_abs_err']:.2f} "
                f"PASS={passed}{waste_bit}",
                flush=True,
            )
    finally:
        await pump.disconnect()

    print("DONE", flush=True)
    return exit_code


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Vacuum module pressure hold regulation test"
    )
    parser.add_argument(
        "--targets",
        type=float,
        nargs="+",
        default=DEFAULT_TARGETS,
        help="Target gauge pressures in mbar (default: 0 -50 ... -800)",
    )
    parser.add_argument(
        "--duration_s",
        type=int,
        default=DEFAULT_DURATION_S,
        help="Hold duration per target in seconds (default: 120)",
    )
    parser.add_argument(
        "--run-name",
        type=str,
        default="unnamed",
        help=(
            "Label for this run (stored in results). Prefer a sequence "
            "prefix matching the results folder, e.g. 23_1888194c_water_3x0p2mm "
            "(default: unnamed)"
        ),
    )
    parser.add_argument(
        "--waste-detection",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Enable waste full detection (default: disabled)",
    )
    parser.add_argument(
        "--expect-trip",
        action=argparse.BooleanOptionalAction,
        default=False,
        help=(
            "When waste detection is enabled, expect ERR401 / early stop "
            "(default: false)"
        ),
    )
    parser.add_argument(
        "--bottle",
        choices=["empty", "full"],
        default=None,
        help="Bottle state for this run (empty or full)",
    )
    parser.add_argument(
        "--g-sealed-max",
        type=float,
        default=None,
        help=(
            "Waste sealed conductance threshold G (M127 G). "
            "Lower = harder to trip; raise to trip more easily"
        ),
    )
    parser.add_argument(
        "--kp",
        type=float,
        default=DEFAULT_KP,
        help="Proportional gain",
    )
    parser.add_argument(
        "--ki",
        type=float,
        default=DEFAULT_KI,
        help="Integral gain",
    )
    parser.add_argument(
        "--kd",
        type=float,
        default=DEFAULT_KD,
        help="Derivative gain",
    )
    parser.add_argument(
        "--output",
        choices=list(OUTPUT_CHOICES),
        default=OUTPUT_JSON,
        help=(
            "Result file format (default: json). json writes "
            f"{DEFAULT_JSON_PATH}; csv writes {DEFAULT_CSV_PATH} plus "
            "a sibling *_summary.csv; both writes all three."
        ),
    )
    args = parser.parse_args()
    sys.exit(asyncio.run(main(args)))
