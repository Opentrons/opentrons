/**
 * Headless test of opentrons in Pyodide (Node.js).
 *
 * Uses the Pyodide Node.js package to verify the full import + simulate flow
 * without needing a browser.
 *
 * Usage:
 *   npx pyodide node test_pyodide.mjs
 *   # or:
 *   npm install pyodide && node test_pyodide.mjs
 */

import { readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { loadPyodide } from 'pyodide'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  console.log('=== Opentrons Pyodide Test ===\n')

  const t0 = performance.now()
  console.log('Loading Pyodide...')
  const pyodide = await loadPyodide()
  console.log(
    `Pyodide loaded in ${((performance.now() - t0) / 1000).toFixed(1)}s`
  )

  await pyodide.loadPackage('micropip')

  console.log('Installing base packages...')
  await pyodide.runPythonAsync(`
import micropip

# Install typing-extensions first with a newer version to satisfy pydantic-settings
await micropip.install("typing-extensions>=4.12.0")

for pkg in ["numpy", "pandas", "pydantic", "jsonschema", "packaging", "anyio", "click"]:
    try:
        await micropip.install(pkg)
    except Exception as e:
        print(f"  Warning: {pkg}: {e}")

# pydantic-settings needs typing-extensions>=4.12 - install separately
try:
    await micropip.install("pydantic-settings")
except Exception as e:
    print(f"  Warning: pydantic-settings: {e}")
    try:
        await micropip.install("pydantic-settings>=2,<3")
    except Exception as e2:
        print(f"  Warning: pydantic-settings retry: {e2}")
  `)

  // Load shims
  console.log('Loading hardware stubs...')
  const shimsCode = readFileSync(
    join(__dirname, 'opentrons_pyodide_shims.py'),
    'utf-8'
  )
  pyodide.FS.writeFile('/home/pyodide/opentrons_pyodide_shims.py', shimsCode)
  await pyodide.runPythonAsync(`
import sys
sys.path.insert(0, '/home/pyodide')
import opentrons_pyodide_shims
opentrons_pyodide_shims.install()
  `)

  // Install wheels from local dist/ directory
  console.log('Installing opentrons wheels...')
  const distDir = join(__dirname, 'dist')
  const wheels = readdirSync(distDir).filter(f => f.endsWith('.whl'))

  wheels.sort((a, b) => {
    if (a.includes('shared_data')) return -1
    if (b.includes('shared_data')) return 1
    return 0
  })

  for (const wheel of wheels) {
    const wheelPath = join(distDir, wheel)
    console.log(`  Installing ${wheel}...`)
    await pyodide.runPythonAsync(`
import micropip
await micropip.install("file://${wheelPath}", deps=False)
    `)
  }

  // Import and patch
  console.log('Importing opentrons...')
  const version = await pyodide.runPythonAsync(`
import opentrons
opentrons_pyodide_shims.patch_for_pyodide()
opentrons.__version__
  `)
  console.log(`  opentrons version: ${version}`)

  // -----------------------------------------------------------------------
  // Test 1: Legacy path (apiLevel 2.13)
  // -----------------------------------------------------------------------
  console.log('\n--- Test 1: Legacy path (apiLevel 2.13) ---')
  const t1 = performance.now()

  const result1 = await pyodide.runPythonAsync(`
import io, logging
logging.getLogger("opentrons").setLevel(logging.ERROR)
from opentrons.simulate import simulate, format_runlog

protocol_legacy = '''
from opentrons import protocol_api
metadata = {"apiLevel": "2.13"}
def run(protocol: protocol_api.ProtocolContext):
    plate = protocol.load_labware("corning_96_wellplate_360ul_flat", "1")
    tiprack = protocol.load_labware("opentrons_96_tiprack_300ul", "2")
    pipette = protocol.load_instrument("p300_single", "left", tip_racks=[tiprack])
    pipette.pick_up_tip()
    pipette.aspirate(100, plate["A1"])
    pipette.dispense(100, plate["B1"])
    pipette.drop_tip()
'''

f = io.StringIO(protocol_legacy)
runlog, _bundle = simulate(f, file_name='protocol.py')
format_runlog(runlog)
  `)

  console.log(
    `Legacy simulation (${((performance.now() - t1) / 1000).toFixed(2)}s):`
  )
  console.log(result1)
  console.log('PASS: Legacy path works\n')

  // -----------------------------------------------------------------------
  // Test 2: analyze_pyodide — Protocol Engine path (apiLevel 2.19)
  // -----------------------------------------------------------------------
  console.log('--- Test 2: analyze_pyodide (PE path, apiLevel 2.19) ---')
  const t2 = performance.now()

  await pyodide.runPythonAsync(`
import traceback, logging
logging.getLogger("opentrons").setLevel(logging.ERROR)

protocol_pe = '''
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
    result = await opentrons_pyodide_shims.analyze_pyodide(protocol_pe)
    print(f"Status: {result.state_summary.status}")
    print(f"Commands: {len(result.commands)}")
    print(f"Errors: {len(result.state_summary.errors)}")
    if result.state_summary.errors:
        for err in result.state_summary.errors:
            print(f"  Error: {err.errorType}: {err.detail}")
    for cmd in result.commands:
        print(f"  {cmd.commandType}")
    assert result.state_summary.status == "succeeded", f"Expected succeeded, got {result.state_summary.status}"
    assert len(result.commands) > 0, "Expected at least one command"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `analyze_pyodide completed in ${((performance.now() - t2) / 1000).toFixed(2)}s`
  )
  console.log('PASS: analyze_pyodide works\n')

  // -----------------------------------------------------------------------
  // Test 3: simulate_pyodide — formatted output
  // -----------------------------------------------------------------------
  console.log('--- Test 3: simulate_pyodide (formatted output) ---')
  const t3 = performance.now()

  const result3 = await pyodide.runPythonAsync(`
protocol_sim = '''
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
    sim_output = await opentrons_pyodide_shims.simulate_pyodide(protocol_sim)
    print(sim_output)
    # simulate_pyodide now returns the same format as opentrons_simulate:
    # a plain action log with no header, matching format_runlog() output.
    assert "Picking up tip" in sim_output, "Expected 'Picking up tip' in output"
    assert "Aspirating" in sim_output, "Expected 'Aspirating' in output"
    assert "Dispensing" in sim_output, "Expected 'Dispensing' in output"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `simulate_pyodide completed in ${((performance.now() - t3) / 1000).toFixed(2)}s`
  )
  console.log('PASS: simulate_pyodide works\n')

  // -----------------------------------------------------------------------
  // Test 4: Real OT-2 smoke protocol (OT2_S_v2_20_P300M_Simple.py)
  // -----------------------------------------------------------------------
  console.log('--- Test 4: Real OT-2 protocol (P300M Simple v2.20) ---')
  const ot2Proto = readFileSync(
    join(
      __dirname,
      '..',
      'analyses-snapshot-testing',
      'files',
      'protocols',
      'OT2_S_v2_20_P300M_Simple.py'
    ),
    'utf-8'
  )
  pyodide.globals.set('_ot2_proto', ot2Proto)
  const t4 = performance.now()

  await pyodide.runPythonAsync(`
try:
    result = await opentrons_pyodide_shims.analyze_pyodide(_ot2_proto, "OT2_S_v2_20_P300M_Simple.py")
    print(f"Status: {result.state_summary.status}")
    print(f"Commands: {len(result.commands)}")
    print(f"Errors: {len(result.state_summary.errors)}")
    if result.state_summary.errors:
        for err in result.state_summary.errors:
            print(f"  Error: {err.errorType}: {err.detail}")
    assert result.state_summary.status == "succeeded", f"Expected succeeded, got {result.state_summary.status}"
    assert len(result.commands) > 0, "Expected at least one command"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `OT-2 Simple completed in ${((performance.now() - t4) / 1000).toFixed(2)}s`
  )
  console.log('PASS: Real OT-2 protocol works\n')

  // -----------------------------------------------------------------------
  // Test 5: Real Flex protocol (Flex_S_v2_20_1000M_Simple.py)
  // -----------------------------------------------------------------------
  console.log('--- Test 5: Real Flex protocol (8ch 1000 Simple v2.20) ---')
  const flexProto = readFileSync(
    join(
      __dirname,
      '..',
      'analyses-snapshot-testing',
      'files',
      'protocols',
      'Flex_S_v2_20_1000M_Simple.py'
    ),
    'utf-8'
  )
  pyodide.globals.set('_flex_proto', flexProto)
  const t5 = performance.now()

  await pyodide.runPythonAsync(`
try:
    result = await opentrons_pyodide_shims.analyze_pyodide(_flex_proto, "Flex_S_v2_20_1000M_Simple.py")
    print(f"Status: {result.state_summary.status}")
    print(f"Commands: {len(result.commands)}")
    print(f"Errors: {len(result.state_summary.errors)}")
    if result.state_summary.errors:
        for err in result.state_summary.errors:
            print(f"  Error: {err.errorType}: {err.detail}")
    assert result.state_summary.status == "succeeded", f"Expected succeeded, got {result.state_summary.status}"
    assert len(result.commands) > 0, "Expected at least one command"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `Flex Simple completed in ${((performance.now() - t5) / 1000).toFixed(2)}s`
  )
  console.log('PASS: Real Flex protocol works\n')

  // -----------------------------------------------------------------------
  // Test 6: CSV RTP (Flex_S_v2_20_P1000_csv_rtp_simple.py)
  // -----------------------------------------------------------------------
  console.log('--- Test 6: CSV RTP protocol (Flex, v2.20) ---')

  const csvProto = readFileSync(
    join(__dirname, 'fixtures', 'Flex_S_v2_20_P1000_csv_rtp_simple.py'),
    'utf-8'
  )
  const csvContents = readFileSync(
    join(__dirname, 'fixtures', 'transfers_simple.csv'),
    'utf-8'
  )

  pyodide.globals.set('_csv_proto', csvProto)
  pyodide.globals.set('_csv_contents', csvContents)
  const t6 = performance.now()

  await pyodide.runPythonAsync(`
try:
    result = await opentrons_pyodide_shims.analyze_pyodide(
        _csv_proto,
        "Flex_S_v2_20_P1000_csv_rtp_simple.py",
        labware_files=[],
        csv_file=("transfers.csv", _csv_contents),
    )
    print(f"Status: {result.state_summary.status}")
    print(f"Commands: {len(result.commands)}")
    print(f"Errors: {len(result.state_summary.errors)}")
    if result.state_summary.errors:
        for err in result.state_summary.errors:
            print(f"  Error: {err.errorType}: {err.detail}")
    # Expect 4 pick_up_tip + 4 aspirate + 4 dispense + 4 drop_tip + overhead commands
    transfer_cmds = [c for c in result.commands if c.commandType in ("aspirate", "dispense")]
    print(f"Transfer commands (aspirate+dispense): {len(transfer_cmds)}")
    assert result.state_summary.status == "succeeded", f"Expected succeeded, got {result.state_summary.status}"
    assert len(transfer_cmds) == 8, f"Expected 8 transfer commands (4 aspirate + 4 dispense), got {len(transfer_cmds)}"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `CSV RTP completed in ${((performance.now() - t6) / 1000).toFixed(2)}s`
  )
  console.log('PASS: CSV RTP protocol works\n')

  // -----------------------------------------------------------------------
  // Test 7: Custom labware (Flex_S_v2_20_P1000_custom_labware_simple.py)
  // -----------------------------------------------------------------------
  console.log('--- Test 7: Custom labware protocol (Flex, v2.20) ---')

  const customLabwareProto = readFileSync(
    join(__dirname, 'fixtures', 'Flex_S_v2_20_P1000_custom_labware_simple.py'),
    'utf-8'
  )
  const customLabwareJson = readFileSync(
    join(
      __dirname,
      '..',
      'analyses-snapshot-testing',
      'files',
      'labware',
      'cpx_4_tuberack_100ul.json'
    ),
    'utf-8'
  )

  pyodide.globals.set('_custom_lw_proto', customLabwareProto)
  pyodide.globals.set('_custom_lw_json', customLabwareJson)
  const t7 = performance.now()

  await pyodide.runPythonAsync(`
try:
    result = await opentrons_pyodide_shims.analyze_pyodide(
        _custom_lw_proto,
        "Flex_S_v2_20_P1000_custom_labware_simple.py",
        labware_files=[("cpx_4_tuberack_100ul.json", _custom_lw_json)],
        csv_file=None,
    )
    print(f"Status: {result.state_summary.status}")
    print(f"Commands: {len(result.commands)}")
    print(f"Errors: {len(result.state_summary.errors)}")
    if result.state_summary.errors:
        for err in result.state_summary.errors:
            print(f"  Error: {err.errorType}: {err.detail}")
    # Expect 4 wells -> 4 pick_up_tip + 4 aspirate + 4 dispense + 4 drop_tip
    transfer_cmds = [c for c in result.commands if c.commandType in ("aspirate", "dispense")]
    print(f"Transfer commands (aspirate+dispense): {len(transfer_cmds)}")
    # Verify the custom labware appears in the loaded labware list
    labware_load_names = [lw.definitionUri for lw in result.state_summary.labware]
    print(f"Labware in run: {labware_load_names}")
    custom_lw_loaded = any("cpx_4_tuberack_100ul" in uri for uri in labware_load_names)
    assert result.state_summary.status == "succeeded", f"Expected succeeded, got {result.state_summary.status}"
    assert len(transfer_cmds) == 8, f"Expected 8 transfer commands (4 aspirate + 4 dispense), got {len(transfer_cmds)}"
    assert custom_lw_loaded, f"Custom labware not found in run labware list: {labware_load_names}"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `Custom labware completed in ${((performance.now() - t7) / 1000).toFixed(2)}s`
  )
  console.log('PASS: Custom labware protocol works\n')

  // -----------------------------------------------------------------------
  // Test 8: Pandas protocol (Flex_S_v2_27_P1000_pandas_simple.py)
  // -----------------------------------------------------------------------
  console.log('--- Test 8: Pandas protocol (Flex, apiLevel 2.27) ---')

  const pandasProto = readFileSync(
    join(__dirname, 'fixtures', 'Flex_S_v2_27_P1000_pandas_simple.py'),
    'utf-8'
  )
  pyodide.globals.set('_pandas_proto', pandasProto)
  const t8 = performance.now()

  await pyodide.runPythonAsync(`
try:
    result = await opentrons_pyodide_shims.analyze_pyodide(
        _pandas_proto, "Flex_S_v2_27_P1000_pandas_simple.py"
    )
    print(f"Status: {result.state_summary.status}")
    print(f"Commands: {len(result.commands)}")
    print(f"Errors: {len(result.state_summary.errors)}")
    if result.state_summary.errors:
        for err in result.state_summary.errors:
            print(f"  Error: {err.errorType}: {err.detail}")

    # After filtering out non-positive volumes (B1=0, E1=-5), 4 wells remain.
    transfer_cmds = [c for c in result.commands if c.commandType in ("aspirate", "dispense")]
    print(f"Transfer commands (aspirate+dispense): {len(transfer_cmds)}")

    # Verify the pandas comment was emitted (proves pd.DataFrame + filter ran).
    comment_cmds = [c for c in result.commands if c.commandType == "comment"]
    pandas_comment = any(
        "pandas" in getattr(c.params, "message", "") for c in comment_cmds
    )
    print(f"Pandas comment found: {pandas_comment}")

    assert result.state_summary.status == "succeeded", (
        f"Expected succeeded, got {result.state_summary.status}"
    )
    assert len(transfer_cmds) == 8, (
        f"Expected 8 transfer commands (4 aspirate + 4 dispense for 4 filtered rows), "
        f"got {len(transfer_cmds)}"
    )
    assert pandas_comment, "Expected a comment containing 'pandas' from pd.__version__"
except Exception as e:
    traceback.print_exc()
    raise
  `)

  console.log(
    `Pandas protocol completed in ${((performance.now() - t8) / 1000).toFixed(2)}s`
  )
  console.log('PASS: Pandas protocol works\n')

  console.log('=== ALL TESTS PASSED ===')
}

main().catch(err => {
  console.error('\n=== TEST FAILED ===')
  console.error(err)
  process.exit(1)
})
