# Liquid Handling Reference — Detailed Patterns

## Building Block Commands

These are the low-level commands for full control over pipette actions.

### Tip Management

```python
pipette.pick_up_tip()                      # Auto from tip_racks
pipette.pick_up_tip(tiprack["A1"])         # Specific well
pipette.drop_tip()                          # Drop in trash
pipette.drop_tip(tiprack["A1"])            # Drop in specific location
pipette.return_tip()                        # Return to pickup location
```

### Aspirate / Dispense

```python
pipette.aspirate(volume=100, location=plate["A1"])
pipette.aspirate(100, plate["A1"].bottom(z=2))     # 2mm above bottom
pipette.aspirate(100, plate["A1"].top(z=-5))        # 5mm below top

pipette.dispense(volume=100, location=plate["B1"])
pipette.dispense(100, plate["B1"].bottom(z=2))

# Rate modifier (fraction of default flow rate)
pipette.aspirate(100, plate["A1"], rate=0.5)   # Half speed
pipette.dispense(100, plate["B1"], rate=2.0)    # Double speed
```

### Blow Out, Touch Tip, Air Gap, Mix

```python
pipette.blow_out()                          # Blow out in current location
pipette.blow_out(plate["A1"])              # Blow out in specific well
pipette.blow_out(protocol.fixed_trash["A1"])  # OT-2 trash

pipette.touch_tip()                         # Touch all sides of current well
pipette.touch_tip(plate["A1"])
pipette.touch_tip(radius=0.75, v_offset=-2)  # Customize position

pipette.air_gap(volume=10)                  # Add air gap after aspirate

pipette.mix(repetitions=3, volume=50)       # Mix in current well
pipette.mix(3, 50, plate["A1"])             # Mix in specific well
```

### Location Modifiers

```python
well = plate["A1"]

well.top()                    # Top center of well
well.top(z=-5)                # 5mm below top
well.bottom()                 # Bottom center
well.bottom(z=2)              # 2mm above bottom
well.center()                 # Center of well

# Meniscus-relative (API 2.23+, Flex only)
well.meniscus(z=-1)           # 1mm below meniscus
```

## Complex Commands

### Transfer (1-to-1)

```python
# Single well to single well
pipette.transfer(100, plate["A1"], plate["B1"])

# Multiple wells (pairwise)
pipette.transfer(100, plate.wells()[:4], plate.wells()[4:8])

# Variable volumes
pipette.transfer([50, 100, 150], sources, dests)
```

### Distribute (1-to-many)

```python
# One source, many destinations
pipette.distribute(50, reservoir["A1"], plate.rows()[0])

# With disposal volume (avoids dripping between dispenses)
pipette.distribute(50, reservoir["A1"], plate.rows()[0], disposal_volume=10)
```

### Consolidate (many-to-1)

```python
# Many sources, one destination
pipette.consolidate(50, plate.rows()[0], reservoir["A1"])
```

### Full Parameter Reference

```python
pipette.transfer(
    volume=100,                         # µL (or list of volumes)
    source=plate["A1"],                 # Well or list of wells
    dest=plate["B1"],                   # Well or list of wells
    new_tip="always",                   # "always" | "once" | "never"
    trash=True,                         # True=trash, False=return tip
    mix_before=(3, 50),                 # (reps, vol) — mix at source before aspirate
    mix_after=(2, 50),                  # (reps, vol) — mix at dest after dispense
    blow_out=True,                      # Blow out after dispense
    blowout_location="trash",          # "trash" | "source well" | "destination well"
    touch_tip=True,                     # Touch tip after dispense
    air_gap=10,                         # Air gap volume after each aspirate
    disposal_volume=10,                 # Extra volume for distribute/consolidate
    carryover=True,                     # Split volume across multiple aspirates if > max
)
```

## Liquid Classes (API 2.24+, Flex Only)

Liquid classes optimize pipetting parameters (flow rate, tip position, delays) for specific liquid types.

### Built-in Liquid Classes

| Name          | Type     | Description     |
| ------------- | -------- | --------------- |
| `water`       | Aqueous  | Deionized water |
| `ethanol_80`  | Volatile | 80% ethanol     |
| `glycerol_50` | Viscous  | 50% glycerol    |

### Usage (Single-Channel)

```python
water_class = protocol.get_liquid_class(name="water")

pipette.transfer_with_liquid_class(
    liquid_class=water_class,
    volume=50,
    source=[plate["A1"]],
    dest=[plate["B1"]],
    new_tip="always",
)

pipette.distribute_with_liquid_class(
    liquid_class=water_class,
    volume=50,
    source=reservoir["A1"],
    dest=[plate["A1"], plate["A2"], plate["A3"]],
    new_tip="once",
)

pipette.consolidate_with_liquid_class(
    liquid_class=water_class,
    volume=50,
    source=[plate["A1"], plate["A2"]],
    dest=reservoir["A1"],
    new_tip="once",
)
```

### Usage (8-Channel) — `group_wells` Matters

By default, `group_wells=True` and the liquid class functions validate that **all wells** the multi-channel pipette will physically access are included in `source`/`dest`. For an 8-channel, you must pass the full column (8 wells), not just the top well.

```python
eight_ch = protocol.load_instrument("flex_8channel_1000", mount="right", tip_racks=[tiprack])

# CORRECT — pass full columns
eight_ch.transfer_with_liquid_class(
    liquid_class=water_class,
    volume=100,
    source=plate.columns()[0],      # [A1, B1, C1, D1, E1, F1, G1, H1]
    dest=plate.columns()[1],        # [A2, B2, C2, D2, E2, F2, G2, H2]
    new_tip="always",
)

# WRONG — only top well → raises ValueError:
#   "Pipette will access source wells not provided in the liquid handling
#    command. Set group_wells to False or include these wells: [B1, C1, ...]"
eight_ch.transfer_with_liquid_class(
    liquid_class=water_class,
    volume=100,
    source=[plate["A1"]],           # ← missing B1-H1
    dest=[plate["A2"]],
    new_tip="always",
)
```

For distribute/consolidate with an 8-channel, concatenate columns:

```python
# Distribute: reservoir (single trough) → 3 plate columns
eight_ch.distribute_with_liquid_class(
    liquid_class=water_class,
    volume=50,
    source=reservoir["A1"],
    dest=plate.columns()[2] + plate.columns()[3] + plate.columns()[4],
    new_tip="once",
)

# Consolidate: 2 plate columns → reservoir
eight_ch.consolidate_with_liquid_class(
    liquid_class=water_class,
    volume=50,
    source=plate.columns()[0] + plate.columns()[1],
    dest=reservoir["A1"],
    new_tip="once",
)
```

> Reservoir wells (single trough) do not need column expansion — all 8 tips access the same well.

## Common Patterns

### Serial Dilution

```python
def run(protocol: protocol_api.ProtocolContext) -> None:
    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D2")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D1")
    plate = protocol.load_labware("corning_96_wellplate_360ul_flat", "C1")
    trash = protocol.load_trash_bin("A3")

    pipette = protocol.load_instrument(
        "flex_8channel_200", mount="right", tip_racks=[tiprack]
    )

    # Distribute diluent to all columns
    pipette.distribute(100, reservoir["A1"], plate.rows()[0][1:])

    # Serial dilution across columns
    pipette.pick_up_tip()
    for i in range(11):
        pipette.transfer(
            100,
            plate.rows()[0][i],
            plate.rows()[0][i + 1],
            mix_after=(3, 50),
            new_tip="never",
        )
    pipette.drop_tip()
```

### Plate Stamping (96-channel)

```python
pipette_96 = protocol.load_instrument("flex_96channel_1000", mount="left")

pipette_96.pick_up_tip(tiprack)
pipette_96.aspirate(100, source_plate["A1"])
pipette_96.dispense(100, dest_plate["A1"])
pipette_96.drop_tip()
```

### Cherry Picking

```python
transfers = [
    ("A1", "B3", 50),
    ("C2", "D1", 100),
    ("E5", "F7", 75),
]

for src, dest, vol in transfers:
    pipette.transfer(vol, source_plate[src], dest_plate[dest])
```

### Bead Cleanup (Flex with Magnetic Block)

```python
mag_block = protocol.load_module("magneticBlockV1", "C1")

# Add beads and mix
pipette.transfer(50, bead_reservoir["A1"], plate["A1"], mix_after=(10, 100))
protocol.delay(minutes=5)  # Incubate

# Engage magnet
protocol.move_labware(plate, mag_block, use_gripper=True)
protocol.delay(minutes=2)  # Wait for separation

# Remove supernatant
pipette.pick_up_tip()
pipette.aspirate(150, plate["A1"].bottom(z=1))
pipette.dispense(150, trash_well)
pipette.drop_tip()

# Wash
for _ in range(2):
    pipette.transfer(200, wash_reservoir["A1"], plate["A1"])
    protocol.delay(seconds=30)
    pipette.transfer(200, plate["A1"].bottom(z=1), trash_well)

# Elute
protocol.move_labware(plate, "D1", use_gripper=True)
pipette.transfer(50, elution_buffer["A1"], plate["A1"], mix_after=(10, 40))
protocol.delay(minutes=2)

protocol.move_labware(plate, mag_block, use_gripper=True)
protocol.delay(minutes=2)
pipette.transfer(50, plate["A1"].bottom(z=1), elution_plate["A1"])
```

### Flow Rate Control

```python
# Set flow rates directly (µL/s)
pipette.flow_rate.aspirate = 50
pipette.flow_rate.dispense = 100
pipette.flow_rate.blow_out = 200

# Or use rate parameter (multiplier)
pipette.aspirate(100, plate["A1"], rate=0.5)  # 50% of default
```

---

## Tip Math — Capacity Planning

Calculate required tips _before_ writing loops to avoid `OutOfTipsError` at runtime.

| Pipette Type        | Tips per `pick_up_tip()` | Tips per 96-well rack | Max ops per rack    |
| ------------------- | ------------------------ | --------------------- | ------------------- |
| Single-channel      | 1                        | 96                    | 96                  |
| 8-channel           | 8                        | 96                    | 12 (one per column) |
| 96-channel (ALL)    | 96                       | 96                    | 1                   |
| 96-channel (COLUMN) | 8                        | 96                    | 12                  |

**Formula:** `tip_racks_needed = ceil(total_operations / max_ops_per_rack)`

```python
import math

num_samples = 48
columns_needed = math.ceil(num_samples / 8)   # 6 columns for 8-channel
tip_racks_needed = math.ceil(columns_needed / 12)  # 1 rack is enough

# Many-to-many: tip count = size of larger group
sources = plate.wells()[:8]
dests = plate.wells()[8:24]
# transfer() uses 24 tips (size of larger group) with new_tip='always'
```

**Index error prevention:** `plate.rows()[0]` has indices 0–11 (12 columns). `plate.wells()` has indices 0–95. Validate loop bounds against labware dimensions.

> Full guide with examples: `opentrons-ai-server/api/storage/docs/out_of_tips_error_219.md`

---

## `transfer()` Anti-Patterns

### Don't wrap `transfer()` in a well-iteration loop

`transfer()` handles iteration internally. Wrapping it in a loop creates redundant tip pickups and often produces wrong results.

```python
# WRONG — each call transfers only one well, wastes tips
for i in range(8):
    pipette.transfer(100, source_plate.wells()[i], dest_plate.wells()[i])

# CORRECT — pass lists; transfer() pairs them automatically
pipette.transfer(
    100,
    source_plate.wells()[:8],
    dest_plate.wells()[:8],
    new_tip="always"
)
```

### `new_tip='once'` in a manual loop is incorrect

```python
# WRONG — tip is only picked up once, but you wrote the loop yourself
for well in source_plate.wells():
    pipette.pick_up_tip()
    pipette.transfer(100, well, dest_plate["A1"], new_tip="once")  # redundant pick_up inside transfer
    pipette.drop_tip()

# CORRECT — let transfer() manage tip behavior with a list
pipette.transfer(100, source_plate.wells(), [dest_plate["A1"]] * 96, new_tip="always")
```

### Multi-channel must use `columns()`, not `wells()`

```python
# WRONG — 8-channel picks up column A, but well index is for single-channel
pipette.transfer(100, source_plate.wells()[:12], dest_plate.wells()[:12])

# CORRECT — pass columns; each element is a list of 8 wells
pipette.transfer(100, source_plate.columns()[:6], dest_plate.columns()[:6])
```

> Full transfer() guide: `opentrons-ai-server/api/storage/docs/transfer_function_notes.md`

---

### Well Iteration Patterns

```python
# All wells in order (A1, B1, C1, ... A2, B2, ...)
for well in plate.wells():
    pipette.transfer(100, reservoir["A1"], well)

# By row (A1-A12, then B1-B12, ...)
for row in plate.rows():
    for well in row:
        pipette.transfer(100, reservoir["A1"], well)

# By column
for col in plate.columns():
    for well in col:
        pipette.transfer(100, reservoir["A1"], well)

# Specific wells
wells = [plate["A1"], plate["B3"], plate["C5"]]
pipette.transfer(100, reservoir["A1"], wells)

# Slice of wells
first_24 = plate.wells()[:24]
```
