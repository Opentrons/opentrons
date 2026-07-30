#!/usr/bin/env python3
"""Vacuum module pressure hold regulation test.

Assumes exclusive serial access (robot-server stopped).
Disables waste detection, runs targets, prints samples, writes JSON incrementally
so a host-side report can update live.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import sys
import time
from typing import Any

from opentrons.drivers import vacuum_module
from opentrons.drivers.vacuum_module.types import VentState

from hardware_testing.modules.common.utils import find_module_port

VACUUM_VID = 0x0483
VACUUM_PID = 0xEF40
OUT_JSON = "/tmp/vacuum_pressure_hold_results.json"

DEFAULT_TARGETS = [float(p) for p in range(0, -801, -50)]  # 0, -50, ..., -800 mbar
DEFAULT_DURATION_S = 120  # 2 minutes each
SAMPLE_PERIOD_S = 0.5
TIMEOUT_S = 180


def write_results(result: dict[str, Any]) -> None:
    tmp = OUT_JSON + ".tmp"
    with open(tmp, "w") as f:
        json.dump(result, f)
    os.replace(tmp, OUT_JSON)


def steady_stats(samples: list[dict[str, Any]], duration_s: int) -> dict[str, Any]:
    steady = [
        s
        for s in samples
        if s["t_s"] >= (duration_s - 30)
        and s["t_s"] < duration_s
        and s["enabled"] == 1
    ]
    if not steady:
        return {"n": 0, "note": "no steady samples (pump stopped early?)"}
    errs = [s["error_mbar"] for s in steady]
    currents = [s["current_mbar"] for s in steady]
    return {
        "n": len(steady),
        "mean_current": statistics.mean(currents),
        "mean_err": statistics.mean(errs),
        "mean_abs_err": statistics.mean(abs(e) for e in errs),
        "stdev_err": statistics.stdev(errs) if len(errs) > 1 else 0.0,
        "p95_abs_err": sorted(abs(e) for e in errs)[int(0.95 * (len(errs) - 1))],
        "max_abs_err": max(abs(e) for e in errs),
    }


async def run_target(
    pump: vacuum_module.VacuumModuleDriver,
    target_gauge: float,
    duration_s: int,
    sample_period: float,
    result: dict[str, Any],
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
    run: dict[str, Any] = {
        "target_mbar": target_gauge,
        "duration_s": duration_s,
        "stats": {"n": 0, "note": "in progress"},
        "samples": samples,
        "status": "running",
    }
    result["runs"].append(run)
    result["current_target_mbar"] = target_gauge
    write_results(result)

    t0 = time.time()
    last_write = 0.0
    while time.time() - t0 < duration_s + 1.5:
        try:
            st = await pump.get_vacuum_state()
        except Exception as e:
            elapsed = round(time.time() - t0, 3)
            print(f"t={elapsed:6.2f}s BAD_RESP {e!r}", flush=True)
            await asyncio.sleep(sample_period)
            continue
        elapsed = round(time.time() - t0, 3)
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
        }
        samples.append(sample)
        print(
            f"t={elapsed:6.2f}s  C={st.current_gauge_pressure:8.2f}  "
            f"T={st.target_gauge_pressure:8.2f}  "
            f"err={err:7.2f}  E={int(st.vacuum_enabled)}  "
            f"D={st.vacuum_duration:3d}  "
            f"A={st.pressure_abs_a:.1f} B={st.pressure_abs_b:.1f} "
            f"H={st.pressure_atm:.1f}",
            flush=True,
        )
        # Incremental write ~every 2s for live graph
        if elapsed - last_write >= 2.0:
            run["stats"] = steady_stats(samples, duration_s)
            write_results(result)
            last_write = elapsed
        await asyncio.sleep(sample_period)

    stats = steady_stats(samples, duration_s)
    run["stats"] = stats
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

    await pump.set_vacuum_state(enable_vacuum=False)
    print("stop", flush=True)
    await pump.set_vent_state(VentState.OPENED)
    print("open vent: OPENED", flush=True)
    write_results(result)
    await asyncio.sleep(2)
    return run


async def main(args: argparse.Namespace) -> int:
    targets = args.targets
    duration_s = args.duration_s
    run_name = args.run_name

    print(
        f"Run: {run_name}  Targets: {targets[0]} .. {targets[-1]} "
        f"({len(targets)} points, {duration_s}s each, "
        f"~{len(targets) * duration_s / 60:.0f} min hold time)",
        flush=True,
    )

    port = find_module_port(VACUUM_VID, VACUUM_PID)
    loop = asyncio.get_running_loop()
    pump = await vacuum_module.VacuumModuleDriver.create(port=port, loop=loop)

    try:
        info = await pump.get_device_info()
        fw = (
            f"FW:{info['version']} HW:Opentrons-vacuum-module-{info['model']} "
            f"SerialNo:{info['serial']}"
        )
        print("M115:", fw, flush=True)
        await pump.set_waste_configs(
            enable_waste_full_detection=args.waste_detection
        )
        waste_label = (
            "enabled (M127 E1)" if args.waste_detection else "disabled (M127 E0)"
        )
        print(f"waste detection: {waste_label}", flush=True)
        waste = await pump.get_waste_configs()
        print("M128:", waste, flush=True)
        print("M121:", await pump.get_vacuum_state(), flush=True)
        print("M126:", await pump.get_pressure_control_tunings(), flush=True)

        result: dict[str, Any] = {
            "run_name": run_name,
            "firmware": fw,
            "targets": targets,
            "duration_s": duration_s,
            "sample_period_s": SAMPLE_PERIOD_S,
            "waste_detection": waste_label,
            "runs": [],
            "status": "running",
            "current_target_mbar": None,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        write_results(result)

        for tgt in targets:
            await run_target(pump, tgt, duration_s, SAMPLE_PERIOD_S, result)

        result["status"] = "complete"
        result["current_target_mbar"] = None
        info = await pump.get_device_info()
        result["firmware"] = (
            f"FW:{info['version']} HW:Opentrons-vacuum-module-{info['model']} "
            f"SerialNo:{info['serial']}"
        )
        write_results(result)
        print(f"\nWrote {OUT_JSON}", flush=True)

        print("\n======== STEADY-STATE SUMMARY (last ~30s) ========", flush=True)
        for run in result["runs"]:
            st = run["stats"]
            if st.get("n", 0) == 0:
                print(f"target={run['target_mbar']:+.0f} NO_STEADY_DATA", flush=True)
                continue
            passed = st["mean_abs_err"] <= 2.0 and st["p95_abs_err"] <= 4.0
            print(
                f"target={run['target_mbar']:+.0f} mean_abs={st['mean_abs_err']:.2f} "
                f"mean_err={st['mean_err']:.2f} stdev={st['stdev_err']:.2f} "
                f"p95_abs={st['p95_abs_err']:.2f} max_abs={st['max_abs_err']:.2f} "
                f"PASS={passed}",
                flush=True,
            )
    finally:
        await pump.disconnect()

    print("DONE", flush=True)
    return 0


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
        help="Label for this run (stored in results JSON; default: unnamed)",
    )
    parser.add_argument(
        "--waste-detection",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="Enable waste full detection (default: disabled)",
    )
    args = parser.parse_args()
    sys.exit(asyncio.run(main(args)))
