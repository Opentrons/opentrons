"""Named phases for post-restart / readiness stderr — one place for the state-machine narrative."""

from __future__ import annotations

import sys
from typing import List, Literal, Tuple

Transport = Literal["network", "usb"]

# (step, short title, one-line hint for the overview banner)
_PHASES_NETWORK: List[Tuple[int, str, str]] = [
    (
        1,
        "Robot HTTP up",
        "GET /health until 200 — refused connections / timeouts are normal while the robot reboots.",
    ),
    (
        2,
        "Update server",
        "GET /server/update/health until 200 — required before another system-image update session.",
    ),
    (
        3,
        "Subsystem firmware",
        "GET /subsystems/updates/current until idle — gripper / extension mount often flash here after an OS update.",
    ),
    (
        4,
        "Stable Flex snapshot",
        "GET /runs, /instruments, /modules — healthy serials + N consecutive matching polls (timer starts in this phase only).",
    ),
]

_PHASES_USB: List[Tuple[int, str, str]] = [
    (
        1,
        "USB /health reachability",
        "Serial HTTP GET /health until 200 — USB port may vanish until the robot is back.",
    ),
    (
        2,
        "Subsystem firmware",
        "GET /subsystems/updates/current over serial until idle (same contract as network).",
    ),
    (
        3,
        "Stable Flex snapshot",
        "GET /runs, /instruments, /modules over serial until stable.",
    ),
]


def _steps(transport: Transport) -> List[Tuple[int, str, str]]:
    return list(_PHASES_NETWORK if transport == "network" else _PHASES_USB)


def readiness_pipeline_banner(transport: Transport) -> None:
    """Print once when starting a post-restart sequence (after system update commit + restart)."""
    steps = _steps(transport)
    title = (
        "Post-restart readiness (network — Wi‑Fi / Ethernet)"
        if transport == "network"
        else "Post-restart readiness (USB serial — no Wi‑Fi required)"
    )
    print("", file=sys.stderr)
    print(f"══ {title} ══", file=sys.stderr)
    total = len(steps)
    for step, name, hint in steps:
        print(f"  [{step}/{total}] {name}", file=sys.stderr)
        print(f"        {hint}", file=sys.stderr)
    print("", file=sys.stderr)


def phase_begin(transport: Transport, step: int, extra: str = "") -> None:
    """Mark entry into a numbered phase (stderr)."""
    steps = _steps(transport)
    total = len(steps)
    name = next((n for s, n, _ in steps if s == step), f"step {step}")
    print(f"──→ Phase {step}/{total}: {name}", file=sys.stderr)
    if extra:
        print(f"    {extra}", file=sys.stderr)


def phase_ok(transport: Transport, step: int, detail: str = "") -> None:
    """Mark successful completion of a numbered phase."""
    steps = _steps(transport)
    total = len(steps)
    name = next((n for s, n, _ in steps if s == step), "")
    line = f"    ✓ Phase {step}/{total} complete"
    if name:
        line += f" — {name}"
    print(line, file=sys.stderr)
    if detail:
        print(f"      {detail}", file=sys.stderr)


def phase_skip(transport: Transport, step: int, reason: str) -> None:
    """Mark that a phase did not apply (e.g. API 404)."""
    steps = _steps(transport)
    total = len(steps)
    name = next((n for s, n, _ in steps if s == step), "")
    print(f"    ◌ Phase {step}/{total} skipped — {name}: {reason}", file=sys.stderr)
