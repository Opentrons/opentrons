#!/usr/bin/env python3
"""Update robot system software by downloading from GitHub releases and uploading.

Requires: httpx (pip install httpx)

Usage:
    # Single update (default: Flex port 31960)
    python update_robot.py 10.14.19.233 --version 8.8.1
    # Consecutive updates (applied in order)
    python update_robot.py 10.14.19.233 --version 9.0.0-alpha.11 8.8.1 9.0.0-alpha.11 8.7.1
    # OT-2: use --port 31950
    python update_robot.py 10.14.19.233 --version 8.3.0 --port 31950
"""

import argparse
import json
import sys
import tempfile
import time
from pathlib import Path
from typing import List, Optional

import httpx


def get_robot_health(client: httpx.Client, base_url: str) -> dict:
    """Fetch the full /health payload."""
    # Robot server GET /health — response shape: .cursor/skills/robot-ip-health/SKILL.md (Health Response Fields)
    resp = client.get(f"{base_url}/health")
    resp.raise_for_status()
    return resp.json()


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
    download_url = (
        f"https://github.com/Opentrons/opentrons/releases/download/v{version}/{filename}"
    )

    print(f"Downloading {filename} from GitHub releases...", file=sys.stderr)
    print(f"URL: {download_url}", file=sys.stderr)

    with httpx.stream("GET", download_url, follow_redirects=True) as resp:
        resp.raise_for_status()
        total_size = int(resp.headers.get("content-length", 0))

        with open(output_path, "wb") as f:
            downloaded = 0
            for chunk in resp.iter_bytes(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if progress_callback and total_size > 0:
                    progress = (downloaded / total_size) * 100
                    progress_callback(progress)

    print(f"Downloaded {downloaded / (1024 * 1024):.1f} MB", file=sys.stderr)


def begin_update_session(client: httpx.Client, base_url: str) -> str:
    """Start an update session and return the token."""
    # update-server/otupdate/common/update.py — begin(); app __fixtures__ mockUpdateBeginSuccess (201, body.token)
    print("Starting update session...", file=sys.stderr)
    resp = client.post(f"{base_url}/server/update/begin")
    resp.raise_for_status()
    data = resp.json()
    token = data.get("token")
    if not token:
        raise ValueError("No token in response")
    print(f"Update session started: {token}", file=sys.stderr)
    return token


def cancel_update_session(client: httpx.Client, base_url: str) -> None:
    """Cancel any active update session (useful when begin returns 409)."""
    # update-server/otupdate/common/update.py — cancel(); app __fixtures__ mockUpdateCancelSuccess (200)
    print("Cancelling existing update session...", file=sys.stderr)
    resp = client.post(f"{base_url}/server/update/cancel")
    resp.raise_for_status()
    print("Session cancelled", file=sys.stderr)


def get_update_status(
    client: httpx.Client, base_url: str, token: str
) -> dict:
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
            raise RuntimeError(f"Update session failed: {status.get('error', 'unknown error')}")

        time.sleep(2)

    raise TimeoutError("Timeout waiting for session to be ready")


# update-server/otupdate/common/session.py — Stages enum (.value.short used in API responses)
STAGE_LABELS = {
    "awaiting-file": "Awaiting file upload",
    "validating":    "Validating file (signature + hash check)",
    "writing":       "Writing to disk",
    "done":          "Write complete",
    "ready-for-restart": "Ready to commit",
    "error":         "Error",
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

    with open(file_path, "rb") as f:
        files = {field_name: (file_path.name, f, "application/zip")}
        resp = client.post(
            f"{base_url}/server/update/{token}/file",
            files=files,
        )
        resp.raise_for_status()

    session_state = resp.json()
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
        raise RuntimeError(f"Commit failed: {state.get('error', 'unknown')} — {message}")

    # Trigger the actual restart now that the update is committed
    print("Triggering robot restart...", file=sys.stderr)
    try:
        restart_resp = client.post(f"{base_url}/server/restart")
        restart_resp.raise_for_status()
    except (httpx.RemoteProtocolError, httpx.ReadError):
        # Robot may close the connection immediately on restart — that's fine
        pass
    print("✅ Robot is restarting. Update complete.", file=sys.stderr)


def wait_for_robot_ready(
    client: httpx.Client, base_url: str, timeout: float = 300, interval: float = 10
) -> None:
    """After restart, poll /health until robot responds (for consecutive updates)."""
    # Same GET /health as get_robot_health — robot-server health endpoint
    print("Waiting for robot to come back online...", file=sys.stderr)
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = client.get(f"{base_url}/health")
            if resp.status_code == 200:
                print("Robot is ready.", file=sys.stderr)
                return
        except (httpx.ConnectError, httpx.ReadError, httpx.WriteError):
            pass
        time.sleep(interval)
    raise TimeoutError(
        f"Robot did not become reachable within {timeout:.0f}s after restart"
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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Update robot system software from GitHub releases."
    )
    parser.add_argument(
        "ip",
        help="Robot IP address (e.g. 10.14.19.233)",
    )
    parser.add_argument(
        "--version",
        required=True,
        nargs="+",
        metavar="VERSION",
        help="One or more versions to apply in order (e.g. 8.8.1, or 9.0.0-alpha.11 8.8.1 8.7.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=31960,
        help="Port (default: 31960 for Flex/OT-3, use 31950 for OT-2)",
    )
    parser.add_argument(
        "--wait-after-restart",
        type=float,
        default=300,
        help="Seconds to wait for robot to come back after restart between consecutive updates (default: 300)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=30.0,
        help="Request timeout in seconds (default: 30)",
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip download, use existing file (must provide --file)",
    )
    parser.add_argument(
        "--file",
        type=Path,
        help="Path to system zip file (if not downloading)",
    )
    parser.add_argument(
        "-y", "--yes",
        action="store_true",
        help="Skip the confirmation prompt",
    )
    args = parser.parse_args()
    versions: List[str] = args.version

    if len(versions) > 1 and (args.skip_download or args.file):
        print(
            "Error: --skip-download and --file are not supported with multiple versions.",
            file=sys.stderr,
        )
        return 1

    base_url = f"http://{args.ip}:{args.port}"

    try:
        with httpx.Client(
            headers={"Opentrons-Version": "*"},
            timeout=args.timeout,
        ) as client:
            # ── Pre-flight: show current robot state and ask for confirmation ──
            health = get_robot_health(client, base_url)
            robot_model = health.get("robot_model", "OT-2 Standard")
            robot_name = health.get("name", "unknown")
            current_ver = health.get("api_version") or health.get("api_Version", "unknown")
            active_run = health.get("activeProtocolRun")

            print(f"\n  Robot:           {robot_name}  ({args.ip}:{args.port})", file=sys.stderr)
            print(f"  Model:           {robot_model}", file=sys.stderr)
            print(f"  Current version: {current_ver}", file=sys.stderr)
            if len(versions) == 1:
                print(f"  Target version:  {versions[0]}", file=sys.stderr)
            else:
                print(f"  Target versions: {' → '.join(versions)} (consecutive)", file=sys.stderr)

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
                if len(versions) > 1 and idx > 0:
                    wait_for_robot_ready(
                        client, base_url,
                        timeout=args.wait_after_restart,
                        interval=10,
                    )
                    # Refresh health for display (robot_model unchanged)
                    health = get_robot_health(client, base_url)
                    robot_model = health.get("robot_model", "OT-2 Standard")

                print(f"\n── Update {idx + 1}/{len(versions)}: {version} ──", file=sys.stderr)

                # Download or use provided file (single-version only)
                if args.skip_download and args.file and args.file.exists():
                    system_file = args.file
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
                    run_one_update(
                        client, base_url, version, robot_model, system_file
                    )
                finally:
                    if cleanup_file and system_file.exists():
                        system_file.unlink()

            print("\n✅ All updates completed successfully!", file=sys.stderr)
            if len(versions) == 1:
                print(
                    "The robot will restart. Wait a few minutes and check /health to verify.",
                    file=sys.stderr,
                )
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
            print(e.response.text, file=sys.stderr)
        return 1
    except httpx.ConnectError as e:
        print(f"Connection error: {e}", file=sys.stderr)
        return 1
    except httpx.RequestError as e:
        print(f"Request error: {e}", file=sys.stderr)
        return 1
    except (ValueError, RuntimeError, TimeoutError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
