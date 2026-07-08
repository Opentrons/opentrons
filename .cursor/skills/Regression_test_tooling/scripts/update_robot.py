#!/usr/bin/env python3
"""Update Opentrons Flex (OT-3) system software from GitHub or a local zip, over network or USB.

Script location (from monorepo root)::

    .cursor/skills/Regression_test_tooling/scripts/update_robot.py

Requires: httpx — install into the *same* interpreter you use to run this script::

    python3 -m pip install httpx

(On macOS, ``pip install`` alone may target pyenv/Homebrew while ``python3`` is
Apple CommandLineTools — use ``python3 -m pip``.) For ``--usb``: ``python3 -m pip install pyserial``.

Consecutive updates (demo progression)
----------------------------------------
Apply four versions **in order**, waiting for the robot to come back after each restart::

    8.8.1  →  9.0.0  →  8.7.0  →  9.0.0

**Wi‑Fi / Ethernet** — script downloads each zip from GitHub (replace IP with your robot)::

    python .cursor/skills/Regression_test_tooling/scripts/update_robot.py 10.14.19.233 \\
        --version 8.8.1 9.0.0 8.7.0 9.0.0 \\
        --yes

**USB** — Wi‑Fi can be off; pass one ``--file`` per step (version is read from each filename)::

    python .cursor/skills/Regression_test_tooling/scripts/update_robot.py --usb \\
        --file .cursor/skills/Regression_test_tooling/scripts/ot3-system-8.8.1.zip \\
        --file .cursor/skills/Regression_test_tooling/scripts/ot3-system-9.0.0.zip \\
        --file .cursor/skills/Regression_test_tooling/scripts/ot3-system-8.7.0.zip \\
        --file .cursor/skills/Regression_test_tooling/scripts/ot3-system-9.0.0.zip \\
        --yes

The script prints ``Update 1/4``, ``Update 2/4``, … and a state table after each step.

Other usage (run from monorepo root)
------------------------------------

Single version over Wi‑Fi::

    python .cursor/skills/Regression_test_tooling/scripts/update_robot.py 10.14.19.233 --version 8.8.1

Single version over USB (local zip only)::

    python .cursor/skills/Regression_test_tooling/scripts/update_robot.py --usb \\
        --file .cursor/skills/Regression_test_tooling/scripts/ot3-system-8.8.1.zip -y

Local dev server (update-server on port 34000)::

    python .cursor/skills/Regression_test_tooling/scripts/update_robot.py localhost \\
        --version 8.8.1 --port 34000 --yes
"""

import argparse
import json
import re
import sys
import tempfile
import time
from pathlib import Path
from typing import List, Optional, Tuple

try:
    import httpx
except ModuleNotFoundError:
    print(
        "Missing dependency: httpx.\n"
        "Install it for THIS Python (shown below), e.g.\n"
        "  {} -m pip install httpx\n"
        "If `pip install httpx` said \"already satisfied\" but this still fails, "
        "`pip` and `python3` are different interpreters — always use `python3 -m pip`.\n"
        "This script was started with: {}".format(sys.executable, sys.executable),
        file=sys.stderr,
    )
    raise SystemExit(1) from None

from update_robot_errors import (
    STAGE_LABELS,
    format_state_tables,
    print_diagnostic_after_network_exception,
    print_http_status_error,
    try_print_usb_state_on_failure,
)
from update_robot_session import cancel_update_session, download_system_file, run_one_update
from update_robot_verifications import (
    DEFAULT_WAIT_AFTER_RESTART_S,
    FLEX_STABLE_CONSECUTIVE_POLLS_DEFAULT,
    NETWORK_UPDATE_SERVER_READY_TIMEOUT_S,
    STABLE_STATE_NAG_AFTER_S,
    STABLE_STATE_POLL_INTERVAL_S,
    STABLE_STATE_TIMEOUT_S,
    SUBSYSTEM_FIRMWARE_IDLE_MAX_S,
    check_update_api_available,
    configure_usb_serial_helpers,
    fetch_state_network_once,
    fetch_state_usb_once,
    fetch_usb_health_calibration,
    get_robot_health,
    health_version_and_model_or_fallback,
    usb_final_summary,
    wait_for_robot_health_json,
    wait_for_robot_ready,
    wait_for_robot_ready_usb,
    wait_for_robot_state_after_restart_network,
    wait_for_robot_state_after_restart_usb,
    wait_for_update_server_ready,
)

# ─── USB (same as app-shell / check_health) ───
OPENTRONS_USB_VID = 0x1B67
OPENTRONS_USB_PID = 0x4037
USB_SERIAL_BAUD = 1_152_000
# Pacing: robot/USB bridge can miss or corrupt if we send back-to-back too fast
USB_DELAY_AFTER_HEALTH_S = 2.0  # wait after GET /health before starting update session
# Network: after restart, main /health can be 200 before nginx/update-server is ready → 502 on upload
NETWORK_DELAY_AFTER_READY_S = 2.0  # wait after update server is ready before starting next update
# Post-restart / health / stable-snapshot timeouts: update_robot_verifications
# Network update session (begin/upload/status/commit): update_robot_session
USB_DELAY_BETWEEN_REQUESTS_S = 1.0  # wait after each request/response before next
USB_BEGIN_TIMEOUT_S = 60.0  # longer timeout for POST begin (update server may be slow)
# Windows serial stack often needs a bit more time after write before read (consecutive request/response)
USB_DELAY_AFTER_WRITE_S = 0.35 if sys.platform == "win32" else 0.2
USB_DELAY_AFTER_WRITE_MULTIPART_S = 0.4 if sys.platform == "win32" else 0.3

# Match ot3-system-8.8.1.zip to derive version from filename (Opentrons Flex)
VERSION_FROM_FILENAME = re.compile(r"^ot3-system-(.+)\.zip$", re.IGNORECASE)

# Set by main() when --debug-usb; used by USB serial helpers to log request/response bytes
_USB_DEBUG = False


def version_from_zip_path(path: Path) -> Optional[str]:
    """Derive target version from zip filename (e.g. ot3-system-8.8.1.zip -> 8.8.1)."""
    match = VERSION_FROM_FILENAME.match(path.name)
    return match.group(1) if match else None


def normalize_version_cli_args(parts: List[str]) -> List[str]:
    """Turn argparse --version tokens into clean semver strings.

    Shells pass comma-separated lists as separate argv pieces (e.g. ``8.8.1,`` ``9.0.0,``); without
    normalization those become invalid tags like ``v8.8.1,``. Also accepts ``--version 8.8.1,9.0.0``
    or ``--version 8.8.1 9.0.0`` in one token.
    """
    out: List[str] = []
    for p in parts:
        for chunk in p.split(","):
            for piece in chunk.split():
                s = piece.strip()
                if s:
                    out.append(s)
    return out


def _find_opentrons_usb_port() -> Optional[str]:
    """Return first serial port matching Opentrons Flex USB VID/PID."""
    try:
        from serial.tools.list_ports import comports
    except ImportError:
        return None
    for port in comports():
        if port.vid == OPENTRONS_USB_VID and port.pid == OPENTRONS_USB_PID:
            return port.device
    return None


def _read_http_response(ser, timeout: float = 30.0) -> Tuple[int, bytes]:
    """Read one HTTP response from an open serial port. Return (status_code, body).

    Wire format is always raw bytes: headers ASCII, body UTF-8. We never interpret
    or decode hex from the robot; .hex() is only used when --debug-usb to log
    the request we send. Same behavior on Windows (COM port) and macOS/Linux.
    """
    t0 = time.time()
    buf = b""
    while b"\r\n\r\n" not in buf and len(buf) < 8192:
        chunk = ser.read(256)
        if not chunk:
            break
        buf += chunk
    elapsed = time.time() - t0
    if _USB_DEBUG:
        print(
            "[USB debug] response read: len(buf)={}, has_headers={}, elapsed={:.2f}s".format(
                len(buf), b"\r\n\r\n" in buf, elapsed
            ),
            file=sys.stderr,
        )
        print("[USB debug] raw buf (repr): {}".format(repr(buf[:1024])), file=sys.stderr)
    if b"\r\n\r\n" not in buf:
        return 0, buf
    header_block_str = buf.split(b"\r\n\r\n", 1)[0].decode("ascii", errors="replace")
    rest = buf.split(b"\r\n\r\n", 1)[-1]
    status_match = re.search(r"HTTP/1\.\d+\s+(\d+)", header_block_str.split("\r\n")[0])
    status_code = int(status_match.group(1)) if status_match else 0
    cl_match = re.search(r"Content-Length:\s*(\d+)", header_block_str, re.IGNORECASE)
    if cl_match:
        want = int(cl_match.group(1))
        while len(rest) < want:
            rest += ser.read(want - len(rest))
        body_out = rest[:want]
    else:
        body_out = rest + ser.read(4096)
    if _USB_DEBUG:
        print(
            "[USB debug] parsed: status={}, body_len={}, body_preview={}".format(
                status_code, len(body_out), repr(body_out[:256])
            ),
            file=sys.stderr,
        )
    return status_code, body_out


def _serial_get_over_ser(ser, path: str, timeout: float = 30.0) -> Tuple[int, bytes]:
    """Send HTTP GET over an already-open serial port (like the Opentrons app). Return (status_code, body)."""
    request = (
        f"GET {path} HTTP/1.1\r\n"
        "Host: localhost\r\n"
        "Opentrons-Version: *\r\n"
        "Connection: close\r\n"
        "\r\n"
    ).encode("ascii")
    ser.write(request)
    ser.flush()
    time.sleep(USB_DELAY_AFTER_WRITE_S)  # allow response to start (longer on Windows)
    status_code, body_out = _read_http_response(ser, timeout)
    # Drain any leftover bytes so next request gets a clean read
    ser.reset_input_buffer()
    return status_code, body_out


def _serial_get(port_path: str, path: str, timeout: float = 30.0) -> Tuple[int, bytes]:
    """Send HTTP GET over serial (open/close; for one-off use). Return (status_code, body)."""
    import serial
    with serial.Serial(
        port=port_path,
        baudrate=USB_SERIAL_BAUD,
        timeout=timeout,
        write_timeout=timeout,
    ) as ser:
        req = (
            f"GET {path} HTTP/1.1\r\n"
            "Host: localhost\r\n"
            "Opentrons-Version: *\r\n"
            "Connection: close\r\n\r\n"
        ).encode("ascii")
        ser.write(req)
        ser.flush()
        return _read_http_response(ser, timeout)


def _serial_request_over_ser(
    ser,
    method: str,
    path: str,
    body: Optional[bytes] = None,
    content_type: Optional[str] = None,
    timeout: float = 30.0,
) -> Tuple[int, bytes]:
    """Send HTTP request over an already-open serial port. Return (status_code, body)."""
    lines = [
        f"{method} {path} HTTP/1.1",
        "Host: localhost",
        "Opentrons-Version: *",
        "Connection: close",
    ]
    if body is not None and content_type:
        lines.append(f"Content-Type: {content_type}")
        lines.append(f"Content-Length: {len(body)}")
    elif method.upper() == "POST":
        # No body: tell server explicitly so it doesn't wait for body bytes
        lines.append("Content-Length: 0")
    lines.append("")
    header_block = "\r\n".join(lines).encode("ascii")
    request = header_block + b"\r\n" + (body if body else b"")
    if _USB_DEBUG:
        print(
            "[USB debug] sending request ({} bytes):\n{}".format(
                len(request), request.decode("ascii", errors="replace")
            ),
            file=sys.stderr,
        )
        print("[USB debug] raw bytes (hex): {}".format(request.hex()), file=sys.stderr)
    ser.write(request)
    ser.flush()
    time.sleep(USB_DELAY_AFTER_WRITE_S)
    status_code, body_out = _read_http_response(ser, timeout)
    ser.reset_input_buffer()
    return status_code, body_out


def _serial_request(
    port_path: str,
    method: str,
    path: str,
    body: Optional[bytes] = None,
    content_type: Optional[str] = None,
    timeout: float = 30.0,
) -> Tuple[int, bytes]:
    """Send HTTP request over serial (open/close). Return (status_code, body)."""
    import serial
    with serial.Serial(
        port=port_path,
        baudrate=USB_SERIAL_BAUD,
        timeout=timeout,
        write_timeout=timeout,
    ) as ser:
        lines = [
            f"{method} {path} HTTP/1.1",
            "Host: localhost",
            "Opentrons-Version: *",
            "Connection: close",
        ]
        if body is not None and content_type:
            lines.append(f"Content-Type: {content_type}")
            lines.append(f"Content-Length: {len(body)}")
        elif method.upper() == "POST":
            lines.append("Content-Length: 0")
        lines.append("")
        header_block = "\r\n".join(lines).encode("ascii")
        req = header_block + b"\r\n" + (body if body else b"")
        ser.write(req)
        ser.flush()
        return _read_http_response(ser, timeout)


def _serial_post_multipart_over_ser(
    ser,
    path: str,
    file_path: Path,
    field_name: str,
    timeout: float = 600.0,
) -> Tuple[int, bytes]:
    """POST multipart/form-data over an already-open serial port. Return (status_code, body)."""
    boundary = "----OpentronsUpdateBoundary"
    with open(file_path, "rb") as f:
        file_data = f.read()
    filename = file_path.name
    body_start = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'
        "Content-Type: application/zip\r\n\r\n"
    ).encode("ascii")
    body_end = f"\r\n--{boundary}--\r\n".encode("ascii")
    body = body_start + file_data + body_end
    content_type = f"multipart/form-data; boundary={boundary}"
    lines = [
        f"POST {path} HTTP/1.1",
        "Host: localhost",
        "Opentrons-Version: *",
        "Connection: close",
        f"Content-Type: {content_type}",
        f"Content-Length: {len(body)}",
        "",
    ]
    header_block = "\r\n".join(lines).encode("ascii")
    request = header_block + b"\r\n" + body
    chunk_size = 8192
    for i in range(0, len(request), chunk_size):
        ser.write(request[i : i + chunk_size])
    ser.flush()
    time.sleep(USB_DELAY_AFTER_WRITE_MULTIPART_S)
    status_code, body_out = _read_http_response(ser, timeout)
    ser.reset_input_buffer()
    return status_code, body_out


def _serial_post_multipart(
    port_path: str,
    path: str,
    file_path: Path,
    field_name: str,
    timeout: float = 120.0,
) -> Tuple[int, bytes]:
    """POST multipart over serial (open/close). Return (status_code, body)."""
    import serial
    with serial.Serial(
        port=port_path,
        baudrate=USB_SERIAL_BAUD,
        timeout=timeout,
        write_timeout=timeout,
    ) as ser:
        return _serial_post_multipart_over_ser(ser, path, file_path, field_name, timeout)


def run_one_update_usb(
    ser,
    system_file: Path,
    timeout: float,
) -> None:
    """Run a single update over an already-open USB serial port (one connection, like the Opentrons app)."""
    field_name = "system-update.zip"
    begin_timeout = max(timeout, USB_BEGIN_TIMEOUT_S)

    # Begin session (retry on 409). Same open port for all requests.
    try:
        status, raw = _serial_request_over_ser(
            ser, "POST", "/server/update/begin", timeout=begin_timeout
        )
        if status == 409:
            print("Existing session detected (409). Clearing and retrying...", file=sys.stderr)
            time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)
            _serial_request_over_ser(
                ser, "POST", "/server/update/cancel", timeout=begin_timeout
            )
            time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)
            status, raw = _serial_request_over_ser(
                ser, "POST", "/server/update/begin", timeout=begin_timeout
            )
        if status != 201:
            msg = raw.decode("utf-8", errors="replace").strip()[:300] if raw else "(no data)"
            if status == 0:
                raw_preview = repr(raw[:200]) if raw else "empty"
                raise RuntimeError(
                    "begin failed: no valid HTTP response (robot may need more time). "
                    "Raw: {}".format(raw_preview)
                )
            raise RuntimeError("begin failed: HTTP {} — {}".format(status, msg))
        token = json.loads(raw.decode("utf-8")).get("token")
        if not token:
            raise ValueError("No token in begin response")
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid begin response: {e}") from e

    time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)

    # Wait for awaiting-file
    print("Waiting for session to be ready for file upload...", file=sys.stderr)
    start = time.time()
    while time.time() - start < 300:
        status, raw = _serial_get_over_ser(ser, f"/server/update/{token}/status", timeout=timeout)
        if status == 404:
            try:
                err = json.loads(raw.decode("utf-8"))
                if err.get("error") == "bad-token":
                    raise RuntimeError(
                        "Update session was lost on the robot (404 bad-token). "
                        "update-server may have restarted. Check the robot version and re-run."
                    )
            except json.JSONDecodeError:
                pass
        if status != 200:
            raise RuntimeError(f"status failed: HTTP {status}")
        data = json.loads(raw.decode("utf-8"))
        stage = data.get("stage", "")
        if stage == "awaiting-file":
            print("Session ready for file upload", file=sys.stderr)
            break
        if stage == "error":
            raise RuntimeError(f"Session error: {data.get('error', 'unknown')}")
        time.sleep(2)
    else:
        raise TimeoutError("Timeout waiting for session to be ready")

    time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)

    # Upload file
    file_size_mb = system_file.stat().st_size / (1024 * 1024)
    print(f"Uploading {system_file.name} ({file_size_mb:.1f} MB) over USB...", file=sys.stderr)
    print("Large uploads over USB can take 5–10+ minutes; please wait.", file=sys.stderr)
    status, raw = _serial_post_multipart_over_ser(
        ser, f"/server/update/{token}/file", system_file, field_name, timeout=600
    )
    if status not in (200, 201):
        raise RuntimeError(f"Upload failed: HTTP {status} — {raw.decode('utf-8', errors='replace')[:300]}")
    data = json.loads(raw.decode("utf-8"))
    print(f"✅ File received by robot — stage: {STAGE_LABELS.get(data.get('stage'), data.get('stage'))}", file=sys.stderr)

    time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)

    # Poll until done
    print("Polling update status (validating + writing can take several minutes over USB)...", file=sys.stderr)
    start = time.time()
    last_stage = None
    while time.time() - start < 600:
        status, raw = _serial_get_over_ser(ser, f"/server/update/{token}/status", timeout=timeout)
        if status == 404:
            try:
                err = json.loads(raw.decode("utf-8"))
                if err.get("error") == "bad-token":
                    raise RuntimeError(
                        "Update session was lost on the robot (404 bad-token) during validate/write. "
                        "update-server may have restarted. Check the robot version and re-run."
                    )
            except json.JSONDecodeError:
                pass
        if status != 200:
            raise RuntimeError(f"status failed: HTTP {status}")
        data = json.loads(raw.decode("utf-8"))
        stage = data.get("stage", "")
        if stage != last_stage:
            print(f"  Stage → {STAGE_LABELS.get(stage, stage)}", file=sys.stderr)
            last_stage = stage
        if stage == "done":
            print("✅ Update written — ready to commit", file=sys.stderr)
            break
        if stage == "error":
            raise RuntimeError(f"Update failed: {data.get('error', 'unknown')} — {data.get('message', '')}")
        time.sleep(3)
    else:
        raise TimeoutError("Timeout waiting for update to complete")

    time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)

    # Commit and restart
    print("Committing update...", file=sys.stderr)
    status, raw = _serial_request_over_ser(
        ser, "POST", f"/server/update/{token}/commit", timeout=timeout
    )
    if status != 200:
        raise RuntimeError(f"Commit failed: HTTP {status}")
    time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)
    print("Triggering robot restart...", file=sys.stderr)
    print("Robot may drop USB connection during restart — that's normal.", file=sys.stderr)
    try:
        _serial_request_over_ser(ser, "POST", "/server/restart", timeout=5)
    except Exception:
        pass  # Robot disconnects during restart — expected, not a failure
    print("✅ Robot is restarting. Update complete.", file=sys.stderr)
    print(
        "  (Commit succeeded on the robot. USB may be gone for several minutes during reboot — "
        "still expected, not proof the update failed.)",
        file=sys.stderr,
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Update Opentrons Flex system software from GitHub or local zip, over network or USB."
    )
    parser.add_argument(
        "ip",
        nargs="?",
        help="Robot IP address (omit when using --usb)",
    )
    parser.add_argument(
        "--usb",
        action="store_true",
        help="Use USB serial connection (Flex/OT-3). No network needed; requires --file.",
    )
    parser.add_argument(
        "--version",
        nargs="+",
        metavar="VERSION",
        help="One or more versions to apply in order (spaces or commas between versions, e.g. "
        "8.8.1 9.0.0 or 8.8.1, 9.0.0). Optional when using --file (version derived from ot3-system-X.Y.Z.zip name).",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=31950,
        help="Port for real robot (default: 31950, robot server). Use 34000 for local dev server.",
    )
    parser.add_argument(
        "--wait-after-restart",
        type=float,
        default=DEFAULT_WAIT_AFTER_RESTART_S,
        help="Max seconds to poll for the robot to respond again after POST /server/restart (GET /health until 200; "
        "default: %(default)s ≈ 15 min). Flex can be offline ~10+ minutes; HTTP errors during this window do not mean "
        "the update failed once commit succeeded.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Request timeout in seconds (default: 30)",
    )
    parser.add_argument(
        "--stable-state-timeout",
        type=float,
        default=float(STABLE_STATE_TIMEOUT_S),
        help="Max seconds to wait for pipettes/grippers online with serials, then N matching polls "
        "(see --flex-stable-consecutive-polls). Pipettes can take many minutes on real hardware — this is only a hard "
        "cap. Default %(default)s (~17 min).",
    )
    parser.add_argument(
        "--subsystem-fw-idle-max",
        type=float,
        default=float(SUBSYSTEM_FIRMWARE_IDLE_MAX_S),
        help="Max seconds to wait for GET /subsystems/updates/current to show no queued/updating firmware jobs "
        "before starting the stable-snapshot timer (default %(default)s ≈ 30 min). Extension mount / gripper often "
        "updates after a system image; this wait does not count against --stable-state-timeout.",
    )
    parser.add_argument(
        "--stable-state-nag-after",
        type=float,
        default=float(STABLE_STATE_NAG_AFTER_S),
        help="After this many seconds (default %(default)s ≈ 7 min), print one reminder to check the "
        "robot if still waiting.",
    )
    parser.add_argument(
        "--stable-state-poll-interval",
        type=float,
        default=float(STABLE_STATE_POLL_INTERVAL_S),
        help="Seconds between state snapshot polls while waiting (default: %(default)s).",
    )
    parser.add_argument(
        "--flex-stable-consecutive-polls",
        type=int,
        default=FLEX_STABLE_CONSECUTIVE_POLLS_DEFAULT,
        metavar="N",
        help="After pipettes report healthy serials, require N consecutive matching instrument/module "
        "snapshots (default %(default)s).",
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip download, use existing file (must provide --file)",
    )
    parser.add_argument(
        "--file",
        type=Path,
        action="append",
        metavar="ZIP",
        help="Path to system zip. Repeat for consecutive USB updates: --file a.zip --file b.zip --file c.zip. Version derived from filename (ot3-system-8.8.1.zip).",
    )
    parser.add_argument(
        "-y",
        "--yes",
        action="store_true",
        help="Skip the confirmation prompt",
    )
    parser.add_argument(
        "--debug-usb",
        action="store_true",
        help="Log exact request bytes and raw response bytes over USB (for debugging POST begin).",
    )
    args = parser.parse_args()

    if args.version:
        args.version = normalize_version_cli_args(args.version)

    if args.usb:
        global _USB_DEBUG
        configure_usb_serial_helpers(_serial_get, _find_opentrons_usb_port)
        _USB_DEBUG = bool(args.debug_usb)
        if _USB_DEBUG:
            print("USB debug: logging request bytes and raw response bytes.", file=sys.stderr)
        files = args.file if args.file else []
        if not files:
            print("Error: --usb requires --file (path to ot3-system-X.Y.Z.zip).", file=sys.stderr)
            return 1
        for f in files:
            if not f.exists():
                print(f"Error: file not found: {f}", file=sys.stderr)
                return 1
        versions = [version_from_zip_path(f) for f in files]
        if any(not v for v in versions):
            print("Error: could not derive version from filename. Use ot3-system-X.Y.Z.zip.", file=sys.stderr)
            return 1
        if args.ip:
            print("Error: do not pass an IP when using --usb.", file=sys.stderr)
            return 1
        port_path = _find_opentrons_usb_port()
        if not port_path:
            print(
                "No Opentrons Flex/OT-3 USB device found. Connect the robot via USB. (Install pyserial if needed: pip install pyserial)",
                file=sys.stderr,
            )
            return 1

        # Open port once and keep it open for the whole flow (like the Opentrons app).
        import serial
        try:
            ser = serial.Serial(
                port=port_path,
                baudrate=USB_SERIAL_BAUD,
                timeout=args.timeout,
                write_timeout=args.timeout,
            )
        except OSError as e:
            if e.errno == 16:
                print(
                    f"USB port {port_path} is in use. Close the Opentrons app (it holds the serial device) and try again.",
                    file=sys.stderr,
                )
            else:
                print(f"USB error: {e}", file=sys.stderr)
            return 1

        try:
            # Health over the same connection
            status, raw = _serial_get_over_ser(ser, "/health", args.timeout)
            if status != 200:
                print(f"Error: robot health returned HTTP {status}", file=sys.stderr)
                try:
                    body_str = raw.decode("utf-8", errors="replace").strip()
                    if body_str:
                        print(f"Response body: {body_str[:500]}", file=sys.stderr)
                except Exception:
                    pass
                ser.close()
                return 1
            health = json.loads(raw.decode("utf-8"))
        except Exception as e:
            print(f"USB error: {e}", file=sys.stderr)
            ser.close()
            return 1

        # Second health on same connection — verify USB likes consecutive requests
        time.sleep(USB_DELAY_BETWEEN_REQUESTS_S)
        status2, raw2 = _serial_get_over_ser(ser, "/health", args.timeout)
        if status2 != 200:
            print(
                "Error: second health request failed (HTTP {}). USB may not like consecutive requests.".format(status2),
                file=sys.stderr,
            )
            if raw2:
                try:
                    print("Response: {}".format(raw2.decode("utf-8", errors="replace")[:300]), file=sys.stderr)
                except Exception:
                    pass
            ser.close()
            return 1
        print("  Second health OK (two requests on same connection).", file=sys.stderr)

        robot_model = health.get("robot_model", "OT-3 Standard")
        robot_name = health.get("name", "unknown")
        current_ver = health.get("api_version") or health.get("api_Version", "unknown")

        print("", file=sys.stderr)
        print("  Connection:  USB (serial port {}) — no network".format(port_path), file=sys.stderr)
        print("", file=sys.stderr)
        print(f"  Robot:       {robot_name}", file=sys.stderr)
        print(f"  Model:       {robot_model}", file=sys.stderr)
        print(f"  Current:     {current_ver}", file=sys.stderr)
        if len(versions) == 1:
            print(f"  Target:      {versions[0]}", file=sys.stderr)
        else:
            print(f"  Target:      {' → '.join(versions)} (consecutive)", file=sys.stderr)
        print("", file=sys.stderr)

        if not args.yes:
            try:
                answer = input("  Proceed with update over USB? [y/N] ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                answer = ""
            if answer not in ("y", "yes"):
                print("Aborted.", file=sys.stderr)
                ser.close()
                return 0

        print("  Pausing {}s so robot is ready for update session...".format(USB_DELAY_AFTER_HEALTH_S), file=sys.stderr)
        time.sleep(USB_DELAY_AFTER_HEALTH_S)

        last_completed_version_usb: Optional[str] = None
        try:
            for idx, (file_path, version) in enumerate(zip(files, versions)):
                if len(files) > 1:
                    print("\n── Update {}/{}: {} ──".format(idx + 1, len(files), version), file=sys.stderr)
                run_one_update_usb(ser, file_path, args.timeout)
                last_completed_version_usb = version
                if idx < len(files) - 1:
                    try:
                        ser.close()
                    except Exception:
                        pass
                    wait_for_robot_ready_usb(
                        timeout=args.wait_after_restart,
                        interval=10,
                    )
                    port_path = _find_opentrons_usb_port()
                    if not port_path:
                        raise RuntimeError("Robot not found after restart. Reconnect USB and retry.")
                    runs, pipettes_rows, modules_serials = wait_for_robot_state_after_restart_usb(
                        port_path,
                        args.timeout,
                        flex_stable_timeout=args.stable_state_timeout,
                        flex_nag_after=args.stable_state_nag_after,
                        flex_poll_interval=args.stable_state_poll_interval,
                        flex_consecutive_matching_polls=args.flex_stable_consecutive_polls,
                        subsystem_firmware_idle_max_s=args.subsystem_fw_idle_max,
                    )
                    print("Ready for next update (stable state snapshot OK).", file=sys.stderr)
                    api_ver_bt, _ = fetch_usb_health_calibration(port_path, args.timeout)
                    sw_bt = api_ver_bt if api_ver_bt != "?" else version
                    format_state_tables(
                        runs,
                        pipettes_rows,
                        modules_serials,
                        "State after update {} ({})".format(idx + 1, version),
                        software_version=sw_bt,
                    )
                    ser = serial.Serial(
                        port=port_path,
                        baudrate=USB_SERIAL_BAUD,
                        timeout=args.timeout,
                        write_timeout=args.timeout,
                    )
                else:
                    try:
                        ser.close()
                    except Exception:
                        pass
                    wait_for_robot_ready_usb(
                        timeout=args.wait_after_restart,
                        interval=10,
                    )
                    port_path = _find_opentrons_usb_port()
                    if port_path:
                        usb_final_summary(
                            port_path,
                            args.timeout,
                            files[-1],
                            args.stable_state_timeout,
                            args.stable_state_nag_after,
                            args.stable_state_poll_interval,
                            args.flex_stable_consecutive_polls,
                            versions[-1],
                            subsystem_firmware_idle_max_s=args.subsystem_fw_idle_max,
                        )
            print("\n✅ Update completed successfully!", file=sys.stderr)
            return 0
        except (ValueError, RuntimeError, TimeoutError, json.JSONDecodeError) as e:
            print(f"Error: {e}", file=sys.stderr)
            pp = _find_opentrons_usb_port()
            if pp:
                try_print_usb_state_on_failure(
                    pp,
                    args.timeout,
                    "State after error (best effort)",
                    last_completed_version_usb or "?",
                    fetch_usb_once=fetch_state_usb_once,
                )
            return 1
        except OSError as e:
            if e.errno == 16:
                print(f"USB port busy: {e}", file=sys.stderr)
            else:
                print(f"USB error: {e}", file=sys.stderr)
            return 1
        finally:
            try:
                ser.close()
            except Exception:
                pass

    # ─── Network path ───
    if not args.ip:
        print("Error: provide an IP address, or use --usb for USB connection.", file=sys.stderr)
        return 1

    # Resolve version(s): either from --version or from --file filename (update via USB / local file).
    # Network supports multiple --file (consecutive updates from local zips, same as USB).
    local_files: Optional[List[Path]] = None  # when set, one file per version in order (no download)
    if args.file is not None and len(args.file) > 0:
        files = list(args.file)
        for file_path in files:
            if not file_path.exists():
                print(f"Error: file not found: {file_path}", file=sys.stderr)
                return 1
        args.skip_download = True
        if len(files) > 1:
            # Multiple local files: versions from filenames, one file per update (no download).
            if args.version:
                print(
                    "Error: do not pass --version with multiple --file; version is derived from each filename.",
                    file=sys.stderr,
                )
                return 1
            versions = [version_from_zip_path(f) for f in files]
            if any(not v for v in versions):
                print(
                    "Error: could not derive version from every filename. Use ot3-system-X.Y.Z.zip.",
                    file=sys.stderr,
                )
                return 1
            local_files = files
        else:
            # Single file
            file_path = files[0]
            if args.version and len(args.version) > 1:
                print(
                    "Error: multiple versions are not supported with a single --file.",
                    file=sys.stderr,
                )
                return 1
            if args.version:
                versions = args.version
            else:
                derived = version_from_zip_path(file_path)
                if derived is None:
                    print(
                        "Error: could not derive version from filename. Use --version or name file ot3-system-X.Y.Z.zip.",
                        file=sys.stderr,
                    )
                    return 1
                versions = [derived]
    elif args.version:
        versions = args.version
        if len(versions) > 1 and args.skip_download:
            print(
                "Error: --skip-download and --file are not supported with multiple versions.",
                file=sys.stderr,
            )
            return 1
    else:
        print(
            "Error: provide --version (or --file to use a local zip and derive version from filename).",
            file=sys.stderr,
        )
        return 1

    base_url = f"http://{args.ip}:{args.port}"
    robot_model = "OT-3 Standard"
    last_completed_version: Optional[str] = None

    try:
        with httpx.Client(
            headers={"Opentrons-Version": "*"},
            timeout=args.timeout,
        ) as client:
            # ── Pre-flight: show current robot state and ask for confirmation ──
            print("", file=sys.stderr)
            print("  Connection:  network ({})".format(base_url), file=sys.stderr)
            print("", file=sys.stderr)
            health = get_robot_health(client, base_url, args.timeout)
            robot_model = health.get("robot_model", "OT-3 Standard")
            robot_name = health.get("name", "unknown")
            current_ver = health.get("api_version") or health.get(
                "api_Version", "unknown"
            )
            active_run = health.get("activeProtocolRun")

            print(
                f"\n  Robot:           {robot_name}  ({args.ip}:{args.port})",
                file=sys.stderr,
            )
            print(f"  Model:           {robot_model}", file=sys.stderr)
            print(f"  Current version: {current_ver}", file=sys.stderr)
            if len(versions) == 1:
                print(f"  Target version:  {versions[0]}", file=sys.stderr)
            else:
                print(
                    f"  Target versions: {' → '.join(versions)} (consecutive)",
                    file=sys.stderr,
                )

            # Fail fast if this robot/firmware doesn't expose the update API
            api_ok, probe_token = check_update_api_available(client, base_url)
            if not api_ok:
                print(
                    "\n  Update API not available on this robot.",
                    file=sys.stderr,
                )
                print(
                    "  POST /server/update/begin returned 404. This firmware may not expose\n"
                    "  the update server, or it may use a different URL. Run your endpoint\n"
                    "  probe (e.g. Example_file_tests.py) to re-check on different robots.",
                    file=sys.stderr,
                )
                return 1
            if probe_token:
                cancel_update_session(client, base_url)

            if active_run:
                print(
                    f"\n⚠️  WARNING: a protocol run is currently active ({active_run}).\n"
                    "  Updating while a run is active may leave the robot in an\n"
                    "  inconsistent state. Abort the run first.",
                    file=sys.stderr,
                )

            if len(versions) == 1 and current_ver == versions[0]:
                print(
                    f"\n⚠️  Robot is already on version {current_ver}. "
                    "Proceeding will re-flash the same version.",
                    file=sys.stderr,
                )

            print("", file=sys.stderr)

            if not args.yes:
                try:
                    answer = input("  Proceed with update? [y/N] ").strip().lower()
                except (EOFError, KeyboardInterrupt):
                    answer = ""
                if answer not in ("y", "yes"):
                    print("Aborted.", file=sys.stderr)
                    return 0

            print("", file=sys.stderr)

            for idx, version in enumerate(versions):
                # Same as USB path: between consecutive updates, wait for robot to come back after restart (USB: wait_for_robot_ready_usb + reopen port; network: poll /health until 200).
                if len(versions) > 1 and idx > 0:
                    wait_for_robot_ready(
                        client,
                        base_url,
                        timeout=args.wait_after_restart,
                        interval=10,
                    )
                    # Ensure update server is ready before begin/upload (avoids 502 Bad Gateway)
                    wait_for_update_server_ready(
                        client,
                        base_url,
                        timeout=NETWORK_UPDATE_SERVER_READY_TIMEOUT_S,
                        interval=5,
                    )
                    runs, pipettes_rows, modules_serials = wait_for_robot_state_after_restart_network(
                        client,
                        base_url,
                        args.timeout,
                        flex_stable_timeout=args.stable_state_timeout,
                        flex_nag_after=args.stable_state_nag_after,
                        flex_poll_interval=args.stable_state_poll_interval,
                        flex_consecutive_matching_polls=args.flex_stable_consecutive_polls,
                        subsystem_firmware_idle_max_s=args.subsystem_fw_idle_max,
                    )
                    print(
                        "Ready for next update (health, update server, state snapshot OK).",
                        file=sys.stderr,
                    )
                    _sw, robot_model = health_version_and_model_or_fallback(
                        client,
                        base_url,
                        args.timeout,
                        versions[idx - 1],
                        robot_model,
                    )
                    format_state_tables(
                        runs,
                        pipettes_rows,
                        modules_serials,
                        "State after update {} ({})".format(idx, versions[idx - 1]),
                        software_version=_sw,
                    )

                print(
                    f"\n── Update {idx + 1}/{len(versions)}: {version} ──",
                    file=sys.stderr,
                )

                # Use local file(s) or download from GitHub
                if local_files is not None and idx < len(local_files):
                    system_file = local_files[idx]
                    cleanup_file = False
                elif args.skip_download and args.file and len(args.file) > 0 and args.file[0].exists():
                    system_file = args.file[0]
                    cleanup_file = False
                else:
                    with tempfile.NamedTemporaryFile(
                        delete=False, suffix=".zip"
                    ) as tmp:
                        system_file = Path(tmp.name)
                    try:
                        download_system_file(
                            version,
                            system_file,
                            lambda p: print(
                                f"Download progress: {p:.1f}%", file=sys.stderr
                            ),
                        )
                    except Exception:
                        if system_file.exists():
                            system_file.unlink()
                        raise
                    cleanup_file = True

                try:
                    run_one_update(client, base_url, version, system_file)
                    last_completed_version = version
                finally:
                    if cleanup_file and system_file.exists():
                        system_file.unlink()

            # Same as USB: wait for robot to come back after last update, then print final state.
            wait_for_robot_ready(
                client,
                base_url,
                timeout=args.wait_after_restart,
                interval=10,
            )
            wait_for_update_server_ready(
                client,
                base_url,
                timeout=NETWORK_UPDATE_SERVER_READY_TIMEOUT_S,
                interval=5,
            )
            runs, pipettes_rows, modules_serials = wait_for_robot_state_after_restart_network(
                client,
                base_url,
                args.timeout,
                flex_stable_timeout=args.stable_state_timeout,
                flex_nag_after=args.stable_state_nag_after,
                flex_poll_interval=args.stable_state_poll_interval,
                flex_consecutive_matching_polls=args.flex_stable_consecutive_polls,
                subsystem_firmware_idle_max_s=args.subsystem_fw_idle_max,
            )
            # After the *last* update, /health often lags behind /instruments (nginx); this is the usual failure point.
            try:
                health = wait_for_robot_health_json(
                    client,
                    base_url,
                    args.timeout,
                    overall_timeout=args.stable_state_timeout,
                )
            except RuntimeError as e:
                print(f"  Warning: {e}", file=sys.stderr)
                print(
                    "  Printing Final state anyway (runs/modules serials above are from the stable snapshot).",
                    file=sys.stderr,
                )
                health = {}
            robot_model = health.get("robot_model") or robot_model
            last_ver = versions[-1]
            file_uploaded_name = f"ot3-system-{last_ver}.zip"
            # Header lines then pretty table (runs + LPCs + serials) for end comparison
            api_ver = health.get("api_version") or health.get("api_Version") or versions[-1]
            header_lines = [
                "File uploaded:     " + file_uploaded_name,
            ]
            try:
                resp = client.get(f"{base_url}/calibration/status", timeout=args.timeout)
                if resp.status_code == 200:
                    data = resp.json()
                    deck = (data.get("deckCalibration") or {}).get("status", "?")
                    header_lines.append("Calibration:       " + str(deck))
            except Exception:
                header_lines.append("Calibration:       ?")
            format_state_tables(
                runs,
                pipettes_rows,
                modules_serials,
                "Final state",
                header_lines=header_lines,
                software_version=str(api_ver),
            )

            print("\n✅ All updates completed successfully!", file=sys.stderr)
            if len(versions) == 1:
                print("Update complete.", file=sys.stderr)
            return 0

    except httpx.HTTPStatusError as e:
        print_http_status_error(e)
        print_diagnostic_after_network_exception(
            args.ip,
            args.port,
            args.timeout,
            last_completed_version,
            fetch_network_once=fetch_state_network_once,
        )
        return 1
    except httpx.ConnectError as e:
        print(f"Connection error: {e}", file=sys.stderr)
        print_diagnostic_after_network_exception(
            args.ip,
            args.port,
            args.timeout,
            last_completed_version,
            fetch_network_once=fetch_state_network_once,
        )
        return 1
    except httpx.RequestError as e:
        print(f"Request error: {e}", file=sys.stderr)
        print_diagnostic_after_network_exception(
            args.ip,
            args.port,
            args.timeout,
            last_completed_version,
            fetch_network_once=fetch_state_network_once,
        )
        return 1
    except (ValueError, RuntimeError, TimeoutError) as e:
        print(f"Error: {e}", file=sys.stderr)
        print_diagnostic_after_network_exception(
            args.ip,
            args.port,
            args.timeout,
            last_completed_version,
            fetch_network_once=fetch_state_network_once,
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
