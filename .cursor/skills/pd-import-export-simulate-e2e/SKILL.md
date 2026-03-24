---
name: pd-import-export-simulate-e2e
description: E2E test that imports protocol fixtures in Protocol Designer, exports as Python, and runs opentrons_simulate. Use when modifying, extending, or debugging this test or when adding similar import-export-simulate flows.
---

# PD Import / Export / Simulate E2E Test

## Purpose

Validates that (a) Protocol Designer can import and export all migration protocol fixtures without crashing, and (b) the exported Python runs under the API simulator (`opentrons_simulate`).

## Where the code lives

| What | Path |
|------|------|
| Test | `e2e-testing/tests/pd/test_pd_import_export_simulate.py` |
| Protocol fixtures (same set as `test_migrate`) | `e2e-testing/protocols.py` → `get_protocol_fixtures()`; files under `e2e-testing/fixtures/protocol/<version>/` and `fixtures/protocol/for_snapshots/` |
| PD page objects used | `e2e-testing/automation/pd_pages/` — `LandingPage`, `ProtocolEditorPage` (export) |
| Conftest: downloads + simulate path | `e2e-testing/conftest.py` — `browser_context_args` (includes `accept_downloads: True`), `e2e_monorepo_root`, `opentrons_simulate_path` fixtures |

## Test flow (per protocol)

1. **Import**: `LandingPage` — wait for load, confirm welcome modal, click import existing, upload `protocol.path`, dismiss migration modal.
2. **Wait for editor**: Assert "Protocol Metadata" visible (protocol loaded).
3. **Export**: `ProtocolEditorPage(page).export_protocol()` → returns download path; copy to `tmp_path / f"{protocol.key}.py"`.
4. **Simulate**: Run `api/.venv/bin/opentrons_simulate` on the copied file with `cwd=e2e_monorepo_root` (monorepo checkout root, parent of `e2e-testing/`); assert exit code 0. Skip if `opentrons_simulate_path` does not exist.

## Markers and fixture selection

- `@pytest.mark.slow` — test runs many protocols (import + export + simulate each).
- `@pytest.mark.pdE2E` — PD E2E suite.
- One browser session loops all fixtures (faster than per-fixture parametrization). Narrow with:
  - `PD_PROTOCOL_FIXTURE_KEY` — single stem (e.g. `batchEdit`).
  - `PD_PROTOCOL_FIXTURE_KEYS` — comma-separated stems.
- Disable Playwright video encoding for bulk runs: `PW_E2E_RECORD_VIDEO=false` (or `make test-pd-simulate-fast`).

## Running the test

From repo root or `e2e-testing/`:

```bash
# Prerequisites
make -C api setup                    # so opentrons_simulate exists
make -C e2e-testing test-setup        # Playwright Chromium if needed

# Run all protocol iterations (preferred)
make -C e2e-testing test-pd-simulate

# Equivalent (full PD suite filter)
make -C e2e-testing test-pd-local PYTEST_ARGS="-k test_import_export_simulate"

# Run one protocol (example)
make -C e2e-testing test-pd-simulate PD_PROTOCOL_FIXTURE_KEY=batchEdit

# Faster bulk run (no per-test video files)
make -C e2e-testing test-pd-simulate-fast
```

If `api/.venv/bin/opentrons_simulate` is missing, the test is skipped with reason: "api venv not set up; run make -C api setup".

## Conftest details

- **`accept_downloads: True`** in `browser_context_args` is required so the Export protocol download is accepted.
- **`e2e_monorepo_root`** (session): monorepo checkout root (`e2e-testing/`’s parent). Used as simulate `cwd` so the run matches the branch tree.
- **`opentrons_simulate_path`** (session): `e2e_monorepo_root / api/.venv/bin/opentrons_simulate`.

## Edge cases

- **RTP protocols**: `opentrons_simulate` cannot run protocols that use `add_parameters()`. The test runs simulate anyway; known RTP fixtures may fail until we add skips or use `opentrons analyze` for them.
- **Export failure**: If Export button never enables or download times out, the test fails at that step.
- **CI**: Ensure `make -C api setup` (or equivalent) runs before this test if you want simulate to run; otherwise the test will skip.

## When modifying this test

**Update this skill** when you:

- Change the test flow (import, export, or simulate steps).
- Add or remove conftest fixtures used by the test (`opentrons_simulate_path`, `browser_context_args`).
- Change how protocol fixtures are selected or where they live.
- Add RTP handling, analyze fallback, or different skip logic.

Keep the "Where the code lives" table and "Test flow" section in sync with the implementation.
