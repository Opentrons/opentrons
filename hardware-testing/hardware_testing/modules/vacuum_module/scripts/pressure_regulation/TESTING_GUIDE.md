# Vacuum module pressure-hold testing guide

Concise how-to for running hold sweeps, live graphs, and multi-run comparison.

**Module Repo root:** `opentrons-modules`
**Module Repo Branch:** `vacuum-module-integral-reset`
**Robot Repo root:** `opentrons`
**Robot Repo Branch:** `vacuum-module-pressure-regulation`
**Scripts dir:** `hardware-testing/hardware_testing/modules/vacuum_module/pressure_regulation/`  

---

## What this tests

Compares **pressure regulation at hold** (mean |error|, stdev, peak-to-peak) across firmware variants.

Default short sweep targets: **−200, −400, −550, −700, −800 mbar**, **90 s** each.  
Between targets: **vent open until near atmospheric** (~±10 mbar).  
Waste detection is **disabled** for control-only runs.

---

## Hardware / fixture (recommended)

| Item | Recommendation |
|------|----------------|
| Flex | Any Flex with the vacuum module on USB |
| Vacuum Module | as `/dev/ot_module_vacuummodule*` on the Flex |
| Labware | **Dry filter plate** on the correct **collar** (same type every run) |
| Waste detection | **Off** during sweeps (`M127 E0` is done by the script) |

---

## Access

```bash
# SSH to Flex (example IP — replace with yours)
export FLEX=10.14.19.225
export KEY=~/.ssh/robot_key
export ART=$PWD/artifacts/pressure_hold_test   # from opentrons-modules root

ssh -i $KEY -o StrictHostKeyChecking=no root@$FLEX
```

On Flex, confirm module:

```bash
ls -la /dev/ot_module_vacuummodule*
# optional: python3 serial M115 check
```

---

## Scripts (what they do)

| File | Purpose |
|------|---------|
| `run_hold_test.py` | Older full 0→−800 @ 50 mbar / 2 min sweep (long) |
| `make_report.py` | Single-run live HTML chart from one JSON |
| `make_compare_report.py` | Multi-run comparison HTML from `runs/*/results.json` |
| `flash_dfu_flex.sh` | DFU flash over Flex USB (**prefer ST-Link**; DFU can stick in bootloader) |

Env vars for `run_hold_test.py`:

| Var | Default | Meaning |
|-----|---------|---------|
| `RUN_NAME` | `unnamed` | Label for this run (folder name under `runs/`) |
| `OUT_JSON` | `/tmp/vacuum_pressure_hold_results.json` | Live results path on Flex |
| `DURATION_S` | `90` | Hold seconds per target |

---

## 1) Flash firmware (ST-Link — preferred)

On the **host** (module SWD via ST-Link):

```bash
cd /path/to/opentrons-modules
git checkout vacuum-module-integral-reset   # or the commit you want

# Configure once if needed
cmake --preset stm32-cross

cmake --build ./build-stm32-cross --target vacuum-module -j8
cmake --build ./build-stm32-cross --target vacuum-module-flash
```

After flash, module resets. Confirm on Flex with `M115` (version string may lag git; flash success is what matters).

**Controller commits on this branch (newest last):**

1. `1f73bc87` — hold feed-forward at depth (baseline hold-FF)  
2. `ede8542f` — soft-hold past final target  
3. `5397af9e` — settled-hold PID detune  
4. `1753e83c` — LPF on measured pressure  

`HEAD` with all of the above is the usual “full stack” under test.

**DFU note:** `flash_dfu_flex.sh` can brick enumeration if leave fails (option-byte DFU). Prefer ST-Link. If stuck in DFU, power-cycle the module.

---

## 2) Run a sweep

**Stop robot-server**:

```bash
ssh -i $KEY root@$FLEX 'systemctl stop opentrons-robot-server'
```

Copy and run:

```bash
scp -i $KEY $ART/run_hold_test.py root@$FLEX:/tmp/run_hold_test.py

# Example run name — use a unique label per firmware/config
export RUN_NAME=01_soft_settled_lpf

ssh -i $KEY root@$FLEX \
  "export RUN_NAME=$RUN_NAME OUT_JSON=/tmp/vacuum_pressure_hold_results.json DURATION_S=90; \
   python3 -u /tmp/run_hold_test.py" \
  | tee $ART/run_${RUN_NAME}.log
```

What you’ll see:

- Live sample lines: `t=… C=… T=… err=… E=… D=…`
- Equalize messages between targets  
- `STEADY` stats per target  
- Final `DONE`

JSON is written live on the Flex at `/tmp/vacuum_pressure_hold_results.json`.

---

## 3) Live graph (single run)

On the **host**, in another terminal:

```bash
cd $ART

# Poll Flex JSON + rebuild single-run page (every ~3s)
(
  while true; do
    scp -q -i $KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
      root@$FLEX:/tmp/vacuum_pressure_hold_results.json \
      $ART/vacuum_pressure_hold_results.json 2>/dev/null || true
    python3 make_report.py vacuum_pressure_hold_results.json index.html 2>/dev/null || true
    python3 make_compare_report.py runs compare.html 2>/dev/null || true
    sleep 3
  done
) &

# Serve pages
python3 -m http.server 8765 --bind 127.0.0.1
```

Open:

| Page | URL |
|------|-----|
| **Live single-run charts** | http://127.0.0.1:8765/ |
| **Multi-run comparison** | http://127.0.0.1:8765/compare.html |

Single-run page auto-refreshes every few seconds while status is `running`.

---

## 4) Save a run for comparison

After `DONE`, archive the JSON under a named folder:

```bash
mkdir -p $ART/runs/$RUN_NAME
scp -i $KEY root@$FLEX:/tmp/vacuum_pressure_hold_results.json \
  $ART/runs/$RUN_NAME/results.json
cp $ART/run_${RUN_NAME}.log $ART/runs/$RUN_NAME/ 2>/dev/null || true

python3 $ART/make_compare_report.py $ART/runs $ART/compare.html
```

**Layout:**

```
artifacts/pressure_hold_test/
  run_<name>.log              # full text log for that run
  vacuum_pressure_hold_results.json   # last polled live file
  index.html                  # last single-run report
  compare.html                # all runs side-by-side
  runs/
    00_baseline_hold_ff/
      results.json
    01_soft_settled_lpf/
      results.json
      run_….log               # optional
```

Comparison table shows **mean |error| / p2p / stdev** per target; best mean |error| is highlighted. Charts overlay pressure and error vs time per target.

---

## 5) Suggested workflow for A/B firmware compares

1. Flash firmware A (ST-Link).  
2. Run short sweep with `RUN_NAME=00_…` → save under `runs/`.  
3. Flash firmware B.  
4. Run with `RUN_NAME=01_…` → save.  
5. Refresh **http://127.0.0.1:8765/compare.html**.  
6. Prefer lower **mean |error|** and lower **p2p / stdev** on holds (last ~30 s of each target).

Same Flex, same module, same dry filter/collar, same room conditions when possible.

---

## 6) After testing

```bash
ssh -i $KEY root@$FLEX 'systemctl start opentrons-robot-server'
```

Stop the host sync loop and `python3 -m http.server` when finished.

---

## Troubleshooting

| Symptom | What to do |
|---------|------------|
| `Permission denied` / empty serial | Stop `opentrons-robot-server`; check `/dev/ot_module_vacuummodule1` |
| Module in DFU forever after USB DFU | Prefer ST-Link; or **power-cycle** the module |
| `SerialNo:EMPTYSN` | OK for some boards; ignore if M120/M121 work |
| `ERR003` then `M124 OK` on vent | Harmless parse noise; vent still works |
| Large mid-hold collapse | Check seal, waste left on, or fixture leak; re-run dry |
| Live graph stale | Confirm sync loop + `scp` of JSON; hard-refresh browser |
| Compare empty | Need `runs/*/results.json` with `"run_name"` set |

---

## Quick copy-paste (one new run)

```bash
export FLEX=10.14.19.225
export KEY=~/.ssh/robot_key
export ART=/path/to/opentrons-modules/artifacts/pressure_hold_test
export RUN_NAME=my_run_label

# Flash (host + ST-Link), then:
ssh -i $KEY root@$FLEX 'systemctl stop opentrons-robot-server'
scp -i $KEY $ART/run_hold_test.py root@$FLEX:/tmp/
ssh -i $KEY root@$FLEX \
  "export RUN_NAME=$RUN_NAME OUT_JSON=/tmp/vacuum_pressure_hold_results.json DURATION_S=90; \
   python3 -u /tmp/run_hold_test.py" | tee $ART/run_${RUN_NAME}.log

# After DONE:
mkdir -p $ART/runs/$RUN_NAME
scp -i $KEY root@$FLEX:/tmp/vacuum_pressure_hold_results.json $ART/runs/$RUN_NAME/results.json
python3 $ART/make_compare_report.py $ART/runs $ART/compare.html
# open http://127.0.0.1:8765/compare.html  (with http.server running in $ART)
```
