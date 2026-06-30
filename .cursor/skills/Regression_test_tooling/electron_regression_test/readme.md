# Electron regression tests

Playwright + pytest against the Opentrons desktop app and a connected Flex/OT-3.

## Setup

From `electron_regression_test/`:

```bash
uv sync
uv run playwright install chromium
```

Or with pip: `pip install -e .` and `playwright install chromium`.

## Layout

```
electron_regression_test/
  conftest.py       # robot_connection, run_local_app (session)
  Open_app.py       # launch / CDP attach helpers
  pages/            # page objects
  tests/
    device_cards/   # Devices → robot detail, then pipette / module / lights cards
    nav/            # left-panel smoke (Labware, Protocols, App Settings)
```

Every test uses the **`run_local_app`** session fixture: robot health check, then launch (or attach) Electron, then your test code.

Full-suite order (when running `pytest` or `make test`):

1. `device_cards/test_devices_nav.py` — Devices list → robot detail
2. `device_cards/test_cards.py` — hardware cards on robot detail
3. `nav/test_labware.py`
4. `nav/test_protocols.py`
5. `nav/test_app_settings.py`

## Run

From `electron_regression_test/`:

```bash
pytest                          # all tests
pytest tests/nav/               # navigation smoke only (default for main_script.py)
pytest tests/device_cards/      # hardware card exercises
pytest tests/nav/test_protocols.py -k test_protocol_opens
pytest -m smoke
pytest -m device_cards

# Headed — keep the Electron window visible (bring to front before each test)
pytest --headed tests/nav/
HEADED=1 pytest tests/device_cards/

# Robot name — use flag, env, or positional (fake-robot / QA1Potato)
pytest fake-robot tests/nav/              # dev app + local robot-server (opentrons-dev)
pytest QA1Potato tests/nav/               # packaged app + real robot
pytest --robot-name QA1Potato tests/nav/
ROBOT_NAME=QA1Potato pytest tests/device_cards/
python main_script.py fake-robot tests/nav/
python main_script.py QA1Potato tests/nav/
```

Attach to an already-running app (skip launch):

```bash
ATTACH=1 pytest --headed tests/nav/test_labware.py

# Dev app must have been started with CDP enabled, e.g.:
# ELECTRON_EXTRA_ARGS="--remote-debugging-port=9222" make -C app dev OPENTRONS_PROJECT=ot3
ATTACH=1 pytest fake-robot tests/nav/
```

Legacy wrapper (same as `pytest tests/`):

```bash
python main_script.py
python main_script.py tests/nav/
python main_script.py tests/device_cards/
```

## Environment

| Variable / flag | Default | Purpose |
| --- | --- | --- |
| `ROBOT_IP` | (skill default) | Wi-Fi when USB not found |
| `ROBOT_NAME` / `--robot-name` | `QA1Potato` | Robot card on Devices (packaged app) |
| `--robot-profile` / `fake-robot` positional | — | `fake-robot`: `make -C app dev` + `make -C robot-server dev-flex`, targets `opentrons-dev` |
| `--headed` / `HEADED=1` | off | Show Electron window; bring to front each test |
| `PROTOCOL_NAME` | `Flex Smoke Test - v2.29` | Protocol to open in nav tests (first card when duplicates exist) |
| `ATTACH` | — | `1` to connect over CDP without launching the app |
| `THERMOCYCLER_PREFIX` | `TC2` | Module serial prefix |
| `HEATER_SHAKER_PREFIX` | `HSV0` | Module serial prefix |
| `TEMPERATURE_MODULE_PREFIX` | `TD2` | Module serial prefix |

Robot is checked over USB first, then Wi-Fi, **before** the desktop app starts (USB port ordering).

## Test reports and artifacts

Every pytest run writes an HTML report and per-test artifacts under `test-results/`:

| Path | Contents |
| --- | --- |
| `test-results/report.html` | Self-contained pytest-html report (open in a browser) |
| `test-results/videos/` | Per-test `.webm` screencasts (**headed** runs only; requires `ffmpeg`). `tests/device_cards/` writes one continuous `device_cards.webm` for the full suite. |
| `test-results/traces/` | Per-test Playwright trace zips (open in [trace viewer](https://trace.playwright.dev/)) |
| `test-results/screenshots/` | Full-page screenshots captured on test failure |

Example for device card review:

```bash
pytest --headed tests/device_cards/
open test-results/report.html
```

Or use the Makefile helper:

```bash
make test-device-cards-headed
```
