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
| `run_hold_test.py` | Hold sweep via `VacuumModuleDriver`; writes live JSON and/or CSV |
| `hold_results.py` | Shared JSON/CSV load/save used by the runner, reports, and converter |
| `make_report.py` | Single-run HTML charts from one JSON or CSV |
| `make_compare_report.py` | Multi-run comparison HTML from `runs/*/results.json` (or `.csv`) |
| `convert_hold_results.py` | Convert archived results between JSON and CSV |
| `flash_dfu_flex.sh` | DFU flash over Flex USB (**prefer ST-Link**) |

### `run_hold_test.py`

JSON is the canonical live/report format. CSV is a long-form sidecar (one row
per sample plus a per-target summary) for spreadsheets and QC-adjacent tools.
It is **not** the production `vacuum_module_qc` `CSVReport` schema.

```bash
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test \
  [--targets P ...] [--duration_s SEC] [--run-name NAME] \
  [--waste-detection | --no-waste-detection] \
  [--output json|csv|both]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--targets` | `0 -50 … -800` | Gauge pressures (mbar), space-separated |
| `--duration_s` | `120` | Hold seconds per target |
| `--run-name` | `unnamed` | Label stored in results |
| `--waste-detection` / `--no-waste-detection` | **disabled** | Enable/disable waste full detection (`M127 E1` / `E0`) |
| `--output` | `json` | `json` (canonical, live HTML), `csv` (samples + summary), or `both` |

Writes live results on the Flex:

| `--output` | Files |
|------------|--------|
| `json` | `/tmp/vacuum_pressure_hold_results.json` |
| `csv` | `/tmp/vacuum_pressure_hold_results.csv` and `*_summary.csv` |
| `both` | all three |

Use `both` when you also need CSV for analysis; keep `json` (or `both`) for
the live HTML loop.

Examples:

```bash
# Full default sweep (JSON only)
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test

# Short smoke, JSON + CSV
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test \
  --targets -50 -100 --duration_s 10 --run-name smoke --output both

# Custom hold with waste detection on
python3 -m hardware_testing.modules.vacuum_module.scripts.pressure_regulation.run_hold_test \
  --targets -200 -400 -800 --duration_s 90 --run-name waste_on --waste-detection
```

### `make_report.py`

```bash
python3 make_report.py [--input PATH] [--output PATH] [--format html|pdf|both]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--input` | `results.json` | Hold-test `.json`, `.csv`, or a run directory |
| `--output` | `index.html` | Output path (`.pdf` selects PDF if `--format` omitted) |
| `--format` | from `--output` suffix, else `html` | `html` (live Chart.js), `pdf` (matplotlib), or `both` |

PDF needs matplotlib on the host (`hardware-testing` dev extra).

```bash
python3 make_report.py --input results.json --output index.html
python3 make_report.py --input results.json --output index.pdf
python3 make_report.py --input results.json --output index.html --format both
```

### `make_compare_report.py`

```bash
python3 make_compare_report.py [--runs-dir DIR] [--output PATH] [--format html|pdf|both]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--runs-dir` | `runs` | Dir of run folders with `results.json` or `results.csv` |
| `--output` | `compare.html` | Output path (`.pdf` selects PDF if `--format` omitted) |
| `--format` | from `--output` suffix, else `html` | `html`, `pdf`, or `both` |

Each folder prefers `results.json` when both formats are present.

### `convert_hold_results.py`

```bash
python3 convert_hold_results.py --input PATH [--output PATH]
```

| Arg | Default | Meaning |
|-----|---------|---------|
| `--input` | (required) | `.json`, `.csv`, or a run directory |
| `--output` | same stem, other suffix | Destination `.json` or `.csv` |

JSON → CSV writes the samples file plus a sibling `*_summary.csv`.
CSV → JSON rebuilds the nested document (stats from the summary file, or
recomputed from samples).

```bash
python3 convert_hold_results.py --input runs/23_1888194c_water_3x0p2mm/results.json
python3 convert_hold_results.py --input results.csv --output results.json
```

---

## 1) Run a sweep

```bash
ssh -i $KEY root@$FLEX 'systemctl stop opentrons-robot-server opentrons-hardware-api'
scp -i $KEY run_hold_test.py hold_results.py root@$FLEX:/tmp/

export RUN_NAME=01_soft_settled_lpf   # label for archiving later

ssh -i $KEY root@$FLEX \
  "export RUNNING_ON_VERDIN=true PYTHONPATH=/opt/opentrons-robot-server; \
   python3 -u /tmp/run_hold_test.py --targets -200 -400 -550 -700 -800 --duration_s 90 --output both" \
  | tee $ART/run_${RUN_NAME}.log
```

Live samples: `t=… C=… T=… err=… E=… D=…` · `STEADY` per target · final `DONE`.  
Files on Flex: `/tmp/vacuum_pressure_hold_results.json` (and `.csv` / `_summary.csv` with `--output both`).

---

## 3) Live graph (single run)

On the **host**, in another terminal:

```bash
cd $ART

(
  while true; do
    scp -q -i $KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$FLEX:/tmp/vacuum_pressure_hold_results.json $ART/results.json 2>/dev/null || true
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
scp -i $KEY root@$FLEX:/tmp/vacuum_pressure_hold_results.json \
  $ART/runs/$RUN_NAME/results.json
# optional CSV sidecar
scp -i $KEY root@$FLEX:/tmp/vacuum_pressure_hold_results.csv \
  $ART/runs/$RUN_NAME/results.csv || true
scp -i $KEY root@$FLEX:/tmp/vacuum_pressure_hold_results_summary.csv \
  $ART/runs/$RUN_NAME/results_summary.csv || true

python3 make_compare_report.py --runs-dir $ART/runs --output $ART/compare.html
```

**Layout:**

```
artifacts/pressure_hold_test/
  run_<name>.log
  vacuum_pressure_hold_results.json
  vacuum_pressure_hold_results.csv
  vacuum_pressure_hold_results_summary.csv
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
