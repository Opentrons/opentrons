"""Post-restart and readiness checks for update_robot.py (health, stable Flex snapshot, update-server)."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Callable, List, Literal, Optional, Tuple

import httpx

from update_robot_errors import format_state_tables
from update_robot_phases import phase_begin, phase_ok, phase_skip, readiness_pipeline_banner

# After reboot, /health may return 200 while update-server/nginx is still catching up.
NETWORK_UPDATE_SERVER_READY_TIMEOUT_S = 300
# Max time to poll GET /health until 200 after POST /server/restart (Flex can be down ~10+ minutes).
DEFAULT_WAIT_AFTER_RESTART_S = 900.0
# Stable snapshot: HTTP 200 on state routes + serials; N identical polls in a row.
STABLE_STATE_TIMEOUT_S = 1000.0
STABLE_STATE_NAG_AFTER_S = 420.0
STABLE_STATE_POLL_INTERVAL_S = 5.0
FLEX_STABLE_CONSECUTIVE_POLLS_DEFAULT = 2
FLEX_PIPETTE_SLOW_WARN_AFTER_S = 600.0

STATE_SNAPSHOT_RUNS_PAGE_LENGTH = 100
STATE_FETCH_RETRIES = 8
STATE_FETCH_RETRY_DELAY_S = 5

# robot-server GET /subsystems/updates/current — see robot_server/subsystems/router.py and
# api-client/src/subsystems/types.ts (updateStatus: queued | updating | done).
# After a system update the gripper/extension mount may flash firmware while /instruments still looks "attached";
# do not burn --stable-state-timeout until those jobs finish.
SUBSYSTEM_FW_ACTIVE_STATUSES = frozenset({"queued", "updating"})
SUBSYSTEM_FIRMWARE_IDLE_MAX_S = 1800.0

# Injected by update_robot.configure_usb_serial_helpers() before any USB verification runs.
_serial_get_fn: Optional[Callable[[str, str, float], Tuple[int, bytes]]] = None
_find_usb_port_fn: Optional[Callable[[], Optional[str]]] = None


def configure_usb_serial_helpers(
    serial_get: Callable[[str, str, float], Tuple[int, bytes]],
    find_opentrons_usb_port: Callable[[], Optional[str]],
) -> None:
    """Register open/close serial HTTP GET and USB port discovery (called from update_robot USB path)."""
    global _serial_get_fn, _find_usb_port_fn
    _serial_get_fn = serial_get
    _find_usb_port_fn = find_opentrons_usb_port


def _serial_get() -> Callable[[str, str, float], Tuple[int, bytes]]:
    if _serial_get_fn is None:
        raise RuntimeError("USB serial_get not configured (configure_usb_serial_helpers)")
    return _serial_get_fn


def _find_usb_port() -> Callable[[], Optional[str]]:
    if _find_usb_port_fn is None:
        raise RuntimeError("USB find_opentrons_usb_port not configured (configure_usb_serial_helpers)")
    return _find_usb_port_fn


def get_robot_health(
    client: httpx.Client, base_url: str, request_timeout: Optional[float] = None
) -> dict:
    """Fetch the full /health payload. Short retries on 502/503 (initial connect / quick checks)."""
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
    """Poll GET /health until HTTP 200 or overall_timeout."""
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


def check_update_api_available(
    client: httpx.Client, base_url: str
) -> tuple[bool, Optional[str]]:
    """Probe POST /server/update/begin. Returns (available, token_or_None)."""
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


def health_version_and_model_or_fallback(
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


def _get_json_or_none(
    client: httpx.Client,
    url: str,
    timeout: Optional[float],
    label: str,
    verbose: bool = False,
) -> Optional[dict]:
    """GET an endpoint with retries. Returns parsed JSON on 200, None on persistent failure."""
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


def _instruments_payload_looks_good(data: dict) -> bool:
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


def _modules_payload_looks_good(data: dict) -> bool:
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
) -> bool:
    return _instruments_payload_looks_good(instruments_json) and _modules_payload_looks_good(
        modules_json
    )


def _flex_instruments_ready_for_validation(inst_json: dict) -> bool:
    items = inst_json.get("data")
    if not isinstance(items, list):
        return False
    if len(items) == 0:
        return True
    for item in items:
        if not isinstance(item, dict):
            return False
        if item.get("ok") is False:
            return False
        sn = item.get("serialNumber") or item.get("id")
        if sn is None or str(sn).strip() in ("", "?"):
            return False
    return True


def _snapshot_identity_fingerprint(
    pipettes_rows: List[Tuple[str, str]],
    modules_serials: List[str],
) -> Tuple[Tuple[Tuple[str, str], ...], Tuple[str, ...]]:
    return (tuple(pipettes_rows), tuple(str(s) for s in modules_serials))


def _subsystem_updates_payload_active(body: dict) -> bool:
    """True if any entry in GET /subsystems/updates/current still reports queued or updating."""
    items = body.get("data")
    if not isinstance(items, list):
        return False
    for u in items:
        if isinstance(u, dict) and u.get("updateStatus") in SUBSYSTEM_FW_ACTIVE_STATUSES:
            return True
    return False


def _active_subsystem_names(body: dict) -> List[str]:
    names: List[str] = []
    for u in body.get("data") or []:
        if isinstance(u, dict) and u.get("updateStatus") in SUBSYSTEM_FW_ACTIVE_STATUSES:
            names.append(str(u.get("subsystem", "?")))
    return names


SubsystemFwIdleResult = Literal["404", "idle", "cleared"]


def wait_for_subsystem_firmware_idle_network(
    client: httpx.Client,
    base_url: str,
    per_request_timeout: float,
    max_wait_s: float,
    poll_interval_s: float,
) -> SubsystemFwIdleResult:
    """Poll until no subsystem reports queued/updating. Does not count toward stable timer.

    Returns:
        ``404`` — route not present; ``idle`` — never saw active jobs; ``cleared`` — saw queued/updating then idle.
    """
    url = f"{base_url}/subsystems/updates/current"
    t0 = time.time()
    warned = False
    last_log = 0.0
    while time.time() - t0 < max_wait_s:
        try:
            resp = client.get(url, timeout=per_request_timeout)
        except httpx.TransportError:
            time.sleep(poll_interval_s)
            continue
        if resp.status_code == 404:
            return "404"
        if resp.status_code != 200:
            time.sleep(poll_interval_s)
            continue
        try:
            payload = resp.json()
        except (json.JSONDecodeError, ValueError):
            time.sleep(poll_interval_s)
            continue
        if not _subsystem_updates_payload_active(payload):
            return "cleared" if warned else "idle"
        elapsed = time.time() - t0
        if not warned:
            subs = _active_subsystem_names(payload)
            print(
                "    Active subsystems: "
                + (", ".join(subs) if subs else "(see robot touchscreen)")
                + " — polling until idle…",
                file=sys.stderr,
            )
            warned = True
        if elapsed - last_log >= 60.0:
            print(
                f"  … still waiting for subsystem firmware idle ({elapsed:.0f}s / {max_wait_s:.0f}s)",
                file=sys.stderr,
            )
            last_log = elapsed
        time.sleep(poll_interval_s)
    raise TimeoutError(
        f"Subsystem firmware still updating after {max_wait_s:.0f}s "
        "(GET /subsystems/updates/current). Wait for the robot UI to finish, or increase "
        "--subsystem-fw-idle-max."
    )


def wait_for_subsystem_firmware_idle_usb(
    port_path: str,
    per_request_timeout: float,
    max_wait_s: float,
    poll_interval_s: float,
) -> SubsystemFwIdleResult:
    """USB serial HTTP: same contract as ``wait_for_subsystem_firmware_idle_network``."""
    sg = _serial_get()
    path = "/subsystems/updates/current"
    t0 = time.time()
    warned = False
    last_log = 0.0
    while time.time() - t0 < max_wait_s:
        try:
            status, raw = sg(port_path, path, timeout=per_request_timeout)
        except Exception:
            time.sleep(poll_interval_s)
            continue
        if status == 404:
            return "404"
        if status != 200:
            time.sleep(poll_interval_s)
            continue
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, ValueError):
            time.sleep(poll_interval_s)
            continue
        if not _subsystem_updates_payload_active(payload):
            return "cleared" if warned else "idle"
        elapsed = time.time() - t0
        if not warned:
            subs = _active_subsystem_names(payload)
            print(
                "    Active subsystems: "
                + (", ".join(subs) if subs else "(see robot touchscreen)")
                + " — polling until idle…",
                file=sys.stderr,
            )
            warned = True
        if elapsed - last_log >= 60.0:
            print(
                f"  … still waiting for subsystem firmware idle ({elapsed:.0f}s / {max_wait_s:.0f}s)",
                file=sys.stderr,
            )
            last_log = elapsed
        time.sleep(poll_interval_s)
    raise TimeoutError(
        f"Subsystem firmware still updating after {max_wait_s:.0f}s over USB "
        "(GET /subsystems/updates/current). Wait for the robot UI to finish, or increase "
        "--subsystem-fw-idle-max."
    )


def fetch_state_network_once(
    client: httpx.Client,
    base_url: str,
    timeout: float,
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

    try:
        resp = client.get(f"{base_url}/instruments", timeout=timeout)
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
    overall_timeout: float = STABLE_STATE_TIMEOUT_S,
    nag_after_s: float = STABLE_STATE_NAG_AFTER_S,
    poll_interval_s: float = STABLE_STATE_POLL_INTERVAL_S,
    consecutive_matching_polls: int = FLEX_STABLE_CONSECUTIVE_POLLS_DEFAULT,
    pipette_slow_warn_after_s: float = FLEX_PIPETTE_SLOW_WARN_AFTER_S,
    subsystem_firmware_idle_max_s: float = SUBSYSTEM_FIRMWARE_IDLE_MAX_S,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Poll until HTTP 200, modules OK, instruments fully online, then N matching snapshots."""
    n = max(1, int(consecutive_matching_polls))
    phase_begin(
        "network",
        3,
        "GET /subsystems/updates/current — wait until no subsystem reports queued or updating.",
    )
    fw = wait_for_subsystem_firmware_idle_network(
        client,
        base_url,
        per_request_timeout,
        max_wait_s=subsystem_firmware_idle_max_s,
        poll_interval_s=poll_interval_s,
    )
    if fw == "404":
        phase_skip("network", 3, "GET /subsystems/updates/current returned 404 (endpoint not on this build).")
    elif fw == "cleared":
        phase_ok("network", 3, "Subsystem firmware jobs finished (were queued or updating).")
    else:
        phase_ok("network", 3, "No active subsystem firmware jobs on first poll.")

    phase_begin(
        "network",
        4,
        f"GET /runs, /instruments, /modules — need {n} consecutive matching healthy snapshots; "
        f"timer {overall_timeout:.0f}s starts now.",
    )
    start = time.time()
    nag_printed = False
    pipette_slow_warn_printed = False
    last_progress_log = 0.0
    prev_fingerprint: Optional[Tuple[Tuple[Tuple[str, str], ...], Tuple[str, ...]]] = None
    match_streak = 0
    last_good_runs: List[dict] = []
    last_good_pipettes: List[Tuple[str, str]] = []
    last_good_modules: List[str] = []
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

        got = fetch_state_network_once(client, base_url, per_request_timeout)
        if got is None:
            prev_fingerprint = None
            match_streak = 0
            time.sleep(poll_interval_s)
            continue
        runs, pipettes_rows, modules_serials, inst_json, mod_json = got
        if not _state_snapshot_looks_good(inst_json, mod_json):
            prev_fingerprint = None
            match_streak = 0
            time.sleep(poll_interval_s)
            continue
        if not _flex_instruments_ready_for_validation(inst_json):
            prev_fingerprint = None
            match_streak = 0
            if (
                not pipette_slow_warn_printed
                and pipette_slow_warn_after_s > 0
                and elapsed >= pipette_slow_warn_after_s
            ):
                print(
                    "Warning: pipettes/grippers still not reporting healthy serials after "
                    f"{pipette_slow_warn_after_s:.0f}s. On a real robot this can take many minutes while "
                    "subsystems load — not an error. Still waiting (no timeout until "
                    f"{overall_timeout:.0f}s); increase --stable-state-timeout if needed.",
                    file=sys.stderr,
                )
                pipette_slow_warn_printed = True
            time.sleep(poll_interval_s)
            continue
        fp = _snapshot_identity_fingerprint(pipettes_rows, modules_serials)
        last_good_runs, last_good_pipettes, last_good_modules = runs, pipettes_rows, modules_serials
        if prev_fingerprint is not None and fp == prev_fingerprint:
            match_streak += 1
        else:
            prev_fingerprint = fp
            match_streak = 1
        if match_streak >= n:
            print(
                "Stable snapshot ready ({} consecutive matching instrument/module identity sets; instruments healthy).".format(
                    n
                ),
                file=sys.stderr,
            )
            phase_ok(
                "network",
                4,
                f"{n} consecutive matching instrument/module snapshots with healthy serials.",
            )
            return last_good_runs, last_good_pipettes, last_good_modules
        time.sleep(poll_interval_s)

    raise TimeoutError(
        f"Stable Flex state snapshot not obtained within {overall_timeout:.0f}s "
        f"(need HTTP 200 on /runs, /instruments, /modules; pipettes online with real serials; {n} matching polls "
        "while online). If pipettes were still loading, increase --stable-state-timeout. "
        "If the gripper/extension mount was updating firmware first, increase --subsystem-fw-idle-max."
    )


def wait_for_robot_state_after_restart_network(
    client: httpx.Client,
    base_url: str,
    per_request_timeout: float,
    *,
    flex_stable_timeout: float,
    flex_nag_after: float,
    flex_poll_interval: float,
    flex_consecutive_matching_polls: int,
    subsystem_firmware_idle_max_s: float = SUBSYSTEM_FIRMWARE_IDLE_MAX_S,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """After restart: stable multi-poll wait until instruments/modules serials match."""
    return wait_for_stable_robot_state_network(
        client,
        base_url,
        per_request_timeout,
        overall_timeout=flex_stable_timeout,
        nag_after_s=flex_nag_after,
        poll_interval_s=flex_poll_interval,
        consecutive_matching_polls=flex_consecutive_matching_polls,
        subsystem_firmware_idle_max_s=subsystem_firmware_idle_max_s,
    )


def fetch_usb_health_calibration(port_path: str, timeout: float) -> Tuple[str, str]:
    """GET /health and /calibration/status over USB for summary headers."""
    sg = _serial_get()
    api_ver, calibration = "?", "?"
    try:
        status, raw = sg(port_path, "/health", timeout=timeout)
        if status == 200:
            health = json.loads(raw.decode("utf-8"))
            api_ver = health.get("api_version") or health.get("api_Version", "?")
    except Exception:
        pass
    try:
        status, raw = sg(port_path, "/calibration/status", timeout=timeout)
        if status == 200:
            calibration = str((json.loads(raw.decode("utf-8")).get("deckCalibration") or {}).get("status", "?"))
    except Exception:
        pass
    return api_ver, calibration


def fetch_state_usb_once(
    port_path: str,
    timeout: float,
    runs_page_length: int = STATE_SNAPSHOT_RUNS_PAGE_LENGTH,
) -> Optional[Tuple[List[dict], List[Tuple[str, str]], List[str], dict, dict]]:
    """Single pass over USB for runs + /instruments + /modules. None if any GET is not 200."""
    sg = _serial_get()
    try:
        status, raw = sg(
            port_path,
            "/runs?pageLength={}".format(runs_page_length),
            timeout=timeout,
        )
        if status != 200:
            return None
        runs = (json.loads(raw.decode("utf-8")).get("data") or []) or []
    except Exception:
        return None
    try:
        status, raw = sg(port_path, "/instruments", timeout=timeout)
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
    try:
        status, raw = sg(port_path, "/modules", timeout=timeout)
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
    overall_timeout: float = STABLE_STATE_TIMEOUT_S,
    nag_after_s: float = STABLE_STATE_NAG_AFTER_S,
    poll_interval_s: float = STABLE_STATE_POLL_INTERVAL_S,
    consecutive_matching_polls: int = FLEX_STABLE_CONSECUTIVE_POLLS_DEFAULT,
    pipette_slow_warn_after_s: float = FLEX_PIPETTE_SLOW_WARN_AFTER_S,
    subsystem_firmware_idle_max_s: float = SUBSYSTEM_FIRMWARE_IDLE_MAX_S,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    """Flex only: same policy as network — stable snapshot over USB serial HTTP."""
    n = max(1, int(consecutive_matching_polls))
    phase_begin(
        "usb",
        2,
        "GET /subsystems/updates/current over serial — wait until no queued or updating.",
    )
    fw = wait_for_subsystem_firmware_idle_usb(
        port_path,
        per_request_timeout,
        max_wait_s=subsystem_firmware_idle_max_s,
        poll_interval_s=poll_interval_s,
    )
    if fw == "404":
        phase_skip("usb", 2, "GET /subsystems/updates/current returned 404 (endpoint not on this build).")
    elif fw == "cleared":
        phase_ok("usb", 2, "Subsystem firmware jobs finished (were queued or updating).")
    else:
        phase_ok("usb", 2, "No active subsystem firmware jobs on first poll.")

    phase_begin(
        "usb",
        3,
        f"GET /runs, /instruments, /modules over serial — need {n} consecutive matching healthy snapshots; "
        f"timer {overall_timeout:.0f}s starts now.",
    )
    start = time.time()
    nag_printed = False
    pipette_slow_warn_printed = False
    last_progress_log = 0.0
    prev_fingerprint: Optional[Tuple[Tuple[Tuple[str, str], ...], Tuple[str, ...]]] = None
    match_streak = 0
    last_good_runs: List[dict] = []
    last_good_pipettes: List[Tuple[str, str]] = []
    last_good_modules: List[str] = []
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

        got = fetch_state_usb_once(port_path, per_request_timeout)
        if got is None:
            prev_fingerprint = None
            match_streak = 0
            time.sleep(poll_interval_s)
            continue
        runs, pipettes_rows, modules_serials, inst_json, mod_json = got
        if not _state_snapshot_looks_good(inst_json, mod_json):
            prev_fingerprint = None
            match_streak = 0
            time.sleep(poll_interval_s)
            continue
        if not _flex_instruments_ready_for_validation(inst_json):
            prev_fingerprint = None
            match_streak = 0
            if (
                not pipette_slow_warn_printed
                and pipette_slow_warn_after_s > 0
                and elapsed >= pipette_slow_warn_after_s
            ):
                print(
                    "Warning: pipettes/grippers still not reporting healthy serials after "
                    f"{pipette_slow_warn_after_s:.0f}s. On a real robot this can take many minutes while "
                    "subsystems load — not an error. Still waiting (no timeout until "
                    f"{overall_timeout:.0f}s); increase --stable-state-timeout if needed.",
                    file=sys.stderr,
                )
                pipette_slow_warn_printed = True
            time.sleep(poll_interval_s)
            continue
        fp = _snapshot_identity_fingerprint(pipettes_rows, modules_serials)
        last_good_runs, last_good_pipettes, last_good_modules = runs, pipettes_rows, modules_serials
        if prev_fingerprint is not None and fp == prev_fingerprint:
            match_streak += 1
        else:
            prev_fingerprint = fp
            match_streak = 1
        if match_streak >= n:
            print(
                "Stable snapshot ready ({} consecutive matching instrument/module identity sets; instruments healthy).".format(
                    n
                ),
                file=sys.stderr,
            )
            phase_ok(
                "usb",
                3,
                f"{n} consecutive matching instrument/module snapshots with healthy serials.",
            )
            return last_good_runs, last_good_pipettes, last_good_modules
        time.sleep(poll_interval_s)

    raise TimeoutError(
        f"Stable Flex state snapshot not obtained within {overall_timeout:.0f}s over USB "
        f"(need HTTP 200 on state routes; pipettes online with real serials; {n} matching polls while online). "
        "If pipettes were still loading, increase --stable-state-timeout. "
        "If subsystem (e.g. gripper) firmware was updating first, increase --subsystem-fw-idle-max."
    )


def wait_for_robot_state_after_restart_usb(
    port_path: str,
    per_request_timeout: float,
    *,
    flex_stable_timeout: float,
    flex_nag_after: float,
    flex_poll_interval: float,
    flex_consecutive_matching_polls: int,
    subsystem_firmware_idle_max_s: float = SUBSYSTEM_FIRMWARE_IDLE_MAX_S,
) -> Tuple[List[dict], List[Tuple[str, str]], List[str]]:
    return wait_for_stable_robot_state_usb(
        port_path,
        per_request_timeout,
        overall_timeout=flex_stable_timeout,
        nag_after_s=flex_nag_after,
        poll_interval_s=flex_poll_interval,
        consecutive_matching_polls=flex_consecutive_matching_polls,
        subsystem_firmware_idle_max_s=subsystem_firmware_idle_max_s,
    )


def usb_final_summary(
    port_path: str,
    timeout: float,
    file_uploaded: Path,
    stable_timeout: float,
    stable_nag_after: float,
    stable_poll_interval: float,
    flex_consecutive_matching_polls: int,
    fallback_software_version: str,
    subsystem_firmware_idle_max_s: float = SUBSYSTEM_FIRMWARE_IDLE_MAX_S,
) -> None:
    """Print final state over USB using unified state tables (same format as network)."""
    runs, pipettes_rows, modules_serials = wait_for_robot_state_after_restart_usb(
        port_path,
        timeout,
        flex_stable_timeout=stable_timeout,
        flex_nag_after=stable_nag_after,
        flex_poll_interval=stable_poll_interval,
        flex_consecutive_matching_polls=flex_consecutive_matching_polls,
        subsystem_firmware_idle_max_s=subsystem_firmware_idle_max_s,
    )
    api_ver, calibration = fetch_usb_health_calibration(port_path, timeout)
    sw = api_ver if api_ver != "?" else fallback_software_version
    header_lines = [
        "File uploaded:     " + file_uploaded.name,
        "Calibration:       " + calibration,
    ]
    format_state_tables(
        runs,
        pipettes_rows,
        modules_serials,
        "Final state",
        header_lines=header_lines,
        software_version=sw,
    )


def usb_ready_summary(port_path: str, timeout: float) -> str:
    """GET /runs, /instruments, /modules over USB and return a one-line summary."""
    sg = _serial_get()
    parts: List[str] = []
    try:
        status, raw = sg(port_path, "/runs", timeout=timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            n = data.get("meta", {}).get("totalLength") or len(data.get("data", []))
            parts.append(f"Runs: {n}")
        else:
            parts.append("Runs: ?")
    except Exception:
        parts.append("Runs: ?")
    try:
        status, raw = sg(port_path, "/instruments", timeout=timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            if isinstance(data.get("data"), list):
                n = len(data["data"])
            else:
                n = 0
            parts.append(f"Instruments: {n}")
        else:
            parts.append("Instruments: ?")
    except Exception:
        parts.append("Instruments: ?")
    try:
        status, raw = sg(port_path, "/modules", timeout=timeout)
        if status == 200:
            data = json.loads(raw.decode("utf-8"))
            n = len(data.get("data", []) if isinstance(data.get("data"), list) else [])
            parts.append(f"Modules: {n}")
        else:
            parts.append("Modules: ?")
    except Exception:
        parts.append("Modules: ?")
    return " | ".join(parts)


def wait_for_robot_ready_usb(
    timeout: float = DEFAULT_WAIT_AFTER_RESTART_S, interval: float = 10
) -> None:
    """After USB restart, poll /health over serial until robot responds."""
    find_port = _find_usb_port()
    sg = _serial_get()
    readiness_pipeline_banner("usb")
    phase_begin("usb", 1, f"Poll serial GET /health until 200 (max {timeout:.0f}s, every {interval:.0f}s).")
    start = time.time()
    last_progress_log = 0.0
    while time.time() - start < timeout:
        time.sleep(interval)
        elapsed = time.time() - start
        if elapsed - last_progress_log >= 60.0:
            print(
                f"  … still waiting for USB /health ({elapsed:.0f}s / {timeout:.0f}s) — "
                "no port or failed reads are normal while the robot reboots.",
                file=sys.stderr,
            )
            last_progress_log = elapsed
        port_path = find_port()
        if not port_path:
            continue
        try:
            status, body = sg(port_path, "/health", timeout=15)
            if status == 200:
                phase_ok("usb", 1, "GET /health returned 200.")
                summary = usb_ready_summary(port_path, 15)
                print("  " + summary, file=sys.stderr)
                return
        except Exception:
            pass
    raise TimeoutError(
        f"Robot did not return USB /health 200 within {timeout:.0f}s after restart. "
        "That is a *reachability* timeout, not evidence the flash failed — if you saw "
        "'Robot is restarting' and 'Update complete', commit already finished; check the robot "
        "and run check_health.py --usb when it is back."
    )


def wait_for_robot_ready(
    client: httpx.Client,
    base_url: str,
    timeout: float = DEFAULT_WAIT_AFTER_RESTART_S,
    interval: float = 10,
) -> None:
    """After restart, poll /health until robot responds (for consecutive updates)."""
    readiness_pipeline_banner("network")
    phase_begin("network", 1, f"Poll GET /health until 200 (max {timeout:.0f}s, every {interval:.0f}s).")
    start = time.time()
    last_progress_log = 0.0
    while time.time() - start < timeout:
        elapsed = time.time() - start
        if elapsed - last_progress_log >= 60.0:
            print(
                f"  … still polling GET /health ({elapsed:.0f}s / {timeout:.0f}s) — "
                "refused connections and timeouts are normal while the robot is down.",
                file=sys.stderr,
            )
            last_progress_log = elapsed
        try:
            resp = client.get(f"{base_url}/health")
            if resp.status_code == 200:
                phase_ok("network", 1, "GET /health returned 200 — robot-server is accepting HTTP.")
                return
        except httpx.TransportError:
            pass
        time.sleep(interval)
    raise TimeoutError(
        f"GET /health did not return 200 within {timeout:.0f}s after restart. "
        "This is only a *reachability* timeout: if commit and restart already ran, the update may still "
        "have succeeded — wait for the robot on the network and run check_health.py <IP>."
    )


def wait_for_update_server_ready(
    client: httpx.Client,
    base_url: str,
    timeout: float = NETWORK_UPDATE_SERVER_READY_TIMEOUT_S,
    interval: float = 5,
) -> None:
    """After /health is up, poll GET /server/update/health until 200."""
    phase_begin(
        "network",
        2,
        f"Poll GET /server/update/health until 200 (max {timeout:.0f}s, every {interval:.0f}s).",
    )
    start = time.time()
    while time.time() - start < timeout:
        try:
            resp = client.get(f"{base_url}/server/update/health")
            if resp.status_code == 200:
                phase_ok("network", 2, "Update-server route is up — safe to begin another system-image session.")
                return
        except httpx.TransportError:
            pass
        time.sleep(interval)
    raise TimeoutError(
        f"Update server did not become ready within {timeout:.0f}s "
        "(GET /server/update/health never returned 200). "
        "If /health is already 200, nginx or update-server may still be starting — "
        "increase wait time or retry; this does not imply the system image write failed."
    )
