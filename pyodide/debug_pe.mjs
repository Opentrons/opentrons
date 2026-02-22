import { loadPyodide } from "pyodide";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("Loading Pyodide...");
  const pyodide = await loadPyodide();
  await pyodide.loadPackage("micropip");

  await pyodide.runPythonAsync(`
import micropip
await micropip.install("typing-extensions>=4.12.0")
for pkg in ["numpy", "pydantic", "jsonschema", "packaging", "anyio", "click"]:
    try: await micropip.install(pkg)
    except: pass
try: await micropip.install("pydantic-settings")
except: pass
  `);

  const shimsCode = readFileSync(join(__dirname, "opentrons_pyodide_shims.py"), "utf-8");
  pyodide.FS.writeFile("/home/pyodide/opentrons_pyodide_shims.py", shimsCode);
  await pyodide.runPythonAsync(`
import sys; sys.path.insert(0, '/home/pyodide')
import opentrons_pyodide_shims; opentrons_pyodide_shims.install()
  `);

  const distDir = join(__dirname, "dist");
  const wheels = readdirSync(distDir).filter(f => f.endsWith(".whl"));
  wheels.sort((a, b) => a.includes("shared_data") ? -1 : 1);
  for (const w of wheels) {
    const wheelPath = join(distDir, w);
    console.log(`  Installing ${w}...`);
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("file://${wheelPath}", deps=False)
    `);
  }

  await pyodide.runPythonAsync(`
import opentrons; opentrons_pyodide_shims.patch_for_pyodide()
print('opentrons', opentrons.__version__)
  `);

  // Step 1: Test anyio patches
  console.log("\n=== Step 1: Test anyio patches ===");
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
  `);

  // Step 2: Test run_coroutine_threadsafe patch
  console.log("\n=== Step 2: Test run_coroutine_threadsafe patch ===");
  await pyodide.runPythonAsync(`
import asyncio
import opentrons_pyodide_shims

# Simulate what ChildThreadTransport does:
# - Create a _WasmSafeLoop
# - Schedule a coroutine via run_coroutine_threadsafe
# - Call .result() on the future (should NOT deadlock)

loop = opentrons_pyodide_shims._make_wasm_safe_loop()

async def _inner():
    await asyncio.sleep(0)
    return "BRIDGE_OK"

# Our patched version should pump the loop instead of deadlocking
fut = asyncio.run_coroutine_threadsafe(_inner(), loop)
result = fut.result()
print(f'  run_coroutine_threadsafe: {result}')
loop.close()
  `);

  // Step 3: Test re-entrant loop pumping (the key scenario)
  console.log("\n=== Step 3: Test re-entrant loop pumping ===");
  await pyodide.runPythonAsync(`
import asyncio
import opentrons_pyodide_shims

# Simulate the real PE architecture:
# - _WasmSafeLoop is running a task (like TaskQueue._run)
# - That task calls sync code (like run_protocol)
# - Sync code calls run_coroutine_threadsafe to dispatch async work
# - The pumping mechanism must interleave with existing loop tasks

log = []

async def test_reentrant():
    loop = asyncio.get_event_loop()
    event = asyncio.Event()
    
    async def background_worker():
        """Simulates QueueWorker - runs in background, processes commands."""
        log.append('worker_started')
        await event.wait()
        log.append('worker_woken')
        return 'worker_done'
    
    worker_task = asyncio.create_task(background_worker())
    await asyncio.sleep(0)  # let worker start
    
    # Simulate sync protocol code calling run_coroutine_threadsafe
    async def async_command():
        """Simulates add_and_execute_command."""
        event.set()  # wake the worker
        await asyncio.sleep(0)  # yield so worker runs
        log.append('command_done')
        return 'CMD_OK'
    
    # This is what ChildThreadTransport does: schedule async work, pump loop
    result = opentrons_pyodide_shims._pump_until_complete(loop, async_command())
    log.append(f'pump_result={result}')
    
    await worker_task
    log.append('all_done')

asyncio.run(test_reentrant())
print(f'  Re-entrant pump: {log}')
assert 'all_done' in log, f'Expected all_done in log, got {log}'
print('  Re-entrant pumping: OK')
  `);

  // Step 4: Test analyze_pyodide (the real deal!)
  console.log("\n=== Step 4: Test analyze_pyodide ===");
  const analyzeResult = await pyodide.runPythonAsync(`
import traceback, logging
logging.getLogger("opentrons").setLevel(logging.ERROR)

protocol_text = '''
from opentrons import protocol_api
metadata = {"apiLevel": "2.19"}
def run(protocol: protocol_api.ProtocolContext):
    plate = protocol.load_labware("corning_96_wellplate_360ul_flat", "D1")
    tiprack = protocol.load_labware("opentrons_96_tiprack_300ul", "D2")
    pipette = protocol.load_instrument("p300_single_gen2", "left", tip_racks=[tiprack])
    pipette.pick_up_tip()
    pipette.aspirate(100, plate["A1"])
    pipette.dispense(100, plate["B1"])
    pipette.drop_tip()
'''

try:
    result = await opentrons_pyodide_shims.analyze_pyodide(protocol_text)
    status = result.state_summary.status
    n_cmds = len(result.commands)
    n_errs = len(result.state_summary.errors)
    print(f'  Status: {status}')
    print(f'  Commands: {n_cmds}')
    print(f'  Errors: {n_errs}')
    for cmd in result.commands[:5]:
        print(f'    {cmd.commandType}')
    if n_cmds > 5:
        print(f'    ... and {n_cmds - 5} more')
    f'OK: {status}, {n_cmds} commands'
except Exception as e:
    traceback.print_exc()
    raise
  `);
  console.log(`  Result: ${analyzeResult}`);

  console.log("\n=== ALL STEPS PASSED ===");
}

main().catch(err => {
  console.error("\nFAILED:", err.message?.split("\n").slice(0, 10).join("\n"));
  process.exit(1);
});
