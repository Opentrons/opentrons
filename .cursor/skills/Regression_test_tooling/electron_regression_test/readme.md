# Electron regression tests

Playwright + pytest against the Opentrons desktop app and a connected Flex/OT-3.

## Layout

```
electron_regression_test/
  conftest.py       # robot_connection, run_local_app (session)
  Open_app.py       # launch / CDP attach helpers
  pages/            # page objects
  tests/
    nav/            # left-panel smoke (Protocols, Settings, Labware, Devices)
    device_cards/   # pipette / module / lights cards on robot detail
```

Every test uses the **`run_local_app`** session fixture: robot health check, then launch (or attach) Electron, then your test code.

## Run

From `electron_regression_test/`:

```bash
pytest                          # all tests
pytest tests/nav/               # navigation smoke only (default for main_script.py)
pytest tests/device_cards/      # hardware card exercises
pytest tests/nav/test_protocols.py -k test_protocol_opens
pytest -m smoke
pytest -m device_cards
```

Attach to an already-running app (skip launch):

```bash
ATTACH=1 pytest tests/nav/test_labware.py
```

Legacy wrapper (same as `pytest tests/nav`):

```bash
python main_script.py
python main_script.py tests/device_cards/
```

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `ROBOT_IP` | (skill default) | Wi-Fi when USB not found |
| `ROBOT_NAME` | `QA1Potato` | Robot card on Devices |
| `PROTOCOL_NAME` | Flex smoke protocol | Protocol to open in nav tests |
| `ATTACH` | — | `1` to connect over CDP without launching the app |
| `THERMOCYCLER_PREFIX` | `TC2` | Module serial prefix |
| `HEATER_SHAKER_PREFIX` | `HSV0` | Module serial prefix |
| `TEMPERATURE_MODULE_PREFIX` | `TD2` | Module serial prefix |

Robot is checked over USB first, then Wi-Fi, **before** the desktop app starts (USB port ordering).
