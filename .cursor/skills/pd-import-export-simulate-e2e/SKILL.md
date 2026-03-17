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
| Conftest: downloads + simulate path | `e2e-testing/conftest.py` — `browser_context_args` (includes `accept_downloads: True`), `_e2e_monorepo_root()`, `opentrons_simulate_path` fixture |

## Test flow (per protocol)

1. **Import**: `LandingPage` — wait for load, confirm welcome modal, click import existing, upload `protocol.path`, dismiss migration modal.
2. **Wait for editor**: Assert "Protocol Metadata" visible (protocol loaded).
3. **Export**: `ProtocolEditorPage(page).export_protocol()` → returns download path; copy to `tmp_path / f"{protocol.key}.py"`.
4. **Simulate**: Run `api/.venv/bin/opentrons_simulate` on the copied file with `cwd=monorepo_root`; assert exit code 0. Skip if `opentrons_simulate_path` does not exist.

## Markers and parametrization

- `@pytest.mark.slow` — test runs many protocols (import + export + simulate each).
- `@pytest.mark.pdE2E` — PD E2E suite.
- Parametrized over `get_protocol_fixtures()` with `ids=lambda f: f.key` (same as `test_migrate`).

## Running the test

From repo root or `e2e-testing/`:

```bash
# Prerequisites
make -C api setup                    # so opentrons_simulate exists
make -C e2e-testing test-setup        # Playwright Chromium if needed

# Run all protocol iterations
make -C e2e-testing test-pd-local PYTEST_ARGS="-k test_import_export_simulate"

# Run one protocol (example)
make -C e2e-testing test-pd-local PYTEST_ARGS="-k batchEdit"
```

If `api/.venv/bin/opentrons_simulate` is missing, the test is skipped with reason: "api venv not set up; run make -C api setup".

## Conftest details

- **`accept_downloads: True`** in `browser_context_args` is required so the Export protocol download is accepted.
- **`opentrons_simulate_path`** (session): path to `api/.venv/bin/opentrons_simulate`. Monorepo root is `opentrons_simulate_path.parent.parent.parent` (bin → .venv → api → root).

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
