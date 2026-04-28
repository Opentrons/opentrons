"""Error reporting and diagnostics for update_robot.py (stderr messages, snapshot-on-failure)."""

from __future__ import annotations

import json
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Tuple

import httpx

# After session loss: poll /health for version hint
UPDATE_SESSION_LOST_HEALTH_WAIT_S = 120.0
UPDATE_SESSION_LOST_HEALTH_INTERVAL_S = 5.0

# update-server/otupdate/common/session.py — Stages enum (.value.short used in API responses)
STAGE_LABELS: Dict[str, str] = {
    "awaiting-file": "Awaiting file upload",
    "validating": "Validating file (signature + hash check)",
    "writing": "Writing to disk",
    "done": "Write complete",
    "ready-for-restart": "Ready to commit",
    "error": "Error",
}

_STATE_TABLE_W = {"id": 12, "protocol": 24, "started": 20, "completed": 20, "lpc": 6, "mount": 8, "serial": 18}


def bad_token_response(response: httpx.Response) -> bool:
    """True when update-server reports the session token is unknown (404 + error body)."""
    if response.status_code != 404:
        return False
    try:
        data = response.json()
        return data.get("error") == "bad-token"
    except Exception:
        return False


def explain_update_session_lost(
    client: httpx.Client,
    base_url: str,
    *,
    last_stage: Optional[str],
    last_progress: Optional[float],
    get_robot_health: Callable[[httpx.Client, str, Optional[float]], dict],
) -> None:
    """Print why status polling failed and best-effort /health version after session loss."""
    print("", file=sys.stderr)
    print(
        "  Update session disappeared on the robot (HTTP 404 bad-token).",
        file=sys.stderr,
    )
    print(
        "  The session token is no longer valid — often update-server restarted, the session",
        file=sys.stderr,
    )
    print(
        "  was cleared, or the robot rebooted during validate/write.",
        file=sys.stderr,
    )
    if last_stage:
        prog = ""
        if last_progress is not None and last_progress > 0:
            prog = f"  (last progress reported: {last_progress:.1f}%)"
        print(
            f"  Last stage seen: {STAGE_LABELS.get(last_stage, last_stage)}{prog}",
            file=sys.stderr,
        )
    print("  Polling /health for current software version (best effort)...", file=sys.stderr)
    deadline = time.time() + UPDATE_SESSION_LOST_HEALTH_WAIT_S
    while time.time() < deadline:
        try:
            h = get_robot_health(client, base_url, 15.0)
            version_note = str(h.get("api_version") or h.get("api_Version") or "unknown")
            print(f"  /health reports software version: {version_note}", file=sys.stderr)
            break
        except Exception:
            time.sleep(UPDATE_SESSION_LOST_HEALTH_INTERVAL_S)
    else:
        print(
            "  Could not get /health within "
            f"{UPDATE_SESSION_LOST_HEALTH_WAIT_S:.0f}s — robot may still be rebooting or unreachable.",
            file=sys.stderr,
        )
    print(
        "  Re-run this script when the robot is stable. Start from the version above (or the touchscreen / app);",
        file=sys.stderr,
    )
    print(
        "  do not assume the update finished successfully.",
        file=sys.stderr,
    )


def format_state_tables(
    runs: List[dict],
    pipettes_rows: List[Tuple[str, str]],
    modules_serials: List[str],
    title: str,
    header_lines: Optional[List[str]] = None,
    software_version: Optional[str] = None,
) -> None:
    """Print runs (with LPC counts), pipettes (mount, serial), modules (serial) in aligned tables."""
    w = _STATE_TABLE_W
    if header_lines:
        for line in header_lines:
            print("  " + line, file=sys.stderr)
        print("", file=sys.stderr)
    print("  ─── " + title + " ───", file=sys.stderr)
    if software_version is not None:
        print("  Software version: " + str(software_version), file=sys.stderr)
        print("", file=sys.stderr)

    runs_display = list(runs)
    runs_display.reverse()
    print(
        "  Runs ({} total, newest first):".format(len(runs_display)),
        file=sys.stderr,
    )
    h = ("id", "protocolId", "startedAt", "completedAt", "LPCs")
    print(
        "    "
        + h[0].ljust(w["id"])
        + h[1].ljust(w["protocol"])
        + h[2].ljust(w["started"])
        + h[3].ljust(w["completed"])
        + h[4].ljust(w["lpc"]),
        file=sys.stderr,
    )
    print(
        "    " + "-" * (w["id"] + w["protocol"] + w["started"] + w["completed"] + w["lpc"]),
        file=sys.stderr,
    )
    for run in runs_display:
        rid = (run.get("id") or "?")[: w["id"] - 1]
        pid = (run.get("protocolId") or "-")[: w["protocol"] - 1]
        started = run.get("startedAt")
        s = (str(started)[:19] if started else "-")[: w["started"] - 1]
        completed = run.get("completedAt")
        c = (str(completed)[:19] if completed else "-")[: w["completed"] - 1]
        offsets = run.get("labwareOffsets")
        n_lpc = len(offsets) if isinstance(offsets, list) else 0
        print(
            "    "
            + rid.ljust(w["id"])
            + pid.ljust(w["protocol"])
            + s.ljust(w["started"])
            + c.ljust(w["completed"])
            + str(n_lpc).ljust(w["lpc"]),
            file=sys.stderr,
        )

    print("", file=sys.stderr)
    print("  Pipettes (serial numbers):", file=sys.stderr)
    print("    " + "mount".ljust(w["mount"]) + "serial", file=sys.stderr)
    print("    " + "-" * (w["mount"] + w["serial"]), file=sys.stderr)
    for mount, serial in pipettes_rows:
        print(
            "    "
            + mount.ljust(w["mount"])
            + (serial[: w["serial"] - 1] if len(serial) > w["serial"] else serial),
            file=sys.stderr,
        )
    if not pipettes_rows:
        print("    (none)", file=sys.stderr)

    print("", file=sys.stderr)
    print("  Modules (serial numbers):", file=sys.stderr)
    if modules_serials:
        for s in modules_serials:
            print("    " + str(s), file=sys.stderr)
    else:
        print("    (none)", file=sys.stderr)
    print("", file=sys.stderr)


def try_print_network_state_on_failure(
    ip: str,
    port: int,
    timeout: float,
    title: str,
    software_version: str,
    *,
    fetch_network_once: Callable[..., Any],
    format_tables: Callable[..., None] = format_state_tables,
) -> None:
    """Best-effort full state table after an error (single fetch, no stable wait)."""
    base_url = f"http://{ip}:{port}"
    print("\n  ─── State snapshot after error ───", file=sys.stderr)
    try:
        with httpx.Client(
            headers={"Opentrons-Version": "*"},
            timeout=timeout,
        ) as client:
            got = fetch_network_once(client, base_url, timeout)
            if got is None:
                print("  (Could not fetch state — robot may be unreachable.)", file=sys.stderr)
                return
            runs, pipettes_rows, modules_serials, _, _ = got
            format_tables(
                runs,
                pipettes_rows,
                modules_serials,
                title,
                software_version=software_version,
            )
    except Exception as exc:
        print("  (Could not print state snapshot: {})".format(exc), file=sys.stderr)


def try_print_usb_state_on_failure(
    port_path: str,
    timeout: float,
    title: str,
    software_version: str,
    *,
    fetch_usb_once: Callable[..., Any],
    format_tables: Callable[..., None] = format_state_tables,
) -> None:
    print("\n  ─── State snapshot after error ───", file=sys.stderr)
    try:
        got = fetch_usb_once(port_path, timeout)
        if got is None:
            print("  (Could not fetch state over USB.)", file=sys.stderr)
            return
        runs, pipettes_rows, modules_serials, _, _ = got
        format_tables(
            runs,
            pipettes_rows,
            modules_serials,
            title,
            software_version=software_version,
        )
    except Exception as exc:
        print("  (Could not print state snapshot: {})".format(exc), file=sys.stderr)


def print_http_status_error(e: httpx.HTTPStatusError) -> None:
    """Print status line and JSON or text body from an HTTP error response."""
    print(
        f"HTTP {e.response.status_code}: {e.response.reason_phrase}",
        file=sys.stderr,
    )
    try:
        error_body = e.response.json()
        print(json.dumps(error_body, indent=2), file=sys.stderr)
    except Exception:
        try:
            print(e.response.text, file=sys.stderr)
        except Exception:
            print("(response body not available)", file=sys.stderr)


def print_diagnostic_after_network_exception(
    ip: str,
    port: int,
    request_timeout: float,
    last_completed_version: Optional[str],
    *,
    fetch_network_once: Callable[..., Any],
) -> None:
    """After a failed network operation, print best-effort robot state (shared by several except paths)."""
    try_print_network_state_on_failure(
        ip,
        port,
        request_timeout,
        "State after error (best effort)",
        last_completed_version or "?",
        fetch_network_once=fetch_network_once,
    )
