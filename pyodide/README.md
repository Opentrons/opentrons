# Opentrons in Pyodide (Browser-based Python)

Run `opentrons` and `opentrons-shared-data` entirely in the browser via
[Pyodide](https://pyodide.org), enabling protocol simulation and analysis
without any server-side Python process.

## Requirements

- **[uv](https://docs.astral.sh/uv/)** and **Python 3.12** (via `scripts/python-uv.mk`).
- **Node.js** (for headless tests).

## Quick Start

Run from the **`pyodide/`** directory:

```bash
cd pyodide

# Build wheels and start the dev server (rebuilds every time)
make serve

# Open http://localhost:8080 in your browser
```

Run `make help` for all available targets.

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make build-wheels` | Build `opentrons` + `opentrons-shared-data` wheels into `dist/` |
| `make serve` | Rebuild wheels, then start the HTTP server (set `PORT=` to override 8080) |
| `make test` | Run headless Node.js/Pyodide integration tests |
| `make test-py` | Run Python unit tests (pytest, no Pyodide required) |
| `make lint` | Ruff lint + format check |
| `make format` | Ruff auto-format (writes files in place) |
| `make typecheck` | mypy type check |
| `make setup` | Install Node + Python dev dependencies |
| `make clean` | Remove `dist/` |

## How It Works

### The Problem

The `opentrons` package imports hardware-only dependencies (`pyserial`,
`aionotify`, `pyusb`, `Pyro5`) at the top level. These packages either use
native syscalls (inotify, USB, serial ports) or link to C libraries that
don't exist in WebAssembly. Simply installing the wheel in Pyodide fails at
`import opentrons`.

Additionally, the Protocol Engine path relies on several mechanisms that
assume a multi-threaded environment:

- **`anyio.to_thread.run_sync()`** — Used for file I/O and protocol
  execution, tries to create OS threads unavailable in Pyodide.
- **`ChildThreadTransport`** — Bridges sync protocol code to the async
  Protocol Engine via `asyncio.run_coroutine_threadsafe()`, which assumes
  the caller is on a different thread than the event loop.
- **`SynchronousAdapter`** — Wraps async hardware API methods for sync
  callers, also via `run_coroutine_threadsafe()`.

### The Solution

**`opentrons_pyodide_shims.py`** provides four layers of compatibility:

1. **Module stubs** (`install()`) — Before importing opentrons, injects fake
   modules into `sys.modules` for `serial`, `aionotify`, `usb`, and `Pyro5`.
   These stubs provide the classes and functions that opentrons imports but
   are no-ops in a browser context.

2. **Runtime patches** (`patch_for_pyodide()`) — Applied after importing opentrons:
   - **ThreadManager** — Replaces the background-thread-based `ThreadManager`
     with a single-threaded version using `_WasmSafeLoop`.
   - **`asyncio.run()`** — Replaces with a version that works inside Pyodide's
     already-running event loop by temporarily detaching the `WebLoop`.
   - **`anyio.to_thread.run_sync()`** — Patches both the public API and the
     `AsyncIOBackend.run_sync_in_worker_thread` classmethod to execute
     synchronously instead of spawning worker threads.
   - **`asyncio.run_coroutine_threadsafe()`** — Patches to pump the event
     loop inline when running on `_WasmSafeLoop`, instead of blocking on a
     cross-thread Future (which deadlocks in single-threaded mode).
   - **`SynchronousAdapter`** — Patches `call_coroutine_sync` to use loop
     pumping instead of `run_coroutine_threadsafe`.

3. **`_WasmSafeLoop`** — A `SelectorEventLoop` subclass that:
   - Stubs out the self-pipe mechanism (`socket.socketpair()` unavailable in WASM).
   - Overrides `run_until_complete()` to temporarily hide Pyodide's `WebLoop`.
   - Makes `_run_once()` re-entrant-safe so nested loop pumping works (needed
     when sync protocol code dispatches async commands via `ChildThreadTransport`).

4. **Entry points** — Async functions designed for Pyodide's `runPythonAsync`:
   - `analyze_pyodide(...)` — Full Protocol Engine analysis returning `RunResult`.
   - `simulate_pyodide(...)` — Human-readable formatted run log.

### Compatibility Matrix

| API Level | Path | Status |
|-----------|------|--------|
| < 2.14 | Legacy (non-Protocol Engine) | Works via `opentrons.simulate.simulate()` |
| >= 2.14 | Protocol Engine | Works via `analyze_pyodide()` / `simulate_pyodide()` |

## API

### `analyze_pyodide(protocol_text, file_name, labware_files, csv_file)`

Async function that runs full Protocol Engine analysis.

```python
result = await opentrons_pyodide_shims.analyze_pyodide(
    protocol_text,                        # str: full protocol source
    file_name="protocol.py",              # str: used for type detection
    labware_files=[("my.json", text)],   # list of (name, content) tuples
    csv_file=("transfers.csv", csv_text), # optional (name, content) tuple
)

# result is a RunResult NamedTuple:
result.commands           # List[Command] — all executed commands
result.state_summary      # StateSummary — status, labware, pipettes, errors
result.parameters         # List[RunTimeParameter]
result.command_annotations
result.command_preconditions
```

When a `csv_file` is provided, a two-stage load is performed: the protocol
is loaded once to discover the CSV parameter's `variableName`, then the
orchestrator is recreated and loaded again with `run_time_param_paths` set.

### `simulate_pyodide(protocol_text, file_name, labware_files, csv_file)`

Convenience wrapper around `analyze_pyodide` that returns a formatted string.

```python
output = await opentrons_pyodide_shims.simulate_pyodide(protocol_text)
print(output)
```

## Files

| File | Purpose |
|------|---------|
| `Makefile` | All dev tasks — build, serve, test, lint, format, typecheck |
| `opentrons_pyodide_shims.py` | Stub modules, runtime patches, and Pyodide entry points |
| `serve.py` | Local HTTP server with CORS + COOP/COEP headers, routes protocol files |
| `index.html` | Browser UI: file upload flow → loading screen → analysis/simulation results |
| `test_pyodide.mjs` | Node.js headless integration tests (7 test cases) |
| `debug_pe.mjs` | Focused Protocol Engine debugging script |
| `generate_manifest.py` | Writes `dist/manifest.json` listing built wheel files |
| `pyproject.toml` | Python project config: ruff, mypy, pytest settings |
| `fixtures/` | Pyodide-specific test protocols (CSV RTP, custom labware) |
| `tests/` | Python unit tests for the shims (pytest, no Pyodide required) |
| `dist/` | Built wheel files (git-ignored, recreated by `make build-wheels`) |

## Testing

### Python unit tests (fast, no Pyodide)

```bash
make test-py
```

Tests the stub-building helpers and WASM compatibility primitives in
`opentrons_pyodide_shims.py` (48 tests, runs in < 1s).

### Node.js headless integration tests

```bash
make test
# or: make setup && node test_pyodide.mjs
```

Runs 7 end-to-end test cases through full Pyodide + opentrons analysis:

1. Legacy simulation (apiLevel 2.13) via `opentrons.simulate.simulate()`
2. `analyze_pyodide()` — inline protocol, Protocol Engine, apiLevel 2.19
3. `simulate_pyodide()` — formatted output, same protocol
4. Real OT-2 protocol (`OT2_S_v2_20_P300M_Simple.py`)
5. Real Flex protocol (`Flex_S_v2_20_1000M_Simple.py`)
6. CSV Runtime Parameter protocol (`Flex_S_v2_20_P1000_csv_rtp_simple.py`)
7. Custom labware protocol (`Flex_S_v2_20_P1000_custom_labware_simple.py`)

### Browser

```bash
make serve  # builds wheels, then starts server
# Open http://localhost:8080
```

The UI provides a file-upload flow:
- Upload a protocol file (`.py` or `.json`)
- Optionally upload custom labware files (`.json`)
- Toggle on "RTP CSV" to upload a CSV runtime parameter file
- Click **Validate** → loading screen → side-by-side **Analysis** (JSON) and **Simulation** (run log)

Analysis output can be copied to clipboard or saved as a `.json` file.

## Architecture Notes

### Threading & Event Loop

Pyodide is single-threaded. The opentrons codebase assumes multi-threaded
operation for the Protocol Engine:

```
Normal architecture:

  Main thread (event loop)          Worker thread
  ┌──────────────────────┐         ┌─────────────────────┐
  │ ProtocolEngine       │         │ run_protocol()      │
  │ QueueWorker (task)   │◄────────│ user code           │
  │ CommandExecutor      │  RCTS   │ ChildThreadTransport│
  └──────────────────────┘         └─────────────────────┘
        RCTS = asyncio.run_coroutine_threadsafe()

Pyodide architecture (everything on one thread):

  Main thread
  ┌────────────────────────────────────────────────┐
  │ _WasmSafeLoop                                  │
  │ ┌──────────────────────┐                       │
  │ │ ProtocolEngine       │                       │
  │ │ QueueWorker (task)   │                       │
  │ │ CommandExecutor      │                       │
  │ └──────────────────────┘                       │
  │ ┌──────────────────────┐                       │
  │ │ run_protocol() sync  │──► _pump_until_complete│
  │ │ ChildThreadTransport │    (pumps loop inline) │
  │ └──────────────────────┘                       │
  └────────────────────────────────────────────────┘
```

Key patches:
- **`to_thread.run_sync`** — `run_protocol()` runs inline instead of in a worker thread
- **`run_coroutine_threadsafe`** — Instead of scheduling on a different thread's loop
  and blocking, `_pump_until_complete` manually drives `_run_once()` to interleave
  the Protocol Engine's concurrent tasks
- **Re-entrant `_run_once`** — Guards against items being consumed by nested calls
  when sync code pumps the loop from within a running callback
- **Current-task clearing** — Temporarily clears `_current_tasks` to allow nested
  task steps during loop pumping

### File System

Pyodide provides an in-memory virtual filesystem. The opentrons-shared-data
wheel includes JSON definition files (labware, pipettes, modules, etc.) that
are extracted into this virtual filesystem when the wheel is installed via
micropip.

### Package Sizes

| Package | Wheel Size | Notes |
|---------|-----------|-------|
| opentrons-shared-data | ~1.2 MB | Mostly JSON definitions |
| opentrons | ~1.8 MB | Python source |
| numpy (Pyodide built-in) | ~7 MB | WASM build |
| pydantic (via micropip) | ~2 MB | pydantic-core has WASM build |

Total download for initialization is approximately 15–20 MB.

## Known Limitations

- **No real hardware**: All hardware interactions are simulated. Serial ports,
  USB devices, and GPIO pins are stubbed out.
- **Performance**: First analysis takes longer due to JIT warmup and module
  loading. Subsequent analyses are faster (~0.04s).
- **Module support**: Module hardware (thermocycler, magnetic module, etc.)
  works in simulation but temperature/magnetic simulations are no-ops.
- **Single-threaded**: All operations run synchronously on the main thread.
  Protocol execution that would normally run in a worker thread runs inline.
