# Runtime Parameters (RTP) Reference

Runtime Parameters allow users to customize protocol behavior at run time without editing the Python file. Available in API 2.18+.

## Structure

Add an `add_parameters` function **before** `run`:

```python
from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "2.18"}

def add_parameters(parameters: protocol_api.Parameters) -> None:
    # Define parameters here
    pass

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Access parameters via protocol.params
    value = protocol.params.variable_name
```

## Parameter Types

### Integer (`add_int`)

```python
# With min/max range
parameters.add_int(
    variable_name="sample_count",
    display_name="Number of Samples",
    default=8,
    minimum=1,
    maximum=96,
    description="How many samples to process",
    unit="samples",
)

# With choices
parameters.add_int(
    variable_name="plate_count",
    display_name="Plate Count",
    default=2,
    choices=[
        {"display_name": "1 plate", "value": 1},
        {"display_name": "2 plates", "value": 2},
        {"display_name": "3 plates", "value": 3},
    ],
)
```

### Float (`add_float`)

```python
# With min/max range
parameters.add_float(
    variable_name="transfer_volume",
    display_name="Transfer Volume",
    default=100.0,
    minimum=10.0,
    maximum=1000.0,
    unit="µL",
)

# With choices
parameters.add_float(
    variable_name="concentration",
    display_name="Concentration",
    default=1.0,
    choices=[
        {"display_name": "Low (0.5x)", "value": 0.5},
        {"display_name": "Normal (1.0x)", "value": 1.0},
        {"display_name": "High (2.0x)", "value": 2.0},
    ],
)
```

### Boolean (`add_bool`)

```python
parameters.add_bool(
    variable_name="dry_run",
    display_name="Dry Run",
    default=False,
    description="When on, skip actual liquid transfers",
)
```

### String (`add_str`)

```python
# Always uses choices (no free text)
parameters.add_str(
    variable_name="pipette_type",
    display_name="Pipette",
    default="flex_1channel_1000",
    choices=[
        {"display_name": "1-channel 1000µL", "value": "flex_1channel_1000"},
        {"display_name": "8-channel 1000µL", "value": "flex_8channel_1000"},
    ],
    description="Which pipette to use",
)
```

### CSV File (API 2.20+)

```python
parameters.add_csv_file(
    variable_name="plate_map",
    display_name="Plate Map CSV",
    description="CSV file with well, volume columns",
)

def run(protocol: protocol_api.ProtocolContext) -> None:
    csv_data = protocol.params.plate_map
    rows = csv_data.parse_as_csv()  # Returns list of lists
    for row in rows[1:]:  # Skip header
        well, volume = row[0], float(row[1])
        pipette.transfer(volume, source, plate[well])
```

## Common Parameter Fields

| Field                 | Required | Description                                         |
| --------------------- | -------- | --------------------------------------------------- |
| `variable_name`       | Yes      | Python variable name (used in `protocol.params.X`)  |
| `display_name`        | Yes      | Human-readable label shown in the Opentrons App     |
| `default`             | Yes      | Default value                                       |
| `description`         | No       | Help text shown in the App                          |
| `unit`                | No       | Unit label (e.g., "µL", "samples", "RPM")           |
| `minimum` / `maximum` | No\*     | Range for int/float (\*required if no `choices`)    |
| `choices`             | No\*     | List of `{"display_name": ..., "value": ...}` dicts |

A numeric parameter must have either `minimum`/`maximum` OR `choices`, not both.

## Accessing Parameters

```python
def run(protocol: protocol_api.ProtocolContext) -> None:
    # Direct access
    count = protocol.params.sample_count

    # Iterate all parameters
    for name, value in protocol.params.get_all().items():
        protocol.comment(f"{name} = {value}")
```

## Common Use Cases

### Configurable Pipette Selection

```python
def add_parameters(parameters: protocol_api.Parameters) -> None:
    parameters.add_str(
        variable_name="pipette_type",
        display_name="Pipette",
        default="flex_1channel_1000",
        choices=[
            {"display_name": "1-ch 50µL", "value": "flex_1channel_50"},
            {"display_name": "1-ch 1000µL", "value": "flex_1channel_1000"},
            {"display_name": "8-ch 1000µL", "value": "flex_8channel_1000"},
        ],
    )

def run(protocol: protocol_api.ProtocolContext) -> None:
    pipette = protocol.load_instrument(
        protocol.params.pipette_type, mount="left", tip_racks=[tiprack]
    )
```

### Dry Run Mode

```python
def add_parameters(parameters: protocol_api.Parameters) -> None:
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        default=False,
        description="Move to wells without transferring liquid",
    )

def run(protocol: protocol_api.ProtocolContext) -> None:
    if not protocol.params.dry_run:
        pipette.transfer(100, source, dest)
    else:
        protocol.comment("DRY RUN: would transfer 100µL")
```

### Variable Sample Count

```python
def add_parameters(parameters: protocol_api.Parameters) -> None:
    parameters.add_int(
        variable_name="num_samples",
        display_name="Number of Samples",
        default=24,
        minimum=1,
        maximum=96,
    )

def run(protocol: protocol_api.ProtocolContext) -> None:
    n = protocol.params.num_samples
    source_wells = source_plate.wells()[:n]
    dest_wells = dest_plate.wells()[:n]
    pipette.transfer(100, source_wells, dest_wells)
```

### CSV-Driven Cherry Picking (API 2.20+)

```python
def add_parameters(parameters: protocol_api.Parameters) -> None:
    parameters.add_csv_file(
        variable_name="cherrypick_map",
        display_name="Cherry Pick Map",
        description="CSV: source_well, dest_well, volume",
    )

def run(protocol: protocol_api.ProtocolContext) -> None:
    rows = protocol.params.cherrypick_map.parse_as_csv()
    for row in rows[1:]:
        src_well, dst_well, vol = row[0], row[1], float(row[2])
        pipette.transfer(vol, source_plate[src_well], dest_plate[dst_well])
```

## Analyzing Protocols with RTPs

When analyzing a protocol that has runtime parameters, you can provide values:

```bash
opentrons analyze protocol.py \
    --json-output=output.json \
    --rtp-values='{"sample_count": 48, "dry_run": true}'
```

For CSV parameters, use `--rtp-files`:

```bash
opentrons analyze protocol.py \
    --json-output=output.json \
    --rtp-files='{"plate_map": "/path/to/map.csv"}'
```
