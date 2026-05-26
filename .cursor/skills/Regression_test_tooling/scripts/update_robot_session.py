"""Network update-server session: GitHub download, begin/cancel/status, upload, wait_for_done, commit/restart."""

from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Optional

import httpx

from update_robot_errors import STAGE_LABELS, bad_token_response, explain_update_session_lost
from update_robot_verifications import get_robot_health

NETWORK_502_RETRIES = 3
NETWORK_502_RETRY_DELAY_S = 10
UPDATE_STATUS_POLL_TIMEOUT_S = 120.0


def download_system_file(
    version: str, output_path: Path, progress_callback=None
) -> None:
    """Download Flex system update zip from GitHub releases."""
    filename = f"ot3-system-{version}.zip"
    download_url = f"https://github.com/Opentrons/opentrons/releases/download/v{version}/{filename}"

    print(f"Downloading {filename} from GitHub releases...", file=sys.stderr)
    print(f"URL: {download_url}", file=sys.stderr)

    with httpx.stream("GET", download_url, follow_redirects=True) as resp:
        if resp.status_code >= 400:
            resp.read()
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
    print("Cancelling existing update session...", file=sys.stderr)
    resp = client.post(f"{base_url}/server/update/cancel")
    resp.raise_for_status()
    print("Session cancelled", file=sys.stderr)


def get_update_status(
    client: httpx.Client,
    base_url: str,
    token: str,
    request_timeout: Optional[float] = None,
) -> dict:
    """Get current update session status."""
    resp = client.get(
        f"{base_url}/server/update/{token}/status",
        timeout=request_timeout,
    )
    resp.raise_for_status()
    return resp.json()


def wait_for_awaiting_file(
    client: httpx.Client, base_url: str, token: str, timeout: float = 300
) -> None:
    """Poll status until session is awaiting file upload."""
    print("Waiting for session to be ready for file upload...", file=sys.stderr)
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            status = get_update_status(
                client,
                base_url,
                token,
                request_timeout=UPDATE_STATUS_POLL_TIMEOUT_S,
            )
        except httpx.HTTPStatusError as exc:
            if bad_token_response(exc.response):
                explain_update_session_lost(
                    client,
                    base_url,
                    last_stage=None,
                    last_progress=None,
                    get_robot_health=get_robot_health,
                )
                raise RuntimeError(
                    "Update session ended before the robot was ready for file upload."
                ) from exc
            raise
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


def upload_system_file(
    client: httpx.Client,
    base_url: str,
    token: str,
    file_path: Path,
    progress_callback=None,
) -> dict:
    """Upload system file to update session. Returns session state from response."""
    field_name = "system-update.zip"

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
    print("Polling update status...", file=sys.stderr)
    start_time = time.time()
    last_stage = None
    last_progress = None

    def _stage_still_in_flight() -> bool:
        return last_stage is None or last_stage in ("validating", "writing")

    while time.time() - start_time < timeout:
        try:
            status = get_update_status(
                client,
                base_url,
                token,
                request_timeout=UPDATE_STATUS_POLL_TIMEOUT_S,
            )
        except httpx.HTTPStatusError as exc:
            if bad_token_response(exc.response):
                explain_update_session_lost(
                    client,
                    base_url,
                    last_stage=last_stage,
                    last_progress=last_progress,
                    get_robot_health=get_robot_health,
                )
                raise RuntimeError(
                    "Update session ended unexpectedly on the robot (details above)."
                ) from exc
            if exc.response.status_code in (502, 503) and _stage_still_in_flight():
                elapsed = time.time() - start_time
                print(
                    f"  [{elapsed:5.1f}s]  Status HTTP {exc.response.status_code} "
                    f"(Bad Gateway / unavailable); retrying in {NETWORK_502_RETRY_DELAY_S}s…",
                    file=sys.stderr,
                )
                time.sleep(NETWORK_502_RETRY_DELAY_S)
                continue
            raise
        except httpx.RequestError as exc:
            if _stage_still_in_flight():
                elapsed = time.time() - start_time
                print(
                    f"  [{elapsed:5.1f}s]  Status poll: {type(exc).__name__}: {exc} "
                    "(robot may be busy or reconnecting; retrying in 5s…)",
                    file=sys.stderr,
                )
                time.sleep(5)
                continue
            raise

        stage = status.get("stage", "")
        progress = status.get("progress", 0)
        message = status.get("message", "")

        if stage != last_stage:
            label = STAGE_LABELS.get(stage, stage)
            elapsed = time.time() - start_time
            line = f"  [{elapsed:5.1f}s]  Stage → {label}"
            if message:
                line += f"  ({message})"
            print(line, file=sys.stderr)
            last_stage = stage

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

    print("Triggering robot restart...", file=sys.stderr)
    try:
        restart_resp = client.post(f"{base_url}/server/restart")
        restart_resp.raise_for_status()
    except httpx.HTTPStatusError:
        raise
    except httpx.RequestError:
        pass
    print("✅ Robot is restarting. Update complete.", file=sys.stderr)
    print(
        "  (Commit succeeded. The robot may be offline for several minutes while it reboots — "
        "connection errors until /health returns 200 are expected, not proof the update failed.)",
        file=sys.stderr,
    )


def run_one_update(
    client: httpx.Client,
    base_url: str,
    version: str,
    system_file: Path,
) -> None:
    """Run a single update: begin, upload, wait for done, commit (and restart)."""
    try:
        token = begin_update_session(client, base_url)
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            cancel_update_session(client, base_url)
            token = begin_update_session(client, base_url)
        else:
            raise

    wait_for_awaiting_file(client, base_url, token)
    upload_system_file(client, base_url, token, system_file)
    wait_for_done(client, base_url, token)
    commit_update(client, base_url, token)
