#!/usr/bin/env python3
"""Run the vacuum functional pressure test using raw serial G-code.

This script intentionally does not use ``VacuumModuleDriver``. It discovers a
connected Vacuum Module by USB VID/PID, opens the serial port at 115200 8N1,
and sends the same G-codes that the hardware functional test sends through the
driver.

The timing, sampling, settle-window, and pass/fail gates mirror
``vacuum_module_qc.test_vacuum_functional``. Use ``--target`` for one target
or ``--targets`` for a selected list; with neither option the complete
functional target list is run.
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from dataclasses import dataclass
from statistics import mean
from typing import Any, Iterable, Optional


VACUUM_VID = 0x0483
VACUUM_PID = 0xEF40
BAUDRATE = 115200

# These values intentionally match test_vacuum_functional.py.
PRESSURE_SAMPLES = 200
HOLD_DURATION_S = 90.0
SAMPLE_PERIOD_S = HOLD_DURATION_S / PRESSURE_SAMPLES
TARGET_PRESSURES = [0, -100, -200, -300, -400, -500, -600, -700, -800, -900]
STABILIZE_SAMPLES = 50
SETTLE_WINDOW_S = 10.0
SETTLE_WINDOW_SAMPLES = max(2, round(SETTLE_WINDOW_S / SAMPLE_PERIOD_S))
TIMEOUT_S = HOLD_DURATION_S + 60.0
PRESSURE_TOLERANCE = 8.0

MEAN_ABS_ERR_LIMIT = 2.0
P95_ABS_ERR_LIMIT = 4.0
SHALLOW_TARGET = -100
SHALLOW_MEAN_ABS_ERR_LIMIT = 3.0
SHALLOW_P95_ABS_ERR_LIMIT = 6.0
REACH_TIME_LIMIT_S = 45.0
SETTLE_TIME_LIMIT_S = 60.0
ZERO_MEAN_ABS_ERR_LIMIT = 8.0
ZERO_P95_ABS_ERR_LIMIT = 8.0
ZERO_SETTLE_TIME_LIMIT_S = 20.0
ZERO_DEEPEST_LIMIT_MBAR = -50.0
UNREACHABLE_TARGETS = {-900}
UNREACHABLE_MIN_MEAN_MBAR = -850.0
UNREACHABLE_MAX_MEAN_MBAR = -700.0
UNREACHABLE_P2P_LIMIT = 8.0

_FIELD_RE = re.compile(r"(?P<key>[A-Z]):(?P<value>-?\d+(?:\.\d+)?)")


class GCodeError(RuntimeError):
    """A serial command returned a firmware error or timed out."""


@dataclass(frozen=True)
class PressureState:
    """Fields returned by M121."""

    target: float
    current: float
    abs_a: float
    abs_b: float
    atmosphere: float
    enabled: bool
    duration_remaining: int
    vent: int


@dataclass(frozen=True)
class HoldStats:
    """Statistics over a pressure window."""

    mean_pressure: float
    mean_abs_error: float
    p2p: float
    p95_abs_error: float


def _parse_fields(response: str) -> dict[str, float]:
    """Parse firmware ``X:value`` fields from one response line."""
    return {m.group("key"): float(m.group("value")) for m in _FIELD_RE.finditer(response)}


def _parse_pressure(response: str) -> PressureState:
    """Parse an M121 response."""
    if not response.startswith("M121 "):
        raise GCodeError(f"unexpected M121 response: {response!r}")
    fields = _parse_fields(response)
    required = {"T", "C", "A", "B", "H", "E", "D", "V"}
    missing = required - fields.keys()
    if missing:
        raise GCodeError(f"incomplete M121 response, missing {sorted(missing)}: {response!r}")
    return PressureState(
        target=fields["T"],
        current=fields["C"],
        abs_a=fields["A"],
        abs_b=fields["B"],
        atmosphere=fields["H"],
        enabled=bool(int(fields["E"])),
        duration_remaining=int(fields["D"]),
        vent=int(fields["V"]),
    )


def _window_stats(window: list[float], target: float) -> HoldStats:
    """Compute the same statistics as the functional QC."""
    errors = [abs(p - target) for p in window]
    return HoldStats(
        mean_pressure=mean(window),
        mean_abs_error=mean(errors),
        p2p=max(window) - min(window),
        p95_abs_error=sorted(errors)[int(0.95 * (len(errors) - 1))],
    )


def _regulation_limits(target: int) -> tuple[float, float]:
    if target == SHALLOW_TARGET:
        return SHALLOW_MEAN_ABS_ERR_LIMIT, SHALLOW_P95_ABS_ERR_LIMIT
    return MEAN_ABS_ERR_LIMIT, P95_ABS_ERR_LIMIT


def _is_settled(window: list[float], target: int) -> bool:
    """Return whether the trailing 10-second window meets the QC gates."""
    if target in UNREACHABLE_TARGETS or len(window) < SETTLE_WINDOW_SAMPLES:
        return False
    stats = _window_stats(window, float(target))
    if target == 0:
        return (
            stats.mean_abs_error <= ZERO_MEAN_ABS_ERR_LIMIT
            and stats.p95_abs_error <= ZERO_P95_ABS_ERR_LIMIT
        )
    mean_limit, p95_limit = _regulation_limits(target)
    return stats.mean_abs_error <= mean_limit and stats.p95_abs_error <= p95_limit


def _target_passed(
    target: int,
    reached_time: Optional[float],
    settling_time: Optional[float],
    stats: HoldStats,
    pressures: list[float],
) -> bool:
    """Apply the same target-specific pass/fail gates as functional QC."""
    if target in UNREACHABLE_TARGETS:
        return (
            reached_time is None
            and settling_time is None
            and UNREACHABLE_MIN_MEAN_MBAR <= stats.mean_pressure <= UNREACHABLE_MAX_MEAN_MBAR
            and stats.p2p <= UNREACHABLE_P2P_LIMIT
        )
    if target == 0:
        return (
            settling_time is not None
            and settling_time <= ZERO_SETTLE_TIME_LIMIT_S
            and stats.mean_abs_error <= ZERO_MEAN_ABS_ERR_LIMIT
            and stats.p95_abs_error <= ZERO_P95_ABS_ERR_LIMIT
            and bool(pressures)
            and min(pressures) > ZERO_DEEPEST_LIMIT_MBAR
        )
    mean_limit, p95_limit = _regulation_limits(target)
    return (
        reached_time is not None
        and reached_time <= REACH_TIME_LIMIT_S
        and settling_time is not None
        and settling_time <= SETTLE_TIME_LIMIT_S
        and stats.mean_abs_error <= mean_limit
        and stats.p95_abs_error <= p95_limit
    )


class VacuumSerial:
    """Small raw-G-code serial client for the Vacuum Module."""

    def __init__(self, serial_port: Any, port_name: str) -> None:
        self._serial = serial_port
        self.port_name = port_name

    @classmethod
    def discover(cls, requested_port: Optional[str] = None) -> "VacuumSerial":
        """Find and probe an online Vacuum Module, then return an open client."""
        try:
            import serial  # type: ignore[import-not-found]
            from serial.tools.list_ports import comports  # type: ignore[import-not-found]
        except ImportError as exc:
            raise GCodeError(
                "pyserial is required; install it with `pip install pyserial`"
            ) from exc

        if requested_port:
            candidates = [requested_port]
        else:
            candidates = [
                str(info.device)
                for info in comports()
                if info.vid == VACUUM_VID and info.pid == VACUUM_PID
            ]
            if not candidates:
                raise GCodeError(
                    f"no Vacuum Module found (VID=0x{VACUUM_VID:04X}, PID=0x{VACUUM_PID:04X})"
                )

        errors: list[str] = []
        for port in candidates:
            serial_port = None
            try:
                serial_port = serial.Serial(
                    port=port,
                    baudrate=BAUDRATE,
                    bytesize=serial.EIGHTBITS,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    timeout=0.2,
                    write_timeout=5.0,
                )
                client = cls(serial_port, port)
                serial_port.reset_input_buffer()
                serial_port.reset_output_buffer()
                response = client.command("M115", expected="M115", timeout=5.0)
                print(f"Connected to Vacuum Module at {port}: {response}")
                return client
            except Exception as exc:
                errors.append(f"{port}: {exc}")
                if serial_port is not None:
                    serial_port.close()
        raise GCodeError("could not connect to an online Vacuum Module: " + "; ".join(errors))

    def close(self) -> None:
        self._serial.close()

    def command(self, command: str, expected: str, timeout: float = 5.0) -> str:
        """Send one G-code and wait for its ``OK`` response.

        Async firmware messages are kept visible and are treated as errors. The
        reader continues until the requested command response arrives, because
        an async error can be interleaved with a normal response.
        """
        command = command.strip()
        self._serial.write((command + "\n").encode("ascii"))
        self._serial.flush()
        deadline = time.monotonic() + timeout
        lines: list[str] = []
        async_error: Optional[str] = None
        while time.monotonic() < deadline:
            raw = self._serial.readline()
            if not raw:
                continue
            line = raw.decode("utf-8", errors="replace").strip()
            if not line:
                continue
            lines.append(line)
            if line.lower().startswith("async "):
                print(f"  {line}", flush=True)
                # Keep reading. Firmware may place the async line immediately
                # before the normal response to this same command.
                async_error = line
                continue
            if "ERR" in line.upper():
                raise GCodeError(f"{command} -> {line}")
            if line.startswith(expected) and line.endswith("OK"):
                if async_error is not None:
                    raise GCodeError(async_error)
                return line
        if async_error is not None:
            raise GCodeError(async_error)
        raise GCodeError(f"timeout waiting for {command!r}; received {lines!r}")

    def pressure(self) -> PressureState:
        return _parse_pressure(self.command("M121", expected="M121"))

    def pump_running(self) -> bool:
        response = self.command("M123", expected="M123")
        fields = _parse_fields(response)
        if "E" not in fields:
            raise GCodeError(f"incomplete M123 response: {response!r}")
        return bool(int(fields["E"]))

    def stop_and_vent(self) -> None:
        self.command("M120 S0", expected="M120")
        self.command("M124 V1", expected="M124")


def _equalize(client: VacuumSerial) -> bool:
    """Match functional QC's 10 one-second atmospheric equalization checks."""
    client.stop_and_vent()
    equalized = False
    for _ in range(10):
        state = client.pressure()
        equalized = abs(state.abs_b - state.atmosphere) <= PRESSURE_TOLERANCE
        if equalized:
            break
        time.sleep(1.0)
    if not equalized:
        print("WARNING: pressure did not equalize within 10 seconds; continuing like functional QC")
    if client.pump_running():
        raise GCodeError("M123 reports the pump is still running after reset")
    return equalized


def run_target(client: VacuumSerial, target: int) -> bool:
    """Run one target with the functional QC's 200 samples and gates."""
    print(
        f"\n------------------------------------\n"
        f"|   Target Gauge Pressure = {target:4d}   |\n"
        "------------------------------------"
    )
    _equalize(client)
    client.command("M124 V0", expected="M124")
    start = time.monotonic()
    client.command(
        f"M120 S1 P{target} D{int(HOLD_DURATION_S)} T{int(TIMEOUT_S)} V1",
        expected="M120",
    )

    pressures: list[float] = []
    reached_time: Optional[float] = None
    settling_time: Optional[float] = None
    try:
        for index in range(PRESSURE_SAMPLES):
            state = client.pressure()
            current = state.current
            pressures.append(current)
            elapsed = time.monotonic() - start
            print(f"Sample {index:3d}: {current:7.1f} mbar", flush=True)

            if reached_time is None and abs(current - target) <= PRESSURE_TOLERANCE:
                reached_time = elapsed
                print(f"Reached target in {reached_time:.2f} seconds", flush=True)
            if settling_time is None and _is_settled(pressures[-SETTLE_WINDOW_SAMPLES:], target):
                settling_time = elapsed
                print(f"Settled on target in {settling_time:.2f} seconds", flush=True)

            remaining = start + (index + 1) * SAMPLE_PERIOD_S - time.monotonic()
            if remaining > 0:
                time.sleep(remaining)
    except GCodeError as exc:
        print(f"G-code test error at target {target}: {exc}", file=sys.stderr)
        return False
    finally:
        try:
            client.stop_and_vent()
        except Exception as exc:
            print(f"cleanup error: {exc}", file=sys.stderr)

    stats = _window_stats(pressures[-STABILIZE_SAMPLES:], float(target))
    passed = _target_passed(target, reached_time, settling_time, stats, pressures)
    reached_out = reached_time if reached_time is not None else -1.0
    settling_out = settling_time if settling_time is not None else -1.0
    print(
        f"Reached Target: {reached_out:6.2f}s | "
        f"Settled from 0: {settling_out:5.2f}s | "
        f"mean|err|={stats.mean_abs_error:5.2f} | "
        f"p95={stats.p95_abs_error:5.2f} | "
        f"p2p={stats.p2p:5.2f} | PASS={passed}",
        flush=True,
    )
    return passed


def _parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--port", help="serial port override; otherwise discover VID/PID automatically"
    )
    parser.add_argument(
        "--target",
        type=int,
        action="append",
        help="run one target; repeat for multiple targets",
    )
    parser.add_argument(
        "--targets",
        type=int,
        nargs="+",
        default=None,
        help="run a selected target list, for example: --targets -600 -700",
    )
    return parser.parse_args(list(argv) if argv is not None else None)


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = _parse_args(argv)
    if args.target and args.targets:
        raise SystemExit("use either --target or --targets, not both")
    targets = args.target or args.targets or TARGET_PRESSURES

    client: Optional[VacuumSerial] = None
    try:
        client = VacuumSerial.discover(args.port)
        # Functional QC explicitly disables waste detection before the pressure sweep.
        client.command("M127 E0", expected="M127")
        results = [run_target(client, target) for target in targets]
        return 0 if all(results) else 1
    except (GCodeError, KeyboardInterrupt) as exc:
        if isinstance(exc, KeyboardInterrupt):
            print("Interrupted", file=sys.stderr)
        else:
            print(f"FAILED: {exc}", file=sys.stderr)
        return 2
    finally:
        if client is not None:
            try:
                client.stop_and_vent()
            except Exception:
                pass
            client.close()


if __name__ == "__main__":
    raise SystemExit(main())
