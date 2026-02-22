/**
 * debug_pe.mjs — Focused Protocol Engine compatibility debug script.
 *
 * Tests each compatibility layer in the shims individually so problems can
 * be pinpointed without running the full test suite.  Useful when working on
 * anyio / event-loop patches or adding new shims entry points.
 *
 * Usage (from pyodide/):
 *   make build-wheels        # only needed once / when source changes
 *   node debug_pe.mjs
 */

import { readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadPyodide } from 'pyodide'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  // ── Bootstrap ──────────────────────────────────────────────────────────────
  console.log('Loading Pyodide...')
  const pyodide = await loadPyodide()
  await pyodide.loadPackage('micropip')

  await pyodide.runPythonAsync(`
import micropip
await micropip.install("typing-extensions>=4.12.0")
for pkg in ["numpy", "pandas", "pydantic", "jsonschema", "packaging", "anyio", "click", "pydantic-settings"]:
    try: await micropip.install(pkg)
    except Exception as e: print(f"  Warning: {pkg}: {e}")
  `)

  const shimsCode = readFileSync(join(__dirname, 'opentrons_pyodide_shims.py'), 'utf-8')
  pyodide.FS.writeFile('/home/pyodide/opentrons_pyodide_shims.py', shimsCode)
  await pyodide.runPythonAsync(`
import sys; sys.path.insert(0, '/home/pyodide')
import opentrons_pyodide_shims; opentrons_pyodide_shims.install()
  `)

  const distDir = join(__dirname, 'dist')
  const wheels = readdirSync(distDir).filter(f => f.endsWith('.whl'))
  wheels.sort((a, b) => (a.includes('shared_data') ? -1 : 1))
  for (const w of wheels) {
    console.log(`  Installing ${w}...`)
    await pyodide.runPythonAsync(
      `await micropip.install("file://${join(distDir, w)}", deps=False)`
    )
  }

  await pyodide.runPythonAsync(`
import opentrons; opentrons_pyodide_shims.patch_for_pyodide()
print('opentrons', opentrons.__version__)
  `)

  // ── Step 1: anyio patches ──────────────────────────────────────────────────
  console.log('\n=== Step 1: anyio patches ===')
  await pyodide.runPythonAsync(`
import anyio.to_thread
import anyio._backends._asyncio as backend

r1 = await anyio.to_thread.run_sync(lambda: 'PUBLIC_OK')
print(f'  Public API: {r1}')

r2 = await backend.AsyncIOBackend.run_sync_in_worker_thread(lambda: 'BACKEND_OK', ())
print(f'  Backend: {r2}')

import anyio
p = anyio.Path('/home/pyodide/opentrons_pyodide_shims.py')
e = await p.exists()
print(f'  anyio.Path.exists: {e}')
  `)

  // ── Step 2: run_coroutine_threadsafe patch ─────────────────────────────────
  console.log('\n=== Step 2: run_coroutine_threadsafe patch ===')
  await pyodide.runPythonAsync(`
import asyncio
import opentrons_pyodide_shims

loop = opentrons_pyodide_shims._make_wasm_safe_loop()

async def _inner():
    await asyncio.sleep(0)
    return "BRIDGE_OK"

fut = asyncio.run_coroutine_threadsafe(_inner(), loop)
result = fut.result()
print(f'  run_coroutine_threadsafe: {result}')
loop.close()
  `)

  // ── Step 3: re-entrant loop pumping ───────────────────────────────────────
  console.log('\n=== Step 3: re-entrant loop pumping ===')
  await pyodide.runPythonAsync(`
import asyncio
import opentrons_pyodide_shims

log = []

async def test_reentrant():
    loop = asyncio.get_event_loop()
    event = asyncio.Event()

    async def background_worker():
        """Simulates QueueWorker — runs in background, processes commands."""
        log.append('worker_started')
        await event.wait()
        log.append('worker_woken')
        return 'worker_done'

    worker_task = asyncio.create_task(background_worker())
    await asyncio.sleep(0)   # let worker start

    async def async_command():
        """Simulates add_and_execute_command."""
        event.set()
        await asyncio.sleep(0)  # yield so worker runs
        log.append('command_done')
        return 'CMD_OK'

    result = opentrons_pyodide_shims._pump_until_complete(loop, async_command())
    log.append(f'pump_result={result}')

    await worker_task
    log.append('all_done')

asyncio.run(test_reentrant())
print(f'  Re-entrant pump log: {log}')
assert 'all_done' in log, f'Expected all_done in log, got {log}'
print('  Re-entrant pumping: OK')
  `)

  // ── Step 4: analyze_pyodide (raw RunResult) ────────────────────────────────
  console.log('\n=== Step 4: analyze_pyodide (raw RunResult) ===')
  const protocol19 = `
from opentrons import protocol_api
metadata = {"apiLevel": "2.19"}
def run(protocol: protocol_api.ProtocolContext):
    plate    = protocol.load_labware("corning_96_wellplate_360ul_flat", "D1")
    tiprack  = protocol.load_labware("opentrons_96_tiprack_300ul", "D2")
    pipette  = protocol.load_instrument("p300_single_gen2", "left", tip_racks=[tiprack])
    pipette.pick_up_tip()
    pipette.aspirate(100, plate["A1"])
    pipette.dispense(100, plate["B1"])
    pipette.drop_tip()
`
  pyodide.globals.set('_proto19', protocol19)
  const analyzeResult = await pyodide.runPythonAsync(`
import traceback, logging
logging.getLogger("opentrons").setLevel(logging.ERROR)

try:
    result = await opentrons_pyodide_shims.analyze_pyodide(_proto19)
    status = result.state_summary.status
    n_cmds = len(result.commands)
    n_errs = len(result.state_summary.errors)
    print(f'  Status:   {status}')
    print(f'  Commands: {n_cmds}')
    print(f'  Errors:   {n_errs}')
    for cmd in result.commands[:5]:
        print(f'    {cmd.commandType}')
    if n_cmds > 5:
        print(f'    ... and {n_cmds - 5} more')
    assert status == "succeeded", f"Expected succeeded, got {status}"
    f'OK: {status}, {n_cmds} commands'
except Exception as e:
    traceback.print_exc()
    raise
  `)
  console.log(`  Result: ${analyzeResult}`)

  // ── Step 5: analyze_pyodide_as_document (AnalyzeResults JSON) ─────────────
  console.log('\n=== Step 5: analyze_pyodide_as_document (CLI-compatible JSON) ===')
  await pyodide.runPythonAsync(`
import json, traceback

try:
    doc_json = await opentrons_pyodide_shims.analyze_pyodide_as_document(_proto19)
    doc = json.loads(doc_json)
    print(f'  result:    {doc["result"]}')
    print(f'  robotType: {doc["robotType"]}')
    print(f'  commands:  {len(doc["commands"])}')
    print(f'  createdAt: {doc["createdAt"]}')
    print(f'  config:    {doc["config"]}')
    # Verify shape matches AnalyzeResults (CLI output)
    for required in ("createdAt", "files", "config", "metadata", "result", "robotType",
                     "commands", "labware", "pipettes", "modules", "liquids",
                     "liquidClasses", "errors", "runTimeParameters", "commandAnnotations"):
        assert required in doc, f"Missing field: {required}"
    print('  All required fields present: OK')
except Exception as e:
    traceback.print_exc()
    raise
  `)

  // ── Step 6: simulate_pyodide (legacy-broker formatted log) ────────────────
  console.log('\n=== Step 6: simulate_pyodide (human-readable run log) ===')
  await pyodide.runPythonAsync(`
import traceback

try:
    log = await opentrons_pyodide_shims.simulate_pyodide(_proto19)
    print(log)
    assert "Picking up tip" in log, "Expected 'Picking up tip' in output"
    assert "Aspirating"     in log, "Expected 'Aspirating' in output"
    assert "Dispensing"     in log, "Expected 'Dispensing' in output"
    print('  simulate_pyodide: OK')
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log('\n=== ALL STEPS PASSED ===')
}

main().catch(err => {
  console.error('\nFAILED:', err.message?.split('\n').slice(0, 10).join('\n'))
  process.exit(1)
})
