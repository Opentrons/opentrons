---
name: robot-ip-health
description: Check robot health by IP address and update robot system software. Use when the user provides a robot IP (e.g. 10.14.19.233) to hit the health endpoint, verify robot connectivity, query robot status remotely, or update robot software from GitHub releases.
---

# Robot Health by IP

When the user provides a robot IP address (e.g. `10.14.19.233`), use this skill to hit the health endpoint and return robot status.

## Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| Robot server health | `http://<IP>:31950/health` | Main health — API version, firmware, serial, disk |
| Update server health | `http://<IP>:31950/server/update/health` | Update server version, capabilities |

**Ports**: For real robots use **31950** (robot server HTTP API). Default in scripts is 31950. For local dev server use `--port 34000`.

| Port | Description |
|------|-------------|
| 22 | SSH |
| 443 | HTTPS (app updates) |
| 1883 | MQTT (Flex → app) |
| 5353 | mDNS (discovery) |
| **31950** | **Robot server HTTP API** (health, update, etc.) |
| 48888 | Jupyter Notebook |

## Required Header

The robot-server requires the `Opentrons-Version` header:

```
Opentrons-Version: *
```

## curl Examples

```bash
# Robot server health (OT-2)
curl -s -H "Opentrons-Version: *" "http://10.14.19.233:31950/health" | jq .

# Update server health
curl -s -H "Opentrons-Version: *" "http://10.14.19.233:31950/server/update/health" | jq .
```

## Scripts in This Skill

| Script | Purpose |
|--------|---------|
| `scripts/check_health.py` | GET `/health` (and optionally `/server/update/health`), print JSON. Supports `--usb` for Flex/OT-3 connected via USB (macOS/Linux). |
| `scripts/update_robot.py` | Full robot system update: download from GitHub, begin session, upload file, poll status, commit, restart. |

### check_health.py

Requires `httpx`. For `--usb`: `pyserial` (`pip install pyserial`). From monorepo root:

```bash
# By IP (robot on network)
python .cursor/skills/robot-ip-health/scripts/check_health.py 10.14.19.233
python .cursor/skills/robot-ip-health/scripts/check_health.py 10.14.19.233 --port 31950

# Over USB (Flex/OT-3 connected via USB on macOS/Linux; close Opentrons app if port is busy)
python .cursor/skills/robot-ip-health/scripts/check_health.py --usb
python .cursor/skills/robot-ip-health/scripts/check_health.py --usb --update
```

### update_robot.py — Arguments

| Argument | Description |
|----------|-------------|
| `ip` | Robot IP or hostname. Omit when using `--usb`. |
| `--usb` | Use USB serial connection (Flex/OT-3). **No network needed** — works with Wi‑Fi off. Requires `--file`. Script prints `Connection: USB (serial port ...) — no network` so you can confirm. |
| `--version` | One or more target versions, applied in order. Optional when using `--file` (version is derived from filename, e.g. `ot3-system-8.8.1.zip`). |
| `--port` | Default 31950 (robot server). Use 34000 for local dev server. Ignored when using `--usb`. |
| `--wait-after-restart` | Seconds to wait for robot to come back between consecutive updates (default 300). For USB, script polls /health over serial until robot responds before printing success. |
| `--timeout` | Request timeout in seconds (default 30). |
| `--skip-download` | Use existing zip; requires `--file`. Not allowed with multiple versions. |
| `--file` | Path to system zip. Repeat for consecutive USB updates: `--file a.zip --file b.zip`. Required for `--usb`. Over network, single file only; version derived from filename. |
| `-y`, `--yes` | Skip the confirmation prompt (for scripts/CI). |
| `--debug-usb` | Log exact request bytes and raw response bytes over USB (for debugging POST begin / empty response). |

The script always prints the **connection method** at the start: `Connection: USB (serial port /dev/cu.usbmodem...) — no network` or `Connection: network (http://IP:port)` so you can verify it is not using Wi‑Fi when using USB.

### update_robot.py — Pre-flight and Flow

1. **GET /health** — Robot name, model, current version, `activeProtocolRun`.
2. **Pre-flight: POST /server/update/begin**  
   - **404** → Script exits with message: "Update API not available on this robot." No download. (Some firmware builds don’t expose `/server/update/*`.)  
   - **201** → Session created; script calls **POST /server/update/cancel** to close the probe session, then continues.  
   - **409** → API present, session already active; script continues (will cancel and retry begin later).
3. **Warnings** — If a protocol run is active or robot is already on target version, script prints a warning but can still proceed.
4. **Confirmation** — Unless `--yes`, prompts: "Proceed with update? [y/N]".
5. **Download** — From GitHub: `ot3-system-{version}.zip` or `ot2-system-{version}.zip` per robot model.
6. **Session flow** — Begin (or cancel+begin if 409), wait for `awaiting-file`, upload file, poll until `done`, commit, then **POST /server/restart**.

### update_robot.py — Usage Examples

```bash
# Real robot (port 31950, robot server)
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --version 8.8.1
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --version 9.0.0-alpha.11

# Consecutive updates (applied in order; script waits for robot to come back between each)
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --version 9.0.0-alpha.11 8.8.1 9.0.0-alpha.11 8.7.1

# OT-2: use --port 31950
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --version 8.3.0 --port 31950

# Skip confirmation (scripts/CI)
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --version 8.8.1 --yes

# Over USB (Flex/OT-3; Wi‑Fi can be off). Requires --file. Version from filename.
python .cursor/skills/robot-ip-health/scripts/update_robot.py --usb --file .cursor/skills/robot-ip-health/scripts/ot3-system-8.8.1.zip -y

# Consecutive USB updates (9.0.0-alpha.12 → 8.7.0 → 9.0.0-alpha.12). Script waits for robot to come back between each.
python .cursor/skills/robot-ip-health/scripts/update_robot.py --usb \
  --file .cursor/skills/robot-ip-health/scripts/ot3-system-9.0.0-alpha.12.zip \
  --file .cursor/skills/robot-ip-health/scripts/ot3-system-8.7.0.zip \
  --file .cursor/skills/robot-ip-health/scripts/ot3-system-9.0.0-alpha.12.zip \
  -y
# USB with debug (log request/response bytes to stderr, e.g. when POST begin returns empty)
python .cursor/skills/robot-ip-health/scripts/update_robot.py --usb --file .cursor/skills/robot-ip-health/scripts/ot3-system-8.8.1.zip -y --debug-usb
# Same with absolute path:
python .cursor/skills/robot-ip-health/scripts/update_robot.py --usb --file /Users/alexcopperman/Downloads/Opentrons_General/opentrons/.cursor/skills/robot-ip-health/scripts/ot3-system-8.8.1.zip -y

# Over network with local file (version derived from filename)
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --file /path/to/ot3-system-8.8.1.zip
# Or with explicit version
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 --version 8.8.1 --skip-download --file /path/to/ot3-system-8.8.1.zip

# Local practice (dev server)
python .cursor/skills/robot-ip-health/scripts/update_robot.py localhost --version 8.8.1 --port 34000 --yes
```

### Update via USB (local file) vs. robot connected only via USB

You can update using a system zip from a USB drive or any local path instead of downloading from GitHub. The script derives the target version from the filename when you omit `--version` (e.g. `ot3-system-8.8.1.zip` → 8.8.1). The robot is still updated over the network (same HTTP update API); “USB” here means the **source** of the zip (e.g. copied from a USB stick).

When the robot is connected **only via USB** (no Wi‑Fi or Ethernet), use **`--usb`** so the script talks over the USB serial port (no network). It prints `Connection: USB (serial port ...) — no network` so you can confirm.

**Test zip in this skill (update over USB with Wi‑Fi off):**

```bash
# From monorepo root. Close the Opentrons app if the USB port is busy.
python .cursor/skills/robot-ip-health/scripts/update_robot.py --usb \
  --file .cursor/skills/robot-ip-health/scripts/ot3-system-8.8.1.zip \
  -y
```

After the robot comes back, the script prints a **final state** block: file uploaded, software version, pipettes (with serial numbers), modules (with serial numbers), and calibration status (`GET /calibration/status`).

USB device detection in the app (so the app sees the robot and other USB devices after an update) is in `app-shell/src/system-info/usb-devices.ts` and redux `app/src/redux/system-info/`. See [PR #14482](https://github.com/Opentrons/opentrons/pull/14482) for context.

### Demo: Consecutive updates (multiple versions)

You can apply several versions in one run. The script runs one full update (begin → upload → done → commit → restart), then waits for the robot to come back, then runs the next version. Use `--yes` to skip the single confirmation prompt so the whole sequence is unattended.

**Example: cycle through three versions on a Flex robot**

```bash
# From repo root. Port 31950 (robot server). Robot will update to 9.0.0-alpha.11, then 8.8.1, then 8.7.1.
python .cursor/skills/robot-ip-health/scripts/update_robot.py 10.14.19.233 \
  --version 9.0.0-alpha.11 8.8.1 8.7.1 \
  --yes
```

What happens:

1. Script GETs `/health`, shows robot and **Target versions: 9.0.0-alpha.11 → 8.8.1 → 8.7.1 (consecutive)**.
2. You’re prompted once (or skipped with `--yes`).
3. **Update 1/3**: Download `ot3-system-9.0.0-alpha.11.zip`, begin session, upload, poll until done, commit, restart. Robot goes down.
4. Script waits for the robot to respond on `/health` again (default up to 300s, every 10s). Adjust with `--wait-after-restart`.
5. **Update 2/3**: Same flow for 8.8.1; then wait again.
6. **Update 3/3**: Same flow for 8.7.1.
7. Prints **All updates completed successfully!**

**Demo against local dev server (no real restart)**

With the dev server there is no reboot, so the script doesn’t wait long — the next begin may get 409 (session still in app); the script cancels and starts a new session.

```bash
# Terminal 1: start Flex dev server
cd update-server && uv run python scripts/dev_server.py --flex --port 34000

# Terminal 2: run two “updates” in a row (no download if you reuse --skip-download --file for single-version; for multiple we download each)
python .cursor/skills/robot-ip-health/scripts/update_robot.py localhost --version 8.8.1 8.7.1 --port 34000 --yes
```

### Update API Response Shape (source of truth)

- **Status/commit responses**: `stage` (string), `message` (string), `progress` (number, optional), `error` (string, when stage is `error`).  
- **Stages**: `awaiting-file` → `validating` → `writing` → `done` → after commit `ready-for-restart`.  
- **Success codes**: `POST /server/update/begin` returns **201** (not 200).  

Defined in `update-server/otupdate/common/session.py` (`Stages`, `UpdateSession.state`) and `update-server/otupdate/common/update.py`.

### Multipart Upload Field Names

- OT-3: form field **`system-update.zip`**
- OT-2: form field **`ot2-system.zip`**

Script sets the field name from robot model. See `update-server/otupdate/buildroot/update_actions.py` (`UPDATE_PKG_BR`) and `update-server/otupdate/openembedded/update_actions.py` (`UPDATE_PKG_OE`).

### GitHub Release URLs

- OT-3: `https://github.com/Opentrons/opentrons/releases/download/v{version}/ot3-system-{version}.zip`
- OT-2: `https://github.com/Opentrons/opentrons/releases/download/v{version}/ot2-system-{version}.zip`

---

## Local Practice (Dev Server)

The update-server can be run locally with hardware calls stubbed (no real partition write, no reboot). Use this to **validate the update flow** (network path) before running on a robot.

**Validate with dev server (Flex, same API as real robot):**

```bash
# Terminal 1 — from repo root
cd update-server && uv run python scripts/dev_server.py --flex --port 34000

# Terminal 2 — from repo root: run update over network against localhost
python .cursor/skills/robot-ip-health/scripts/update_robot.py localhost \
  --file .cursor/skills/robot-ip-health/scripts/ot3-system-8.8.1.zip \
  --port 34000 -y
```

You should see `Connection: network (http://localhost:34000)`, then begin → upload → validating → writing → done → commit; the dev server logs "restart: no-op" and does not reboot. This confirms the script and API match. The **USB** path uses the same HTTP protocol over serial, so validating the network path with the dev server is sufficient before running `--usb` on a real robot.

**Start dev server** (from `update-server/`):

```bash
cd update-server
# OT-2 (buildroot) — default port 34000
uv run python scripts/dev_server.py --port 34000

# OT-3 / Flex (openembedded)
uv run python scripts/dev_server.py --flex --port 34000
```

Requires `make setup` (or `uv sync`) in `update-server/` first. Then run `update_robot.py` with `localhost` and `--port 34000` (or the port you chose).

---

## Safety and Failure States

- **Dual-partition design**: The update server always writes to the **inactive** partition. If validation or write fails (or power is lost during write), the robot reboots from the unchanged active partition — no brick from failed write.
- **Validation before write**: Hash mismatch, wrong robot type (OT-2 zip on OT-3 or vice versa), missing zip contents, or signature failure set session stage to `error` and no partition is written. See `update-server/otupdate/common/file_actions.py` (exceptions) and the `validate_update` logic in buildroot/openembedded `update_actions.py`.
- **Risky window**: The only critical moment is during `commit` when the bootloader is told to switch partition; power loss there is mitigated by hardware (e.g. U-Boot env redundancy on OT-3). The script does not change that; it just drives the API.
- **404 on update API**: If the robot’s firmware doesn’t expose `/server/update/*`, the script exits before downloading and reports that the update API is not available.

---

## USB Update Troubleshooting

| Issue | What to do |
|-------|------------|
| **409 on begin** | A previous update session is still open. The script automatically cancels and retries. If it still fails, restart the robot to clear the session, then run the update again. |
| **Long validating/writing** | Over USB, upload + validate + write can take 5–10+ minutes. The script polls `GET /server/update/{token}/status` every 3s. Let it run; don't interrupt. |
| **USB port in use** | Close the Opentrons app (it holds the serial device), then rerun. |
| **Disconnect during restart** | The robot may drop the USB connection when it restarts. That's normal — the update is already committed. If you saw "✅ Robot is restarting. Update complete.", the update succeeded. Wait a few minutes and run `check_health.py --usb` to confirm the robot is back. |
| **Windows** | The script uses the same Opentrons USB VID/PID (1B67/4037) and pyserial; the port appears as a **COM port** (e.g. `COM3`) instead of `/dev/cu.usbmodem*`. Close the Opentrons app if the port is in use. Electron/USB in the desktop app was updated in [PR #17010](https://github.com/Opentrons/opentrons/pull/17010); the Python scripts do not use Electron. |
| **Windows: consecutive requests/polling** | The Windows serial stack often needs a bit more time after each write before the next read. The script uses a longer post-write delay on Windows (`USB_DELAY_AFTER_WRITE_S` 0.35s vs 0.2s on macOS/Linux) so back-to-back HTTP request/response over the same port is more reliable. If you still see timeouts or corrupt responses on Windows, try increasing `USB_DELAY_BETWEEN_REQUESTS_S` (e.g. 1.5) in the script. |
| **Encoding / hex** | The script never decodes hex from the robot. All traffic is raw bytes: request/response headers are ASCII, bodies are UTF-8. We only use `.hex()` when `--debug-usb` is set, to *log* the request bytes we send. Response bodies are always decoded with `decode("utf-8", errors="replace")`. Same behavior on all platforms. |

---

## Where to Validate in the Repo

| What | Where |
|------|--------|
| Update API routes and handlers | `update-server/otupdate/common/update.py`; `update-server/otupdate/buildroot/__init__.py`, `openembedded/__init__.py` |
| Session stages and response shape | `update-server/otupdate/common/session.py` |
| Validation errors (HashMismatch, InvalidRobotType, etc.) | `update-server/otupdate/common/file_actions.py` |
| OT-2/OT-3 write and partition logic | `update-server/otupdate/buildroot/update_actions.py`, `update-server/otupdate/openembedded/update_actions.py` |
| Restart and health | `update-server/otupdate/common/control.py` |
| Tests (session flow, status codes) | `update-server/tests/common/test_update.py`; `update-server/tests/common/conftest.py` |
| Dev server (local stub) | `update-server/scripts/dev_server.py` |

---

## Validating / assumptions

The script’s behavior is aligned with the update-server API and the app’s update flow. Use the table below to check assumptions in the repo (and in `scripts/update_robot.py`, which has inline comments pointing to these paths).

| Script behavior / function | Source of truth (server) | Cross-check (app) |
|----------------------------|--------------------------|-------------------|
| GET `/health`, response shape | Robot server; this skill’s “Health Response Fields” | — |
| POST `/server/update/begin` — 201 + `token`, 409 if session active | `update-server/otupdate/common/update.py` (`begin`) | `app/src/redux/robot-update/__fixtures__/index.ts` — `mockUpdateBeginSuccess`, `mockUpdateBeginConflict` |
| POST `/server/update/cancel` — 200 | `update-server/otupdate/common/update.py` (`cancel`) | `mockUpdateCancelSuccess` |
| GET `/server/update/{token}/status` — `stage`, `message`, `progress` | `update-server/otupdate/common/session.py` (`UpdateSession.state`), `update.py` (`status`) | `mockStatusSuccess` |
| Stage strings (`awaiting-file`, `validating`, `writing`, `done`, `ready-for-restart`, `error`) | `update-server/otupdate/common/session.py` (`Stages` enum) | — |
| POST `/server/update/{token}/file` — multipart field names | `update-server/otupdate/common/update.py` (`file_upload`); `buildroot/update_actions.py` (`UPDATE_PKG_BR`), `openembedded/update_actions.py` (`UPDATE_PKG_OE`) | — |
| POST `/server/update/{token}/commit` — 200, then restart | `update-server/otupdate/common/update.py` (`commit`), `otupdate/common/control.py` (restart) | `mockCommitSuccess`; `app/src/redux/robot-update/epic.ts` (`commitUpdateEpic`) |
| 409 on begin → cancel then retry begin | Same as server contract | `app/src/redux/robot-update/epic.ts` (`createSessionEpic`) |
| Poll status until `ready-for-restart` (or `done` then commit) | Session state machine in `session.py` | `epic.ts` (`statusPollEpic`) |

---

## Health Response Fields (robot-server)

The main `/health` response includes:

- `name` — Robot display name
- `robot_model` — `"OT-2 Standard"` or `"OT-3 Standard"`
- `api_version` — Robot server software version
- `fw_version` — Motor controller firmware
- `robot_serial` — Serial number
- `system_version` — OS version
- `activeProtocolRun` — Set when a protocol is running (script warns)
- `maximum_protocol_api_version` / `minimum_protocol_api_version` — Supported Protocol API range
- `disk_details` — Available disk space
- `links` — Log paths, OpenAPI spec, system time

## Status Codes

- **200** — Robot is ready
- **503** — Robot is still initializing (motor controller or DB not ready)
- **404** on `/server/update/begin` — Update API not exposed on this firmware
- Connection refused / timeout — Robot unreachable or not running
