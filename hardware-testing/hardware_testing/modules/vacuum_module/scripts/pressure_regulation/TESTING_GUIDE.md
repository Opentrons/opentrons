# Vacuum module pressure-hold testing guide

## What this tests

Compares **pressure regulation at hold** (mean |error|, stdev, peak-to-peak) across firmware variants.

Default sweep: **0 → −800 mbar** in 50 mbar steps, **120 s** each.  
Uses `VacuumModuleDriver` (asyncio). Waste detection is **off by default**.

---

## Hardware / fixture (recommended)

| Item | Recommendation |
|------|----------------|
| Flex | Any Flex with the vacuum module on USB |
| Vacuum Module | `/dev/ot_module_vacuummodule*` on the Flex |
| Labware | **Dry filter plate** on the correct **collar** (same type every run) |
| Waste detection | Off by default (`--no-waste-detection`); pass `--waste-detection` to enable |


## Scripts

| File | Purpose |
|------|---------|
| `run_hold_test.py` | Hold sweep via `VacuumModuleDriver`; writes live JSON |
| `make_report.py` | Single-run HTML charts from one JSON |
| `make_compare_report.py` | Multi-run comparison HTML from `runs/*/results.json` |
| `flash_dfu_flex.sh` | DFU flash over Flex USB (**prefer ST-Link**) |

### `run_hold_test.py`

```bash
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test \
  [--targets P ...] [--duration_s SEC] [--run-name NAME] \
  [--waste-detection | --no-waste-detection]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--targets` | `0 -50 … -800` | Gauge pressures (mbar), space-separated |
| `--duration_s` | `120` | Hold seconds per target |
| `--run-name` | `unnamed` | Label stored in results JSON |
| `--waste-detection` / `--no-waste-detection` | **disabled** | Enable/disable waste full detection (`M127 E1` / `E0`) |

Writes live results to **`/tmp/results.json`** on the Flex.

Examples:

```bash
# Full default sweep
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test

# Short smoke
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test \
  --targets -50 -100 --duration_s 10 --run-name smoke

# Custom hold with waste detection on
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test \
  --targets -200 -400 -800 --duration_s 90 --run-name waste_on --waste-detection
```

### `make_report.py`

```bash
python3 make_report.py [--input PATH] [--output PATH]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--input` | `vacuum_pressure_hold_results.json` | Hold-test JSON |
| `--output` | `index.html` | HTML report |

### `make_compare_report.py`

```bash
python3 make_compare_report.py [--runs-dir DIR] [--output PATH]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--runs-dir` | `runs` | Dir of `*/results.json` folders |
| `--output` | `compare.html` | Comparison HTML |

---

## 1) Run a sweep

```bash
ssh -i $KEY root@$FLEX 'systemctl stop opentrons-robot-server opentrons-hardware-api'
scp -i $KEY run_hold_test.py root@$FLEX:/tmp/run_hold_test.py

export RUN_NAME=01_soft_settled_lpf   # label for archiving later

ssh -i $KEY root@$FLEX \
  "export RUNNING_ON_VERDIN=true PYTHONPATH=/opt/opentrons-robot-server; \
   python3 -u /tmp/run_hold_test.py --targets -200 -400 -550 -700 -800 --duration_s 90" \
  | tee $ART/run_${RUN_NAME}.log
```

Live samples: `t=… C=… T=… err=… E=… D=…` · `STEADY` per target · final `DONE`.  
JSON on Flex: `/tmp/results.json`.

---

## 3) Live graph (single run)

On the **host**, in another terminal:

```bash
cd $ART

(
  while true; do
    scp -q -i $KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$FLEX:/tmp/results.json $ART/results.json 2>/dev/null || true
    python3 make_report.py --input results.json --output index.html 2>/dev/null || true
    python3 make_compare_report.py --runs-dir runs --output compare.html 2>/dev/null || true
    sleep 3
  done
) &

python3 -m http.server 8765 --bind 127.0.0.1
```

| Page | URL |
|------|-----|
| Live single-run | http://127.0.0.1:8765/ |
| Multi-run compare | http://127.0.0.1:8765/compare.html |

Single-run page auto-refreshes while status is `running`.

---

## 4) Save a run for comparison

```bash
mkdir -p $ART/runs/$RUN_NAME
scp -i $KEY root@$FLEX:/tmp/results.json \
  $ART/runs/$RUN_NAME/results.json

python3 make_compare_report.py --runs-dir $ART/runs --output $ART/compare.html
```

**Layout:**

```
artifacts/pressure_hold_test/
  run_<name>.log
  vacuum_pressure_hold_results.json
  index.html
  compare.html
  runs/
    00_baseline_hold_ff/results.json
    01_soft_settled_lpf/results.json
```

Compare table: **mean |error| / p2p / stdev** per target (best mean |error| highlighted).

---

## 5) A/B firmware workflow

1. Flash A → sweep → save under `runs/00_…`  
2. Flash B → sweep → save under `runs/01_…`  
3. Open **compare.html**; prefer lower mean |error| and p2p/stdev on hold (last ~30 s).  
4. Keep Flex, module, dry filter/collar, and room conditions the same.

---

## 6) After testing

```bash
ssh -i $KEY root@$FLEX 'systemctl start opentrons-robot-server'
```

Stop the host sync loop and `http.server` when finished.
