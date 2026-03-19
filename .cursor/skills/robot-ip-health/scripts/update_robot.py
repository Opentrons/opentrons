#!/usr/bin/env python3
"""Update robot system software by downloading from GitHub or from a local zip, over network or USB.

Requires: httpx (pip install httpx). For --usb: pyserial (pip install pyserial).

Usage:
    # Over network (robot has IP)
    python update_robot.py 10.14.19.233 --version 8.8.1
    python update_robot.py 10.14.19.233 --file /path/to/ot3-system-8.8.1.zip -y
    # Over USB (Flex/OT-3 only; Wi‑Fi can be off). Requires --file.
    python update_robot.py --usb --file .cursor/skills/robot-ip-health/scripts/ot3-system-8.8.1.zip -y
"""

import argparse
import json
import re
import sys
import tempfile
import time
from pathlib import Path
from typing import List, Optional, Tuple

import httpx

# ─── USB (same as app-shell / check_health) ───
OPENTRONS_USB_VID = 0x1B67
OPENTRONS_USB_PID = 0x4037
USB_SERIAL_BAUD = 1_152_000
# Pacing: robot/USB bridge can miss or corrupt if we send back-to-back too fast
USB_DELAY_AFTER_HEALTH_S = 2.0  # wait after GET /health before starting update session
# Network: after restart, main /health can be 200 before nginx/update-server is ready → 502 on upload
NETWORK_DELAY_AFTER_READY_S = 2.0  # wait after update server is ready before starting next update
NETWORK_UPDATE_SERVER_READY_TIMEOUT_S = 90  # max time to wait for GET /server/update/health after /health is up
# After restart, GET /health and /server/update/health can be 200 while nginx still returns 502 for robot-server routes.
NETWORK_HTTP_API_READY_TIMEOUT_S = 1000  # default --http-api-ready-timeout (non-Flex robots only; Flex uses --stable-state-*)
# Stable snapshot: HTTP 200 on state routes + populated serials; two identical snapshots in a row.
STABLE_STATE_TIMEOUT_S = 1000.0  # default ≥10 min before giving up on a good snapshot
STABLE_STATE_NAG_AFTER_S = 420.0  # at 7 min, print a one-time “check the robot” message
STABLE_STATE_POLL_INTERVAL_S = 5.0
NETWORK_502_RETRIES = 3  # retry begin/upload this many times on 502 (Bad Gateway)
NETWORK_502_RETRY_DELAY_S = 10  # seconds between 502 retries
USB_DELAY_BETWEEN_REQUESTS_S = 1.0  # wait after each request/response before next
USB_BEGIN_TIMEOUT_S = 60.0  # longer timeout for POST begin (update server may be slow)
# Windows serial stack often needs a bit more time after write before read (consecutive request/response)
USB_DELAY_AFTER_WRITE_S = 0.35 if sys.platform == "win32" else 0.2
USB_DELAY_AFTER_WRITE_MULTIPART_S = 0.4 if sys.platform == "win32" else 0.3

# Match ot3-system-8.8.1.zip or ot2-system-9.0.0-alpha.11.zip to derive version from filename
VERSION_FROM_FILENAME = re.compile(
    r"^(?:ot3|ot2)-system-(.+)\.zip$", re.IGNORECASE
)

# Set by main() when --debug-usb; used by USB serial helpers to log request/response bytes
_USB_DEBUG = False


def version_from_zip_path(path: Path) -> Optional[str]:
    """Derive target version from zip filename (e.g. ot3-system-8.8.1.zip -> 8.8.1)."""
    match = VERSION_FROM_FILENAME.match(path.name)
    return match.group(1) if match else None


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


def _is_flex_robot(robot_model: str) -> bool:
    """True for Opentrons Flex (OT-3). Health uses robot_model e.g. OT-3 Standard."""
    return "OT-3" in robot_model


def get_robot_health(
    client: httpx.Client, base_url: str, request_timeout: Optional[float] = None
) -> dict:
    """Fetch the full /health payload. Short retries on 502/503 (initial connect / quick checks)."""
    # Robot server GET /health — response shape: .cursor/skills/robot-ip-health/SKILL.md (Health Response Fields)
    data = _get_json_or_none(
        client, f"{base_url}/health", request_timeout, "/health", verbose=False
    )
    if data is None:
        raise RuntimeError(
            "GET /health did not return 200 after retries (robot may still be starting)"
        )
    return data


def wait_for_robot_health_json(
    client: httpx.Client,
    base_url: str,
    per_request_timeout: float,
    overall_timeout: float = STABLE_STATE_TIMEOUT_S,
    interval: float = 5.0,
) -> dict:
    """Poll GET /health until HTTP 200 or overall_timeout.

    After a restart, nginx may return 200 for /runs and /instruments while /health still 502s
    (different upstream or caching). Use this after stable snapshot instead of get_robot_health.
    """
    print(
        "Waiting for GET /health (software version for Final state) — often the last route to recover after restart…",
        file=sys.stderr,
    )
    start = time.time()
    while time.time() - start < overall_timeout:
        try:
            resp = client.get(f"{base_url}/health", timeout=per_request_timeout)
            if resp.status_code == 200:
                return resp.json()
        except httpx.TransportError:
            pass
        time.sleep(interval)
    raise RuntimeError(
        f"GET /health did not return 200 within {overall_timeout:.0f}s "
        "(nginx may still be proxying /health to a cold robot-server — retry or wait and run check_health)."
    )


def get_robot_model(client: httpx.Client, base_url: str) -> str:
    """Get robot model from /health endpoint."""
    # Same as get_robot_health — .cursor/skills/robot-ip-health/SKILL.md (robot_model: OT-2 Standard | OT-3 Standard)
    return get_robot_health(client, base_url).get("robot_model", "OT-2 Standard")


def check_update_api_available(
    client: httpx.Client, base_url: str
) -> tuple[bool, Optional[str]]:
    """Probe POST /server/update/begin. Returns (available, token_or_None).

    - 404: update API not present on this robot/firmware → (False, None).
    - 201: API present, session created → (True, token); caller should cancel it.
    - 409: API present, session already active → (True, None).
    """
    # update-server/otupdate/common/update.py — begin(): 201 + token, 409 if session exists
    # app/src/redux/robot-update/__fixtures__/index.ts — mockUpdateBeginSuccess (201), mockUpdateBeginConflict (409)
    resp = client.post(f"{base_url}/server/update/begin")
    if resp.status_code == 404:
        return False, None
    if resp.status_code == 201:
        data = resp.json()
        return True, data.get("token")
    if resp.status_code == 409:
        return True, None
    resp.raise_for_status()
    return True, None


def download_system_file(
    version: str, robot_model: str, output_path: Path, progress_callback=None
) -> None:
    """Download system update file from GitHub releases."""
    # Zip names and multipart field names: update-server/otupdate/buildroot/update_actions.py (UPDATE_PKG_BR),
    # update-server/otupdate/openembedded/update_actions.py (UPDATE_PKG_OE). SKILL.md — GitHub Release URLs.
    if robot_model == "OT-3 Standard":
        filename = f"ot3-system-{version}.zip"
    else:
        filename = f"ot2-system-{version}.zip"

    # GitHub releases download URL pattern
    download_url = f"https://github.com/Opentrons/opentrons/releases/download/v{version}/{filename}"

    print(f"Downloading {filename} from GitHub releases...", file=sys.stderr)
    print(f"URL: {download_url}", file=sys.stderr)

    with httpx.stream("GET", download_url, follow_redirects=True) as resp:
        if resp.status_code >= 400:
            resp.read()  # consume body so exception handler can use e.response.json()/text
        resp.raise_for_status()
        total_size = int(resp.headers.get("content-length", 0))

        with open(output_path, "wb") as f:
            downloaded = 0
            last_shown_pct = -1
            for chunk in resp.iter_bytes(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if progress_callback and total_size > 0:
                    progress = (downloaded / total_size) * 100
                    p_int = int(progress)
                    if p_int > last_shown_pct or downloaded >= total_size:
                        last_shown_pct = p_int
                        progress_callback(progress)

    print(f"Downloaded {downloaded / (1024 * 1024):.1f} MB", file=sys.stderr)


def begin_update_session(client: httpx.Client, base_url: str) -> str:
    """Start an update session and return the token. Retries on 502 (Bad Gateway)."""
    # update-server/otupdate/common/update.py — begin(); app __fixtures__ mockUpdateBeginSuccess (201, body.token)
    print("Starting update session...", file=sys.stderr)
    last_err = None
    for attempt in range(NETWORK_502_RETRIES):
        try:
            resp = client.post(f"{base_url}/server/update/begin")
        except httpx.TransportError as exc:
            if attempt < NETWORK_502_RETRIES - 1:
                print(
                    f"  Connection error ({type(exc).__name__}: {exc}) "
                    f"(attempt {attempt + 1}/{NETWORK_502_RETRIES}), "
                    f"retrying in {NETWORK_502_RETRY_DELAY_S}s...",
                    file=sys.stderr,
                )
                time.sleep(NETWORK_502_RETRY_DELAY_S)
                continue
            raise
        if resp.status_code == 502 and attempt < NETWORK_502_RETRIES - 1:
            print(
                f"  HTTP 502 Bad Gateway (attempt {attempt + 1}/{NETWORK_502_RETRIES}), "
                f"retrying in {NETWORK_502_RETRY_DELAY_S}s...",
                file=sys.stderr,
            )
            time.sleep(NETWORK_502_RETRY_DELAY_S)
            last_err = resp
            continue
        resp.raise_for_status()
        data = resp.json()
        token = data.get("token")
        if not token:
            raise ValueError("No token in response")
        print(f"Update session started: {token}", file=sys.stderr)
        return token
    if last_err is not None:
        last_err.raise_for_status()
    raise ValueError("No token in response")


def cancel_update_session(client: httpx.Client, base_url: str) -> None:
    """Cancel any active update session (useful when begin returns 409)."""
    # update-server/otupdate/common/update.py — cancel(); app __fixtures__ mockUpdateCancelSuccess (200)
    print("Cancelling existing update session...", file=sys.stderr)
    resp = client.post(f"{base_url}/server/update/cancel")
    resp.raise_for_status()
    print("Session cancelled", file=sys.stderr)


def get_update_status(client: httpx.Client, base_url: str, token: str) -> dict:
    """Get current update session status."""
    # update-server/otupdate/common/update.py — status(); session.state in otupdate/common/session.py
    # app __fixtures__ mockStatusSuccess (stage, message, progress)
    resp = client.get(f"{base_url}/server/update/{token}/status")
    resp.raise_for_status()
    return resp.json()


def wait_for_awaiting_file(
    client: httpx.Client, base_url: str, token: str, timeout: float = 300
) -> None:
    """Poll status until session is awaiting file upload."""
    # Stage strings from update-server/otupdate/common/session.py — Stages.AWAITING_FILE.value.short, ERROR
    print("Waiting for session to be ready for file upload...", file=sys.stderr)
    start_time = time.time()
    while time.time() - start_time < timeout:
        status = get_update_status(client, base_url, token)
        stage_value = status.get("stage", "")

        if stage_value == "awaiting-file":
            print("Session ready for file upload", file=sys.stderr)
            return

        if stage_value == "error":
            raise RuntimeError(
                f"Update session failed: {status.get('error', 'unknown error')}"
            )

        time.sleep(2)

    raise TimeoutError("Timeout waiting for session to be ready")


# update-server/otupdate/common/session.py — Stages enum (.value.short used in API responses)
STAGE_LABELS = {
    "awaiting-file": "Awaiting file upload",
    "validating": "Validating file (signature + hash check)",
    "writing": "Writing to disk",
    "done": "Write complete",
    "ready-for-restart": "Ready to commit",
    "error": "Error",
}


def upload_system_file(
    client: httpx.Client,
    base_url: str,
    token: str,
    file_path: Path,
    robot_model: str,
    progress_callback=None,
) -> dict:
    """Upload system file to update session. Returns session state from response."""
    # update-server/otupdate/common/update.py — file_upload(); VALID_UPDATE_PKG from update_actions (OE: system-update.zip, BR: ot2-system.zip)
    if robot_model == "OT-3 Standard":
        field_name = "system-update.zip"
    else:
        field_name = "ot2-system.zip"

    file_size = file_path.stat().st_size
    print(
        f"Uploading {file_path.name} ({file_size / (1024 * 1024):.1f} MB)...",
        file=sys.stderr,
    )

    last_resp = None
    for attempt in range(NETWORK_502_RETRIES):
        try:
            with open(file_path, "rb") as f:
                files = {field_name: (file_path.name, f, "application/zip")}
                resp = client.post(
                    f"{base_url}/server/update/{token}/file",
                    files=files,
                )
        except httpx.TransportError as exc:
            if attempt < NETWORK_502_RETRIES - 1:
                print(
                    f"Connection error during upload ({type(exc).__name__}: {exc}) "
                    f"(attempt {attempt + 1}/{NETWORK_502_RETRIES}), "
                    f"retrying in {NETWORK_502_RETRY_DELAY_S}s...",
                    file=sys.stderr,
                )
                time.sleep(NETWORK_502_RETRY_DELAY_S)
                continue
            raise
        last_resp = resp
        if resp.status_code == 502 and attempt < NETWORK_502_RETRIES - 1:
            print(
                f"HTTP 502: Bad Gateway (attempt {attempt + 1}/{NETWORK_502_RETRIES}), "
                f"retrying in {NETWORK_502_RETRY_DELAY_S}s...",
                file=sys.stderr,
            )
            time.sleep(NETWORK_502_RETRY_DELAY_S)
            continue
        resp.raise_for_status()
        break
    else:
        if last_resp is not None:
            last_resp.raise_for_status()
        raise httpx.TransportError("All upload attempts failed with connection errors")

    session_state = last_resp.json()
    stage = session_state.get("stage", "unknown")
    label = STAGE_LABELS.get(stage, stage)
    message = session_state.get("message", "")
    print(f"✅ File received by robot — stage: {label}", file=sys.stderr)
    if message:
        print(f"   Message: {message}", file=sys.stderr)

    return session_state


def wait_for_done(
    client: httpx.Client, base_url: str, token: str, timeout: float = 600
) -> None:
    """Poll status until update is done, printing every stage transition."""
    # session.py Stages: validating → writing → done; app epic.ts statusPollEpic polls until ready-for-restart
    print("Polling update status...", file=sys.stderr)
    start_time = time.time()
    last_stage = None
    last_progress = None

    while time.time() - start_time < timeout:
        status = get_update_status(client, base_url, token)
        stage = status.get("stage", "")
        progress = status.get("progress", 0)
        message = status.get("message", "")

        # Print whenever stage changes
        if stage != last_stage:
            label = STAGE_LABELS.get(stage, stage)
            elapsed = time.time() - start_time
            line = f"  [{elapsed:5.1f}s]  Stage → {label}"
            if message:
                line += f"  ({message})"
            print(line, file=sys.stderr)
            last_stage = stage

        # Print progress updates
        if progress != last_progress and progress > 0:
            print(f"           Progress: {progress:.1f}%", file=sys.stderr)
            last_progress = progress

        if stage == "done":
            print("✅ Update written — ready to commit", file=sys.stderr)
            return

        if stage == "error":
            error_code = status.get("error", "unknown")
            raise RuntimeError(
                f"Update failed at {last_stage or 'unknown'} stage\n"
                f"  Error:   {error_code}\n"
                f"  Message: {message}"
            )

        time.sleep(3)

    raise TimeoutError("Timeout waiting for update to complete")


def commit_update(client: httpx.Client, base_url: str, token: str) -> None:
    """Commit the update (stage → ready-for-restart), then trigger robot restart."""
    # update-server/otupdate/common/update.py — commit(); otupdate/common/control.py — restart
    # app __fixtures__ mockCommitSuccess; epic.ts commitUpdateEpic
    print("Committing update...", file=sys.stderr)
    resp = client.post(f"{base_url}/server/update/{token}/commit")
    resp.raise_for_status()
    state = resp.json()
    stage = state.get("stage", "")
    message = state.get("message", "")
    print(f"Commit response — stage: {stage}  message: {message}", file=sys.stderr)

    if stage == "error":
        raise RuntimeError(
            f"Commit failed: {state.get('error', 'unknown')} — {message}"
        )

    # Trigger the actual restart now that the update is committed
    print("Triggering robot restart...", file=sys.stderr)
    try:
        restart_resp = client.post(f"{base_url}/server/restart")
        restart_resp.raise_for_status()
    except (httpx.RemoteProtocolError, httpx.ReadError):
        # Robot may close the connection immediately on restart — that's fine
        pass
    print("✅ Robot is restarting. Update complete.", file=sys.stderr)


def _usb_ready_summary(port_path: str, timeout: float, health_body: bytes) -> str:
    """After /health succeeded, GET /runs, /instruments or /pipettes, /modules and return a one-line summary."""
    parts = []
    try:
        health = json.loads(health_body.decode("utf-8"))
        robot_model = health.get("robot_model", "")
    except (json.JSONDecodeError, KeyError):
        robot_model = ""
    # Runs
    try:
        status, raw = _serial_get(port_path, "/runs", timeout=timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            n = data.get("meta", {}).get("totalLength") or len(data.get("data", []))
            parts.append(f"Runs: {n}")
        else:
            parts.append("Runs: ?")
    except Exception:
        parts.append("Runs: ?")
    # Instruments (OT-3/Flex) or Pipettes (OT-2)
    try:
        path = "/instruments" if "OT-3" in robot_model else "/pipettes"
        status, raw = _serial_get(port_path, path, timeout=timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            if isinstance(data.get("data"), list):
                n = len(data["data"])
            elif isinstance(data, dict) and "data" not in data:
                # OT-2 /pipettes returns PipettesByMount: { "left": {...}, "right": {...} }
                n = sum(1 for v in data.values() if isinstance(v, dict) and (v.get("model") or v.get("name")))
            else:
                n = 0
            label = "Instruments" if "OT-3" in robot_model else "Pipettes"
            parts.append(f"{label}: {n}")
        else:
            parts.append("Instruments: ?" if "OT-3" in robot_model else "Pipettes: ?")
    except Exception:
        parts.append("Instruments: ?" if "OT-3" in robot_model else "Pipettes: ?")
    # Modules
    try:
        status, raw = _serial_get(port_path, "/modules", timeout=timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            n = len(data.get("data", []) if isinstance(data.get("data"), list) else [])
            parts.append(f"Modules: {n}")
        else:
            parts.append("Modules: ?")
    except Exception:
        parts.append("Modules: ?")
    return " | ".join(parts)


def _format_last_runs(runs: List[dict]) -> List[str]:
    """Format last 4 runs for final summary: protocolId, startedAt, completedAt, labwareOffsets (per docs.opentrons.com/runs). API returns oldest-first so we take last 4 and show newest first."""
    lines = ["  Last 4 runs:"]
    last_four = list(runs)[-4:] if len(runs) > 4 else list(runs)
    last_four.reverse()  # newest first
    for i, run in enumerate(last_four, 1):
        protocol_id = run.get("protocolId") or "-"
        started = run.get("startedAt")
        started_str = str(started)[:19] if started else "-"
        completed = run.get("completedAt")
        completed_str = str(completed)[:19] if completed else "-"
        offsets = run.get("labwareOffsets")
        n_offsets = len(offsets) if isinstance(offsets, list) else 0
        lines.append(
            f"    [{i}] protocolId: {protocol_id}  startedAt: {started_str}  completedAt: {completed_str}  labwareOffsets: {n_offsets}"
        )
    return lines


# Column widths for state tables (shared USB + network)
_STATE_TABLE_W = {"id": 12, "protocol": 24, "started": 20, "completed": 20, "lpc": 6, "mount": 8, "serial": 18}
# GET /runs?pageLength=… — large enough for a full summary table (newest-first slice is client-side)
STATE_SNAPSHOT_RUNS_PAGE_LENGTH = 100


def _health_version_and_model_or_fallback(
    client: httpx.Client,
    base_url: str,
    request_timeout: Optional[float],
    fallback_version: str,
    fallback_robot_model: str,
) -> Tuple[str, str]:
    """Prefer live /health for api_version and robot_model; on failure use fallbacks."""
    try:
        h = get_robot_health(client, base_url, request_timeout)
        sw = str(h.get("api_version") or h.get("api_Version") or fallback_version)
        rm = str(h.get("robot_model") or fallback_robot_model)
        return sw, rm
    except RuntimeError:
        return fallback_version, fallback_robot_model


def _try_print_network_state_on_failure(
    ip: str,
    port: int,
    timeout: float,
    robot_model: str,
    title: str,
    software_version: str,
) -> None:
    """Best-effort full state table after an error (single fetch, no stable wait)."""
    base_url = f"http://{ip}:{port}"
    print("\n  ─── State snapshot after error ───", file=sys.stderr)
    try:
        with httpx.Client(
            headers={"Opentrons-Version": "*"},
            timeout=timeout,
        ) as client:
            got = _fetch_state_network_once(client, base_url, timeout, robot_model)
            if got is None:
                print("  (Could not fetch state — robot may be unreachable.)", file=sys.stderr)
                return
            runs, pipettes_rows, modules_serials, _, _ = got
            _format_state_tables(
                runs,
                pipettes_rows,
                modules_serials,
                title,
                software_version=software_version,
            )
    except Exception as exc:
        print("  (Could not print state snapshot: {})".format(exc), file=sys.stderr)


def _try_print_usb_state_on_failure(
    port_path: str,
    timeout: float,
    robot_model: str,
    title: str,
    software_version: str,
) -> None:
    print("\n  ─── State snapshot after error ───", file=sys.stderr)
    try:
        got = _fetch_state_usb_once(port_path, timeout, robot_model)
        if got is None:
            print("  (Could not fetch state over USB.)", file=sys.stderr)
            return
        runs, pipettes_rows, modules_serials, _, _ = got
        _format_state_tables(
            runs,
            pipettes_rows,
            modules_serials,
            title,
            software_version=software_version,
        )
    except Exception as exc:
        print("  (Could not print state snapshot: {})".format(exc), file=sys.stderr)


def _format_state_tables(
    runs: List[dict],
    pipettes_rows: List[Tuple[str, str]],
    modules_serials: List[str],
    title: str,
    header_lines: Optional[List[str]] = None,
    software_version: Optional[str] = None,
) -> None:
    """Print runs (with LPC counts), pipettes (mount, serial), modules (serial) in aligned tables.
    Shared by USB and network paths so output format is identical."""
    w = _STATE_TABLE_W
    if header_lines:
        for line in header_lines:
            print("  " + line, file=sys.stderr)
        print("", file=sys.stderr)
    print("  ─── " + title + " ───", file=sys.stderr)
    if software_version is not None:
        print("  Software version: " + str(software_version), file=sys.stderr)
        print("", file=sys.stderr)

    # Runs (full list from snapshot, newest first)
    runs_display = list(runs)
    runs_display.reverse()
    print(
        "  Runs ({} total, newest first):".format(len(runs_display)),
        file=sys.stderr,
    )
    h = ("id", "protocolId", "startedAt", "completedAt", "LPCs")
    print("    " + h[0].ljust(w["id"]) + h[1].ljust(w["protocol"]) + h[2].ljust(w["started"]) + h[3].ljust(w["completed"]) + h[4].ljust(w["lpc"]), file=sys.stderr)
    print("    " + "-" * (w["id"] + w["protocol"] + w["started"] + w["completed"] + w["lpc"]), file=sys.stderr)
    for run in runs_display:
        rid = (run.get("id") or "?")[: w["id"] - 1]
        pid = (run.get("protocolId") or "-")[: w["protocol"] - 1]
        started = run.get("startedAt")
        s = (str(started)[:19] if started else "-")[: w["started"] - 1]
        completed = run.get("completedAt")
        c = (str(completed)[:19] if completed else "-")[: w["completed"] - 1]
        offsets = run.get("labwareOffsets")
        n_lpc = len(offsets) if isinstance(offsets, list) else 0
        print("    " + rid.ljust(w["id"]) + pid.ljust(w["protocol"]) + s.ljust(w["started"]) + c.ljust(w["completed"]) + str(n_lpc).ljust(w["lpc"]), file=sys.stderr)

    print("", file=sys.stderr)
    print("  Pipettes (serial numbers):", file=sys.stderr)
    print("    " + "mount".ljust(w["mount"]) + "serial", file=sys.stderr)
    print("    " + "-" * (w["mount"] + w["serial"]), file=sys.stderr)
    for mount, serial in pipettes_rows:
        print("    " + mount.ljust(w["mount"]) + (serial[: w["serial"] - 1] if len(serial) > w["serial"] else serial), file=sys.stderr)
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


def _instruments_payload_looks_good(data: dict, robot_model: str) -> bool:
    """True if /instruments or /pipettes JSON has no placeholder serials for attached tools.

    Flex (primary): `data` is a list of AttachedItem. Items with ok=False (BadPipette/BadGripper) may omit
    serialNumber. Items with ok=True need serialNumber (or id). Empty list means no tools — OK.
    Non-Flex /pipettes: PipettesByMount; for each mount with model/name, id must be present.
    """
    if "OT-3" in robot_model:
        items = data.get("data")
        if not isinstance(items, list):
            return False
        if len(items) == 0:
            return True
        for item in items:
            if not isinstance(item, dict):
                return False
            if item.get("ok") is False:
                continue
            sn = item.get("serialNumber") or item.get("id")
            if sn is None or str(sn).strip() in ("", "?"):
                return False
        return True
    for mount in ("left", "right"):
        v = data.get(mount)
        if isinstance(v, dict) and (v.get("model") or v.get("name")):
            pid = v.get("id") or v.get("name")
            if pid is None or str(pid).strip() in ("", "?"):
                return False
    return True


def _modules_payload_looks_good(data: dict) -> bool:
    """Each module in data.data must have serialNumber or id when list is non-empty."""
    mods = data.get("data", []) if isinstance(data.get("data"), list) else []
    for m in mods:
        if not isinstance(m, dict):
            return False
        s = m.get("serialNumber") or m.get("id")
        if s is None or str(s).strip() in ("", "?"):
            return False
    return True


def _state_snapshot_looks_good(
    instruments_json: dict,
    modules_json: dict,
    robot_model: str,
) -> bool:
    return _instruments_payload_looks_good(instruments_json, robot_model) and _modules_payload_looks_good(
        modules_json
    )


def _snapshot_identity_fingerprint(
    pipettes_rows: List[Tuple[str, str]],
    modules_serials: List[str],
) -> Tuple[Tuple[Tuple[str, str], ...], Tuple[str, ...]]:
    """Stable identity for two consecutive snapshots (runs excluded — can change independently)."""
    return (tuple(pipettes_rows), tuple(str(s) for s in modules_serials))


STATE_FETCH_RETRIES = 8
STATE_FETCH_RETRY_DELAY_S = 5


def _get_json_or_none(
    client: httpx.Client,
    url: str,
    timeout: Optional[float],
    label: str,
    verbose: bool = False,
) -> Optional[dict]:
    """GET an endpoint with retries. Returns parsed JSON on 200, None on persistent failure.

    Retries on 502 (nginx Bad Gateway — upstream robot-server not ready) and 503.
    When verbose is False, do not print per-attempt lines (used for /health during startup).
    """
    for attempt in range(STATE_FETCH_RETRIES):
        try:
            resp = client.get(url, timeout=timeout)
            if resp.status_code == 200:
                return resp.json()
            if resp.status_code in (502, 503) and attempt < STATE_FETCH_RETRIES - 1:
                if verbose:
                    print(
                        f"  {label}: HTTP {resp.status_code} (nginx/upstream not ready), "
                        f"retrying in {STATE_FETCH_RETRY_DELAY_S}s "
                        f"({attempt + 1}/{STATE_FETCH_RETRIES})...",
                        file=sys.stderr,
                    )
                time.sleep(STATE_FETCH_RETRY_DELAY_S)
                continue
            if verbose:
                print(f"  {label}: HTTP {resp.status_code} (non-200, skipping)", file=sys.stderr)
            return None
        except httpx.TransportError as exc:
            if attempt < STATE_FETCH_RETRIES - 1:
                if verbose:
                    print(
                        f"  {label}: {type(exc).__name__} — "
                        f"retrying in {STATE_FETCH_RETRY_DELAY_S}s "
                        f"({attempt + 1}/{STATE_FETCH_RETRIES})...",
                        file=sys.stderr,
                    )
                time.sleep(STATE_FETCH_RETRY_DELAY_S)
                continue
            if verbose:
                print(
                    f"  {label}: {type(exc).__name__} after {STATE_FETCH_RETRIES} attempts (skipping)",
                    file=sys.stderr,
                )
            return None
    return None


def _fetch_state_network_once(
    client: httpx.Client,
    base_url: str,
    timeout: float,
    robot_model: str,
    runs_page_length: int = STATE_SNAPSHOT_RUNS_PAGE_LENGTH,
) -> Optional[Tuple[List[dict], List[Tuple[str, str]], List[str], dict, dict]]:
    """Single GET per route (no inner retry). Returns None if any route is not HTTP 200 or JSON invalid."""
    try:
        resp = client.get(
            f"{base_url}/runs?pageLength={runs_page_length}",
            timeout=timeout,
        )
        if resp.status_code != 200:
            return None
        runs_json = resp.json()
    except (httpx.TransportError, json.JSONDecodeError, ValueError):
        return None
    runs = (runs_json.get("data") or []) or []

    path = "/instruments" if "OT-3" in robot_model else "/pipettes"
    try:
        resp = client.get(f"{base_url}{path}", timeout=timeout)
        if resp.status_code != 200:
            return None
        inst_json = resp.json()
    except (httpx.TransportError, json.JSONDecodeError, ValueError):
        return None

    pipettes_rows: List[Tuple[str, str]] = []
    if isinstance(inst_json.get("data"), list):
        for item in inst_json["data"]:
            pipettes_rows.append(
                (str(item.get("mount", "")), str(item.get("serialNumber", item.get("id", "?"))))
            )
    else:
        for mount in ("left", "right"):
            v = inst_json.get(mount)
            if isinstance(v, dict) and (v.get("model") or v.get("id")):
                pipettes_rows.append((mount, str(v.get("id", v.get("name", "?") or "?"))))

    try:
        resp = client.get(f"{base_url}/modules", timeout=timeout)
        if resp.status_code != 200:
            return None
        mod_json = resp.json()
    except (httpx.TransportError, json.JSONDecodeError, ValueError):
        return None
    mods = mod_json.get("data", []) if isinstance(mod_json.get("data"), list) else []
    modules_serials = [m.get("serialNumber", m.get("id", "?")) for m in mods]

    return runs, pipettes_rows, modules_serials, inst_json, mod_json


def wait_for_stable_robot_state_network(
    client: httpx.Client,
    base_url: str,
    per_request_timeout: float,
    robot_model: str,
    overall_timeout: float = STABLE_STATE_TIMEOUT_S,
    nag_after_s: float = STABLE_STATE_NAG_AFTER_S,
    poll_interval_s: float = STABLE_STATE_POLL_INTERVAL_S,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Flex (OT-3) only: poll until HTTP 200 on state routes, populated serials, and two consecutive matching snapshots."""
    print(
        "Waiting for a stable Flex snapshot (GET /runs, /instruments, /modules — HTTP 200, complete serials, "
        "two matching polls)...",
        file=sys.stderr,
    )
    start = time.time()
    nag_printed = False
    last_progress_log = 0.0
    prev_fingerprint: Optional[Tuple[Tuple[Tuple[str, str], ...], Tuple[str, ...]]] = None
    while time.time() - start < overall_timeout:
        elapsed = time.time() - start
        if not nag_printed and elapsed >= nag_after_s:
            print(
                "Still waiting for a complete instrument/module snapshot. If this continues, check the robot "
                "(power, doors, pipettes seated, USB/network).",
                file=sys.stderr,
            )
            nag_printed = True
        if elapsed - last_progress_log >= 60.0:
            print(
                f"  … still waiting for stable state ({elapsed:.0f}s / {overall_timeout:.0f}s)",
                file=sys.stderr,
            )
            last_progress_log = elapsed

        got = _fetch_state_network_once(client, base_url, per_request_timeout, robot_model)
        if got is None:
            time.sleep(poll_interval_s)
            continue
        runs, pipettes_rows, modules_serials, inst_json, mod_json = got
        if not _state_snapshot_looks_good(inst_json, mod_json, robot_model):
            time.sleep(poll_interval_s)
            continue
        fp = _snapshot_identity_fingerprint(pipettes_rows, modules_serials)
        if prev_fingerprint is not None and fp == prev_fingerprint:
            print("Stable snapshot ready (two consecutive matching instrument/module identity sets).", file=sys.stderr)
            return runs, pipettes_rows, modules_serials
        prev_fingerprint = fp
        time.sleep(poll_interval_s)

    raise TimeoutError(
        f"Stable Flex state snapshot not obtained within {overall_timeout:.0f}s "
        "(need HTTP 200 on /runs, /instruments|/pipettes, /modules; non-placeholder serials; two matching polls)."
    )


def wait_for_populated_state_network_ot2(
    client: httpx.Client,
    base_url: str,
    per_request_timeout: float,
    robot_model: str,
    overall_timeout: float,
    poll_interval_s: float,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Non-Flex: poll until one snapshot has HTTP 200 everywhere and populated serials (no two-poll stability)."""
    print(
        "Waiting for robot state (GET /runs, /pipettes, /modules — HTTP 200, complete serials)...",
        file=sys.stderr,
    )
    start = time.time()
    last_progress_log = 0.0
    while time.time() - start < overall_timeout:
        elapsed = time.time() - start
        if elapsed - last_progress_log >= 60.0:
            print(
                f"  … still waiting ({elapsed:.0f}s / {overall_timeout:.0f}s)",
                file=sys.stderr,
            )
            last_progress_log = elapsed
        got = _fetch_state_network_once(client, base_url, per_request_timeout, robot_model)
        if got is None:
            time.sleep(poll_interval_s)
            continue
        runs, pipettes_rows, modules_serials, inst_json, mod_json = got
        if not _state_snapshot_looks_good(inst_json, mod_json, robot_model):
            time.sleep(poll_interval_s)
            continue
        print("Robot state snapshot ready.", file=sys.stderr)
        return runs, pipettes_rows, modules_serials

    raise TimeoutError(
        f"Robot state snapshot not obtained within {overall_timeout:.0f}s "
        "(need HTTP 200 on /runs, /pipettes, /modules with non-placeholder serials)."
    )


def wait_for_robot_state_after_restart_network(
    client: httpx.Client,
    base_url: str,
    per_request_timeout: float,
    robot_model: str,
    *,
    flex_stable_timeout: float,
    flex_nag_after: float,
    flex_poll_interval: float,
    ot2_overall_timeout: float,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Default path is Flex: stable two-poll wait + optional nag. Non-Flex uses ot2_overall_timeout for a simpler wait."""
    if _is_flex_robot(robot_model):
        return wait_for_stable_robot_state_network(
            client,
            base_url,
            per_request_timeout,
            robot_model,
            overall_timeout=flex_stable_timeout,
            nag_after_s=flex_nag_after,
            poll_interval_s=flex_poll_interval,
        )
    return wait_for_populated_state_network_ot2(
        client,
        base_url,
        per_request_timeout,
        robot_model,
        overall_timeout=ot2_overall_timeout,
        poll_interval_s=flex_poll_interval,
    )


def _fetch_usb_health_calibration(port_path: str, timeout: float) -> Tuple[str, str]:
    """GET /health and /calibration/status over USB for summary headers."""
    api_ver, calibration = "?", "?"
    try:
        status, raw = _serial_get(port_path, "/health", timeout=timeout)
        if status == 200:
            health = json.loads(raw.decode("utf-8"))
            api_ver = health.get("api_version") or health.get("api_Version", "?")
    except Exception:
        pass
    try:
        status, raw = _serial_get(port_path, "/calibration/status", timeout=timeout)
        if status == 200:
            calibration = str((json.loads(raw.decode("utf-8")).get("deckCalibration") or {}).get("status", "?"))
    except Exception:
        pass
    return api_ver, calibration


def _fetch_state_usb_once(
    port_path: str,
    timeout: float,
    robot_model: str,
    runs_page_length: int = STATE_SNAPSHOT_RUNS_PAGE_LENGTH,
) -> Optional[Tuple[List[dict], List[Tuple[str, str]], List[str], dict, dict]]:
    """Single pass over USB for runs + instruments|pipettes + modules. None if any GET is not 200."""
    try:
        status, raw = _serial_get(
            port_path,
            "/runs?pageLength={}".format(runs_page_length),
            timeout=timeout,
        )
        if status != 200:
            return None
        runs = (json.loads(raw.decode("utf-8")).get("data") or []) or []
    except Exception:
        return None
    path = "/instruments" if "OT-3" in robot_model else "/pipettes"
    try:
        status, raw = _serial_get(port_path, path, timeout=timeout)
        if status != 200:
            return None
        inst_json = json.loads(raw.decode("utf-8"))
    except Exception:
        return None
    pipettes_rows: List[Tuple[str, str]] = []
    if isinstance(inst_json.get("data"), list):
        for item in inst_json["data"]:
            pipettes_rows.append(
                (str(item.get("mount", "")), str(item.get("serialNumber", item.get("id", "?"))))
            )
    else:
        for mount in ("left", "right"):
            v = inst_json.get(mount)
            if isinstance(v, dict) and (v.get("model") or v.get("id")):
                pipettes_rows.append((mount, str(v.get("id", v.get("name", "?") or "?"))))
    try:
        status, raw = _serial_get(port_path, "/modules", timeout=timeout)
        if status != 200:
            return None
        mod_json = json.loads(raw.decode("utf-8"))
    except Exception:
        return None
    mods = mod_json.get("data", []) if isinstance(mod_json.get("data"), list) else []
    modules_serials = [m.get("serialNumber", m.get("id", "?")) for m in mods]
    return runs, pipettes_rows, modules_serials, inst_json, mod_json


def wait_for_stable_robot_state_usb(
    port_path: str,
    per_request_timeout: float,
    robot_model: str,
    overall_timeout: float = STABLE_STATE_TIMEOUT_S,
    nag_after_s: float = STABLE_STATE_NAG_AFTER_S,
    poll_interval_s: float = STABLE_STATE_POLL_INTERVAL_S,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Flex only: same policy as network — stable snapshot over USB serial HTTP."""
    print(
        "Waiting for a stable Flex snapshot over USB (/runs, /instruments, /modules — complete serials, two matching polls)...",
        file=sys.stderr,
    )
    start = time.time()
    nag_printed = False
    last_progress_log = 0.0
    prev_fingerprint: Optional[Tuple[Tuple[Tuple[str, str], ...], Tuple[str, ...]]] = None
    while time.time() - start < overall_timeout:
        elapsed = time.time() - start
        if not nag_printed and elapsed >= nag_after_s:
            print(
                "Still waiting for a complete instrument/module snapshot. If this continues, check the robot "
                "(power, doors, pipettes seated, USB cable).",
                file=sys.stderr,
            )
            nag_printed = True
        if elapsed - last_progress_log >= 60.0:
            print(
                f"  … still waiting for stable state ({elapsed:.0f}s / {overall_timeout:.0f}s)",
                file=sys.stderr,
            )
            last_progress_log = elapsed

        got = _fetch_state_usb_once(port_path, per_request_timeout, robot_model)
        if got is None:
            time.sleep(poll_interval_s)
            continue
        runs, pipettes_rows, modules_serials, inst_json, mod_json = got
        if not _state_snapshot_looks_good(inst_json, mod_json, robot_model):
            time.sleep(poll_interval_s)
            continue
        fp = _snapshot_identity_fingerprint(pipettes_rows, modules_serials)
        if prev_fingerprint is not None and fp == prev_fingerprint:
            print("Stable snapshot ready (two consecutive matching instrument/module identity sets).", file=sys.stderr)
            return runs, pipettes_rows, modules_serials
        prev_fingerprint = fp
        time.sleep(poll_interval_s)

    raise TimeoutError(
        f"Stable Flex state snapshot not obtained within {overall_timeout:.0f}s over USB "
        "(need HTTP 200 on state routes; non-placeholder serials; two matching polls)."
    )


def wait_for_populated_state_usb_ot2(
    port_path: str,
    per_request_timeout: float,
    robot_model: str,
    overall_timeout: float,
    poll_interval_s: float,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Non-Flex over USB: one good snapshot without Flex two-poll stability."""
    print(
        "Waiting for robot state over USB (/runs, /pipettes, /modules — HTTP 200, complete serials)...",
        file=sys.stderr,
    )
    start = time.time()
    last_progress_log = 0.0
    while time.time() - start < overall_timeout:
        elapsed = time.time() - start
        if elapsed - last_progress_log >= 60.0:
            print(
                f"  … still waiting ({elapsed:.0f}s / {overall_timeout:.0f}s)",
                file=sys.stderr,
            )
            last_progress_log = elapsed
        got = _fetch_state_usb_once(port_path, per_request_timeout, robot_model)
        if got is None:
            time.sleep(poll_interval_s)
            continue
        runs, pipettes_rows, modules_serials, inst_json, mod_json = got
        if not _state_snapshot_looks_good(inst_json, mod_json, robot_model):
            time.sleep(poll_interval_s)
            continue
        print("Robot state snapshot ready.", file=sys.stderr)
        return runs, pipettes_rows, modules_serials

    raise TimeoutError(
        f"Robot state snapshot not obtained within {overall_timeout:.0f}s over USB "
        "(need HTTP 200 on state routes with non-placeholder serials)."
    )


def wait_for_robot_state_after_restart_usb(
    port_path: str,
    per_request_timeout: float,
    robot_model: str,
    *,
    flex_stable_timeout: float,
    flex_nag_after: float,
    flex_poll_interval: float,
    ot2_overall_timeout: float,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    if _is_flex_robot(robot_model):
        return wait_for_stable_robot_state_usb(
            port_path,
            per_request_timeout,
            robot_model,
            overall_timeout=flex_stable_timeout,
            nag_after_s=flex_nag_after,
            poll_interval_s=flex_poll_interval,
        )
    return wait_for_populated_state_usb_ot2(
        port_path,
        per_request_timeout,
        robot_model,
        overall_timeout=ot2_overall_timeout,
        poll_interval_s=flex_poll_interval,
    )


def _usb_final_summary(
    port_path: str,
    timeout: float,
    file_uploaded: Path,
    robot_model: str,
    stable_timeout: float,
    stable_nag_after: float,
    stable_poll_interval: float,
    ot2_state_timeout: float,
    fallback_software_version: str,
) -> None:
    """Print final state over USB using unified state tables (same format as network)."""
    runs, pipettes_rows, modules_serials = wait_for_robot_state_after_restart_usb(
        port_path,
        timeout,
        robot_model,
        flex_stable_timeout=stable_timeout,
        flex_nag_after=stable_nag_after,
        flex_poll_interval=stable_poll_interval,
        ot2_overall_timeout=ot2_state_timeout,
    )
    api_ver, calibration = _fetch_usb_health_calibration(port_path, timeout)
    sw = api_ver if api_ver != "?" else fallback_software_version
    header_lines = [
        "File uploaded:     " + file_uploaded.name,
        "Calibration:       " + calibration,
    ]
    _format_state_tables(
        runs,
        pipettes_rows,
        modules_serials,
        "Final state",
        header_lines=header_lines,
        software_version=sw,
    )


def wait_for_robot_ready_usb(
    timeout: float = 300, interval: float = 10
) -> None:
    """After USB restart, poll /health over serial until robot responds. Robot disconnects during restart, so we reopen the port each poll. Then GET runs/instruments|pipettes/modules and print a short summary."""
    print("Waiting for robot to come back online (polling /health over USB)...", file=sys.stderr)
    start = time.time()
    while time.time() - start < timeout:
        time.sleep(interval)
        port_path = _find_opentrons_usb_port()
        if not port_path:
            continue
        try:
            status, body = _serial_get(port_path, "/health", timeout=15)
            if status == 200:
                print("Robot is ready.", file=sys.stderr)
                summary = _usb_ready_summary(port_path, 15, body)
                print("  " + summary, file=sys.stderr)
                return
        except Exception:
            pass
    raise TimeoutError(
        f"Robot did not become reachable within {timeout:.0f}s after restart"
    )


def wait_for_robot_ready(
    client: httpx.Client, base_url: str, timeout: float = 300, interval: float = 10
) -> None:
    """After restart, poll /health until robot responds (for consecutive updates).
    Over Wi-Fi the server goes off during restart so the connection is lost until
    the robot comes back on the network; over USB the link is maintained."""
    # Same GET /health as get_robot_health — robot-server health endpoint
    print("Waiting for robot to come back online...", file=sys.stderr)
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = client.get(f"{base_url}/health")
            if resp.status_code == 200:
                print("Robot is ready.", file=sys.stderr)
                return
        except httpx.TransportError:
            pass
        time.sleep(interval)
    raise TimeoutError(
        f"Robot did not become reachable within {timeout:.0f}s after restart"
    )


def wait_for_update_server_ready(
    client: httpx.Client,
    base_url: str,
    timeout: float = NETWORK_UPDATE_SERVER_READY_TIMEOUT_S,
    interval: float = 5,
) -> None:
    """After /health is up, poll GET /server/update/health until 200 so the update API is ready.
    Avoids starting the next update (begin/upload) while nginx or update-server is still coming up,
    which can cause HTTP 502 Bad Gateway on large uploads."""
    # update-server exposes /server/update/health — SKILL.md, update-server/otupdate/*/__init__.py
    print("Waiting for update server to be ready...", file=sys.stderr)
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = client.get(f"{base_url}/server/update/health")
            if resp.status_code == 200:
                print("Update server is ready.", file=sys.stderr)
                return
        except httpx.TransportError:
            pass
        time.sleep(interval)
    raise TimeoutError(
        f"Update server did not become ready within {timeout:.0f}s "
        "(GET /server/update/health never returned 200)"
    )


def run_one_update(
    client: httpx.Client,
    base_url: str,
    version: str,
    robot_model: str,
    system_file: Path,
) -> None:
    """Run a single update: begin, upload, wait for done, commit (and restart)."""
    # Same flow as app: app/src/redux/robot-update/epic.ts — createSessionEpic (409→cancel→retry), statusPollEpic, commitUpdateEpic
    try:
        token = begin_update_session(client, base_url)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            cancel_update_session(client, base_url)
            token = begin_update_session(client, base_url)
        else:
            raise

    wait_for_awaiting_file(client, base_url, token)
    upload_system_file(client, base_url, token, system_file, robot_model)
    wait_for_done(client, base_url, token)
    commit_update(client, base_url, token)


def _usb_json(port_path: str, method: str, path: str, timeout: float, body: Optional[bytes] = None) -> dict:
    """Serial request that returns parsed JSON or raises."""
    if body is not None:
        status, raw = _serial_request(port_path, method, path, body=body, content_type="application/json", timeout=timeout)
    else:
        status, raw = _serial_request(port_path, method, path, timeout=timeout)
    if status >= 400:
        raise RuntimeError(f"HTTP {status}: {raw.decode('utf-8', errors='replace')[:500]}")
    return json.loads(raw.decode("utf-8"))


def run_one_update_usb(
    ser,
    version: str,
    robot_model: str,
    system_file: Path,
    timeout: float,
) -> None:
    """Run a single update over an already-open USB serial port (one connection, like the Opentrons app)."""
    field_name = "system-update.zip" if robot_model == "OT-3 Standard" else "ot2-system.zip"
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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Update robot system software from GitHub or local zip, over network or USB."
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
        help="One or more versions to apply in order. Optional when using --file (version is derived from filename, e.g. ot3-system-8.8.1.zip).",
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
        default=300,
        help="Seconds to wait for robot to come back after restart between consecutive updates (default: 300). Over Wi-Fi the connection drops when the robot restarts; over USB the link is maintained.",
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
        help="Opentrons Flex: max seconds to wait for a stable post-restart snapshot (HTTP 200 on /runs, /instruments, "
        "/modules; real serials; two matching polls). Default %(default)s (10 min). Not used on non-Flex robots.",
    )
    parser.add_argument(
        "--stable-state-nag-after",
        type=float,
        default=float(STABLE_STATE_NAG_AFTER_S),
        help="Opentrons Flex: after this many seconds (default %(default)s ≈ 7 min), print one reminder to check the "
        "robot if still waiting. Not used on non-Flex robots.",
    )
    parser.add_argument(
        "--stable-state-poll-interval",
        type=float,
        default=float(STABLE_STATE_POLL_INTERVAL_S),
        help="Seconds between state snapshot polls while waiting (default: %(default)s). Primary use: Flex updates.",
    )
    parser.add_argument(
        "--http-api-ready-timeout",
        type=float,
        default=float(NETWORK_HTTP_API_READY_TIMEOUT_S),
        help="Non-Flex robots only: max seconds for a simpler single state snapshot after restart (default: %(default)s). "
        "On Flex, snapshot timing is controlled by --stable-state-* above.",
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

    if args.usb:
        global _USB_DEBUG
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
                run_one_update_usb(ser, version, robot_model, file_path, args.timeout)
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
                        robot_model,
                        flex_stable_timeout=args.stable_state_timeout,
                        flex_nag_after=args.stable_state_nag_after,
                        flex_poll_interval=args.stable_state_poll_interval,
                        ot2_overall_timeout=args.http_api_ready_timeout,
                    )
                    print("Ready for next update (stable state snapshot OK).", file=sys.stderr)
                    api_ver_bt, _ = _fetch_usb_health_calibration(port_path, args.timeout)
                    sw_bt = api_ver_bt if api_ver_bt != "?" else version
                    _format_state_tables(
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
                        _usb_final_summary(
                            port_path,
                            args.timeout,
                            files[-1],
                            robot_model,
                            args.stable_state_timeout,
                            args.stable_state_nag_after,
                            args.stable_state_poll_interval,
                            args.http_api_ready_timeout,
                            versions[-1],
                        )
            print("\n✅ Update completed successfully!", file=sys.stderr)
            return 0
        except (ValueError, RuntimeError, TimeoutError, json.JSONDecodeError) as e:
            print(f"Error: {e}", file=sys.stderr)
            pp = _find_opentrons_usb_port()
            if pp:
                _try_print_usb_state_on_failure(
                    pp,
                    args.timeout,
                    robot_model,
                    "State after error (best effort)",
                    last_completed_version_usb or "?",
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
                    "Error: could not derive version from every filename. Use ot3-system-X.Y.Z.zip (or ot2-system-X.Y.Z.zip).",
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
                        "Error: could not derive version from filename. Use --version or name file ot3-system-X.Y.Z.zip (or ot2-system-X.Y.Z.zip).",
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
            robot_model = health.get("robot_model", "OT-2 Standard")
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
                        robot_model,
                        flex_stable_timeout=args.stable_state_timeout,
                        flex_nag_after=args.stable_state_nag_after,
                        flex_poll_interval=args.stable_state_poll_interval,
                        ot2_overall_timeout=args.http_api_ready_timeout,
                    )
                    print(
                        "Ready for next update (health, update server, state snapshot OK).",
                        file=sys.stderr,
                    )
                    _sw, robot_model = _health_version_and_model_or_fallback(
                        client,
                        base_url,
                        args.timeout,
                        versions[idx - 1],
                        robot_model,
                    )
                    _format_state_tables(
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
                            robot_model,
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
                    run_one_update(client, base_url, version, robot_model, system_file)
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
                robot_model,
                flex_stable_timeout=args.stable_state_timeout,
                flex_nag_after=args.stable_state_nag_after,
                flex_poll_interval=args.stable_state_poll_interval,
                ot2_overall_timeout=args.http_api_ready_timeout,
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
            file_uploaded_name = (
                f"ot3-system-{last_ver}.zip"
                if "OT-3" in robot_model
                else f"ot2-system-{last_ver}.zip"
            )
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
            _format_state_tables(
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
        _try_print_network_state_on_failure(
            args.ip,
            args.port,
            args.timeout,
            robot_model,
            "State after error (best effort)",
            last_completed_version or "?",
        )
        return 1
    except httpx.ConnectError as e:
        print(f"Connection error: {e}", file=sys.stderr)
        _try_print_network_state_on_failure(
            args.ip,
            args.port,
            args.timeout,
            robot_model,
            "State after error (best effort)",
            last_completed_version or "?",
        )
        return 1
    except httpx.RequestError as e:
        print(f"Request error: {e}", file=sys.stderr)
        _try_print_network_state_on_failure(
            args.ip,
            args.port,
            args.timeout,
            robot_model,
            "State after error (best effort)",
            last_completed_version or "?",
        )
        return 1
    except (ValueError, RuntimeError, TimeoutError) as e:
        print(f"Error: {e}", file=sys.stderr)
        _try_print_network_state_on_failure(
            args.ip,
            args.port,
            args.timeout,
            robot_model,
            "State after error (best effort)",
            last_completed_version or "?",
        )
        return 1


if __name__ == "__main__":
    sys.exit(main())
