# realtime-plot

A lightweight HTTP server that serves a browser-based dashboard for real-time plotting of CSV data. The frontend polls the server every 100 ms and renders live charts using [Plotly.js](https://plotly.com/javascript/).

---

## Usage

> **Before running**, make sure `plotConfigs` in `index_plot.js` is configured for your data. Each entry must specify the correct `filePattern`, `xColumn`, `yColumns`, and display options to match the CSV files your test will produce. See [Adding or Modifying Plots](#adding-or-modifying-plots) for details.

```bash
python3 -m hardware_testing.tools.realtime-plot [--test-name TEST_NAME] [--port PORT]
```

Then open a browser and navigate to:

```
http://<robot_ip>:8080
```

### CLI Arguments

| Argument | Default | Description |
|---|---|---|
| `--test-name` | `test-data` | Name of the sub-folder under the testing data directory to watch for CSV files. |
| `--port` | `8080` | HTTP port the server listens on. |

---

## Data Directory

The server watches for CSV files inside a **testing data directory** resolved in the following order:

1. `$TESTING_DATA_DIR/<test-name>/` — if the environment variable is set.
2. `<cwd>/testing_data/<test-name>/` — if a `config.json` exists in the current directory.
3. `~/.opentrons/testing_data/<test-name>/` — default fallback on a developer machine.

The directory is created automatically if it does not exist.

---

## Default Plots

Two plots are shown by default, each driven by its own CSV file pattern:

| Plot | File Pattern | Columns |
|---|---|---|
| **Pressure vs Time** | `PressureData` | `current_gauge_pressure`, `target_gauge_pressure`, `pressure_abs_a`, `pressure_abs_b`, `pressure_atm` |
| **Flow Rate vs Time** | `FlowrateData` | `Flow_rate(sLM)` |

The server performs a recursive search for the most recently modified file whose stem contains the pattern string (e.g. a file named `PressureData_2024-01-01.csv` is matched by the `PressureData` pattern).

CSV files must have a header row. Example:

```csv
Time(s),current_gauge_pressure,target_gauge_pressure
0.0,1013.2,1013.0
0.1,1013.5,1013.0
```

---

## Adding or Modifying Plots

### 1. Register the file pattern in `server.py`

```python
# In _respond_to_data_request()
file_patterns = ["PressureData", "FlowrateData", "YourNewPattern"]
```

### 2. Add a plot config in `index_plot.js`

```js
const plotConfigs = [
  // ... existing configs ...
  {
    divId: 'plotly3',              // unique HTML div ID
    xColumn: 'Time(s)',            // CSV column for the x-axis
    yColumns: ['your_column'],     // CSV column(s) for the y-axis
    title: 'Your Plot Title',
    yAxisLabel: 'Units',
    colors: ['#ff9900'],
    filePattern: 'YourNewPattern', // must match the pattern added in server.py
    lineStyles: ['solid'],         // 'solid' | 'dash' | 'dot' | 'dashdot'
  },
];
```

A secondary (right-side) y-axis is supported via `yAxis2Label` and `secondaryAxisColumns`. See the commented example in `index_plot.js` for details.

---

## File Overview

| File | Description |
|---|---|
| `server.py` | Python HTTP server — serves the frontend and CSV data via `/data/latest` and `/name` endpoints. |
| `__main__.py` | Entry point; parses CLI args and calls `server.run()`. |
| `index.html` | Dashboard HTML page. |
| `index_plot.js` | Plot configuration and Plotly rendering logic. |
| `plotly-2.12.1.min.js` | Bundled Plotly.js library (offline-capable). |
| `favicon.png` | Browser tab icon. |
