---
name: protocol-verification
description: Simulate and analyze Opentrons protocols to verify correctness. Use when asked to verify, simulate, analyze, validate, or check a protocol, or when needing to confirm a newly created protocol works.
---

# Protocol Verification — Simulate & Analyze

After creating or modifying a protocol, verify it using the binaries in `api/.venv/bin/`. All commands run from the **monorepo root**.

## Prerequisites

The `api/` venv must exist. If it doesn't (first time, or after teardown):

```bash
make -C api setup
```

This creates `api/.venv/` with all entry points installed. You only need to do this once.

## Entry Points

| Tool     | Binary                                          | Notes                                 |
| -------- | ----------------------------------------------- | ------------------------------------- |
| Simulate | `api/.venv/bin/opentrons_simulate`              | Registered script entry point         |
| Analyze  | `api/.venv/bin/python -m opentrons.cli analyze` | Module command — no standalone binary |

> **Do not use `uv run`** for one-off simulate/analyze calls. It checks and potentially rebuilds the venv on every invocation, adding significant latency. Call the venv binaries directly.

## Working Directories

All local dev artifacts are gitignored and live at the monorepo root:

| Directory             | Purpose                            |
| --------------------- | ---------------------------------- |
| `tmp-protocols/`      | Protocol `.py` files               |
| `tmp-custom-labware/` | Custom labware `.json` definitions |
| `tmp-csv/`            | CSV files for RTP inputs           |

## Simulation

Produces a **human-readable runlog** of every command the robot would execute. Use for quick validation.

> **⛔ RTP protocols cannot be simulated.** `opentrons_simulate` has no `--rtp-values` or `--rtp-files` flag. If the protocol defines `add_parameters()` (any RTP — including CSV, int, bool, str, or float), **you must tell the user this upfront and use `opentrons analyze` instead.** Do not attempt to simulate an RTP protocol and let it fail; explain the limitation first, then switch to analyze automatically.

```bash
# Standard
api/.venv/bin/opentrons_simulate tmp-protocols/my_protocol.py

# With custom labware (can be specified multiple times)
api/.venv/bin/opentrons_simulate tmp-protocols/my_protocol.py \
    -L tmp-custom-labware/
```

The current working directory is **always** searched for custom labware implicitly.

### Simulation Options

| Flag                          | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `-l`, `--log-level`           | `debug`, `info`, `warning` (default), `error`, `none` |
| `-L`, `--custom-labware-path` | Directory to search for custom labware (repeatable)   |
| `-e`, `--estimate-duration`   | Estimate protocol run time (experimental)             |
| `-o`, `--output`              | `runlog` (default) or `nothing`                       |

### Interpreting Results

- **Success**: runlog prints, exit code 0
- **Failure**: Python traceback with error message, exit code 1

Common errors:

- `DeckConflictError` — labware placement conflict
- `LabwareDefinitionDoesNotExist` — invalid labware name
- `OutOfTipsError` — not enough tips for the protocol
- `LiquidHeightUnknownError` — `.meniscus()` called on a well without `load_liquid()` — see `reference-source-map.md`
- `IncompatibleAddressableAreaError` — wrong slot for robot type

## Analysis

Produces **structured JSON** with predicted commands, labware layout, pipettes, modules, and errors. Use for deep inspection or CI validation. Also the only way to verify protocols with CSV RTPs.

```bash
# Standard
api/.venv/bin/python -m opentrons.cli analyze tmp-protocols/my_protocol.py \
    --check --human-json-output=-

# With custom labware — pass the JSON file(s) as extra positional arguments
api/.venv/bin/python -m opentrons.cli analyze \
    tmp-protocols/my_protocol.py \
    tmp-custom-labware/my_custom_plate.json \
    --check --json-output=-

# With primitive RTP values (int, float, bool, str)
api/.venv/bin/python -m opentrons.cli analyze tmp-protocols/my_protocol.py \
    --check --json-output=- \
    --rtp-values='{"sample_count": 8, "dry_run": false}'

# With CSV RTP file
api/.venv/bin/python -m opentrons.cli analyze tmp-protocols/my_protocol.py \
    --check --json-output=- \
    --rtp-files='{"transfer_map": "tmp-csv/transfer_map.csv"}'

# Combined: custom labware + CSV RTP
api/.venv/bin/python -m opentrons.cli analyze \
    tmp-protocols/my_protocol.py \
    tmp-custom-labware/my_custom_plate.json \
    --check --json-output=- \
    --rtp-files='{"transfer_map": "tmp-csv/transfer_map.csv"}'
```

### Analysis Options

| Flag                       | Description                                                         |
| -------------------------- | ------------------------------------------------------------------- |
| `--json-output=FILE`       | Machine-readable JSON (`-` for stdout)                              |
| `--human-json-output=FILE` | Pretty-printed JSON (`-` for stdout)                                |
| `--check`                  | Exit non-zero if protocol has errors                                |
| `--rtp-values=JSON`        | Primitive RTP values as JSON string (`int`, `float`, `bool`, `str`) |
| `--rtp-files=JSON`         | CSV RTP file paths as JSON string — keys are `variable_name`s       |
| `--log-output=PATH`        | Log destination (`-` stdout, `stderr` default, or file path)        |
| `--log-level`              | `DEBUG`, `INFO`, `WARNING` (default), `ERROR`                       |

> **Custom labware in analyze**: there is no `-L` flag. Pass each labware JSON as an extra positional file argument. The `analyze` command recognizes them by their JSON schema and registers them before running.

### JSON Output Structure

```json
{
  "createdAt": "...",
  "result": "ok",
  "robotType": "OT-3",
  "config": {"protocolType": "python", "apiVersion": [2, 28]},
  "metadata": {"protocolName": "..."},
  "commands": [...],
  "labware": [...],
  "pipettes": [...],
  "modules": [...],
  "liquids": [...],
  "errors": [],
  "runTimeParameters": [...]
}
```

Key fields: `result` (`"ok"` / `"not-ok"` / `"parameter-value-required"`), `errors` (empty = valid), `commands` (full ordered command list).

### With Runtime Parameters

```bash
api/.venv/bin/python -m opentrons.cli analyze protocol.py \
    --check --json-output=output.json \
    --rtp-values='{"sample_count": 48, "dry_run": false}'

# CSV parameter files
api/.venv/bin/python -m opentrons.cli analyze protocol.py \
    --check --json-output=output.json \
    --rtp-files='{"plate_map": "/path/to/map.csv"}'
```

## Standard Verification Workflow

**Before running anything**, check whether the protocol defines `add_parameters()`. If it does, skip simulate entirely and go straight to analyze — then tell the user why.

```bash
# 1. Quick check — simulate (only if protocol has NO add_parameters())
api/.venv/bin/opentrons_simulate tmp-protocols/my_protocol.py

# 1b. Quick check — simulate with custom labware (still no RTPs)
api/.venv/bin/opentrons_simulate tmp-protocols/my_protocol.py \
    -L tmp-custom-labware/

# 2. Deep check — analyze (required for any protocol with add_parameters())
api/.venv/bin/python -m opentrons.cli analyze \
    tmp-protocols/my_protocol.py \
    [tmp-custom-labware/my_plate.json] \
    --check --human-json-output=- \
    [--rtp-values='{"key": value}'] \
    [--rtp-files='{"csv_param": "tmp-csv/file.csv"}']
```

**Decision guide:**

| Scenario                                 | Use                          | Agent behavior                                                                                                          |
| ---------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| No RTPs, no custom labware               | simulate                     | Run simulate directly                                                                                                   |
| Custom labware only                      | simulate with `-L`           | Run simulate directly                                                                                                   |
| **Any RTP** (`add_parameters()` present) | **analyze only**             | **Tell the user: "`opentrons_simulate` cannot run RTP protocols — switching to `opentrons analyze`"**, then run analyze |
| Custom labware + any RTP                 | analyze with extra JSON args | Same — explain, then analyze                                                                                            |

## Snapshot Testing Integration

For Flex protocols to be tracked for regression, use `analyses-snapshot-testing/` (Flex-only in this repository):

```bash
cd analyses-snapshot-testing/

# Naming: {Robot}_{Status}_{Version}_{Pipettes}_{Modules}_{Description}.py
# Example: Flex_S_v2_28_P1000_GRIP_SerialDilution.py

make prep
make snapshot-test-update PROTOCOL_NAMES=Flex_S_v2_28_P1000_GRIP_SerialDilution OVERRIDE_PROTOCOL_NAMES=none
```

See the `analyses-snapshot-testing` skill for full details.

## Keeping This Skill Current

When simulate or analyze surfaces a new error pattern, constraint, or CLI behavior that isn't already documented here, **add it to the Troubleshooting section** or update the relevant command example. The next person hitting the same issue will thank you.

## Troubleshooting

### `api/.venv/` doesn't exist

```bash
make -C api setup
```

### Simulation succeeds but analysis shows errors

Analysis is stricter. Check the `errors` array in JSON output for details.

### Protocol works in simulation but fails on robot

Simulation doesn't verify physical constraints: actual tip presence, liquid volumes, module calibration, or physical deck geometry.

### Slow runs

If you accidentally used `uv run` instead of the venv binaries, it checks/rebuilds the venv each time. Switch to `api/.venv/bin/...` for instant invocations.
