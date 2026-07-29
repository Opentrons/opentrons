#!/usr/bin/env python3
"""Vacuum module pressure hold regulation test.

Assumes exclusive serial access (robot-server stopped).
Disables waste detection, runs targets, prints samples, writes JSON incrementally
so a host-side report can update live.
"""
from __future__ import annotations

import json
import re
import statistics
import sys
import time
from typing import Any

import serial

PORT = "/dev/ot_module_vacuummodule1"
BAUD = 115200
OUT_JSON = "/tmp/vacuum_pressure_hold_results.json"

# 0, -50, ..., -800 mbar
TARGETS = [float(p) for p in range(0, -801, -50)]
DURATION_S = 120  # 2 minutes each
SAMPLE_PERIOD_S = 0.5
TIMEOUT_S = 180


def xcmd(ser: serial.Serial, cmd: str, wait: float = 0.12) -> str:
    ser.reset_input_buffer()
    ser.write((cmd.strip() + "\n").encode())
    ser.flush()
    time.sleep(wait)
    data = b""
    t0 = time.time()
    while time.time() - t0 < 1.0:
        chunk = ser.read(ser.in_waiting or 1)
        if chunk:
            data += chunk
            if b"OK" in data or b"ERR" in data:
                time.sleep(0.03)
                data += ser.read(ser.in_waiting or 0)
                break
        else:
            time.sleep(0.02)
    return data.decode(errors="replace").strip()


def parse_m121(resp: str) -> dict[str, Any] | None:
    m = re.search(
        r"M121 T:([-\d.]+) C:([-\d.]+) A:([-\d.]+) B:([-\d.]+) H:([-\d.]+) "
        r"E:(\d+) D:(\d+) V:(\d+)",
        resp,
    )
    if not m:
        return None
    return {
        "target": float(m.group(1)),
        "current": float(m.group(2)),
        "abs_a": float(m.group(3)),
        "abs_b": float(m.group(4)),
        "atm": float(m.group(5)),
        "enabled": int(m.group(6)),
        "duration": int(m.group(7)),
        "vent": int(m.group(8)),
    }


def write_results(result: dict[str, Any]) -> None:
    tmp = OUT_JSON + ".tmp"
    with open(tmp, "w") as f:
        json.dump(result, f)
    # atomic-ish replace
    import os

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


def run_target(
    ser: serial.Serial,
    target_gauge: float,
    duration_s: int,
    sample_period: float,
    result: dict[str, Any],
) -> dict[str, Any]:
    print(f"\n=== Target {target_gauge} mbar for {duration_s}s ===", flush=True)
    print("close vent:", xcmd(ser, "M124 S0"), flush=True)
    print("stop pump:", xcmd(ser, "M120 S0"), flush=True)
    time.sleep(0.4)
    start_cmd = f"M120 S1 P{target_gauge} D{duration_s} T{TIMEOUT_S} V1"
    print("start:", start_cmd, "->", xcmd(ser, start_cmd), flush=True)

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
        resp = xcmd(ser, "M121", wait=0.06)
        st = parse_m121(resp)
        elapsed = round(time.time() - t0, 3)
        if not st:
            print(f"t={elapsed:6.2f}s BAD_RESP {resp!r}", flush=True)
            time.sleep(sample_period)
            continue
        err = st["current"] - target_gauge
        sample = {
            "t_s": elapsed,
            "current_mbar": st["current"],
            "target_mbar": st["target"],
            "error_mbar": round(err, 3),
            "enabled": st["enabled"],
            "duration_remaining_s": st["duration"],
            "abs_a": st["abs_a"],
            "abs_b": st["abs_b"],
            "atm": st["atm"],
            "vent": st["vent"],
        }
        samples.append(sample)
        print(
            f"t={elapsed:6.2f}s  C={st['current']:8.2f}  T={st['target']:8.2f}  "
            f"err={err:7.2f}  E={st['enabled']}  D={st['duration']:3d}  "
            f"A={st['abs_a']:.1f} B={st['abs_b']:.1f} H={st['atm']:.1f}",
            flush=True,
        )
        # Incremental write ~every 2s for live graph
        if elapsed - last_write >= 2.0:
            run["stats"] = steady_stats(samples, duration_s)
            write_results(result)
            last_write = elapsed
        time.sleep(sample_period)

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

    print("stop:", xcmd(ser, "M120 S0"), flush=True)
    print("open vent:", xcmd(ser, "M124 S1"), flush=True)
    write_results(result)
    time.sleep(2)
    return run


def main() -> int:
    print(
        f"Targets: {TARGETS[0]} .. {TARGETS[-1]} step -50 "
        f"({len(TARGETS)} points, {DURATION_S}s each, "
        f"~{len(TARGETS) * DURATION_S / 60:.0f} min hold time)",
        flush=True,
    )
    ser = serial.Serial(PORT, BAUD, timeout=0.2)
    ser.reset_input_buffer()
    fw = xcmd(ser, "M115", wait=0.3)
    print("M115:", fw, flush=True)
    print("disable waste:", xcmd(ser, "M127 E0"), flush=True)
    print("M128:", xcmd(ser, "M128"), flush=True)
    print("M121:", xcmd(ser, "M121", wait=0.2), flush=True)
    print("M126:", xcmd(ser, "M126", wait=0.2), flush=True)

    result: dict[str, Any] = {
        "firmware": fw,
        "targets": TARGETS,
        "duration_s": DURATION_S,
        "sample_period_s": SAMPLE_PERIOD_S,
        "waste_detection": "disabled (M127 E0)",
        "runs": [],
        "status": "running",
        "current_target_mbar": None,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    write_results(result)

    for tgt in TARGETS:
        run_target(ser, tgt, DURATION_S, SAMPLE_PERIOD_S, result)

    result["status"] = "complete"
    result["current_target_mbar"] = None
    result["firmware"] = xcmd(ser, "M115", wait=0.3)
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

    ser.close()
    print("DONE", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
