# Module Reference — Detailed Operations

## Module Load Names

| Module                  | Load Name                  | Robot     | API Min |
| ----------------------- | -------------------------- | --------- | ------- |
| Temperature Module Gen2 | `temperature module gen2`  | Both      | 2.0     |
| Thermocycler Gen2       | `thermocycler module gen2` | Both      | 2.0     |
| Heater-Shaker           | `heaterShakerModuleV1`     | Both      | 2.13    |
| Magnetic Module Gen2    | `magnetic module gen2`     | OT-2 only | 2.0     |
| Magnetic Block          | `magneticBlockV1`          | Flex only | 2.15    |
| Absorbance Plate Reader | `absorbanceReaderV1`       | Flex only | 2.21    |
| Flex Stacker            | `flexStackerModuleV1`      | Flex only | 2.25    |

## Temperature Module

```python
temp_mod = protocol.load_module("temperature module gen2", "D1")
adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
plate = adapter.load_labware("nest_96_wellplate_200ul_flat")

temp_mod.set_temperature(4)          # Block until target reached
temp_mod.start_set_temperature(4)    # Async (API 2.27+)
temp_mod.await_temperature(4)        # Wait for async target
temp_mod.deactivate()

# Properties
temp_mod.temperature       # Current temperature
temp_mod.target            # Target temperature (None if deactivated)
temp_mod.status            # "idle", "holding at target", "cooling", "heating"
```

### Common Adapters

- `opentrons_96_well_aluminum_block` — standard 96-well aluminum adapter
- `opentrons_24_aluminumblock_nest_1.5ml_snapcap`
- `opentrons_24_aluminumblock_generic_2ml_screwcap`

## Thermocycler

The Thermocycler occupies two deck slots: A1+B1 on Flex, 7+8+10+11 on OT-2. No slot argument needed.

```python
tc = protocol.load_module("thermocycler module gen2")
plate = tc.load_labware("nest_96_wellplate_200ul_pcr_full_skirt")

# Lid control
tc.open_lid()
tc.close_lid()

# Block temperature
tc.set_block_temperature(
    temperature=95,
    hold_time_seconds=30,       # or hold_time_minutes
    block_max_volume=50,        # µL, improves accuracy
)

# Lid temperature
tc.set_lid_temperature(105)

# PCR profile
tc.execute_profile(
    steps=[
        {"temperature": 95, "hold_time_seconds": 15},
        {"temperature": 60, "hold_time_seconds": 60},
        {"temperature": 72, "hold_time_seconds": 60},
    ],
    repetitions=30,
    block_max_volume=50,
)

# Async profile (API 2.27+)
task = tc.start_execute_profile(
    steps=[...],
    repetitions=30,
    block_max_volume=50,
)
# ... do other things ...
protocol.wait_for_tasks([task])

# Deactivate
tc.deactivate_block()
tc.deactivate_lid()

# Properties
tc.lid_position           # "open" or "closed"
tc.block_temperature      # Current block temp
tc.lid_temperature        # Current lid temp
```

### Typical PCR Workflow

```python
tc.open_lid()
# ... load plate, add reagents ...
tc.close_lid()
tc.set_lid_temperature(105)

# Initial denature
tc.set_block_temperature(95, hold_time_seconds=120, block_max_volume=50)

# Cycling
tc.execute_profile(
    steps=[
        {"temperature": 95, "hold_time_seconds": 15},
        {"temperature": 60, "hold_time_seconds": 60},
        {"temperature": 72, "hold_time_seconds": 60},
    ],
    repetitions=30,
    block_max_volume=50,
)

# Final extension
tc.set_block_temperature(72, hold_time_minutes=5, block_max_volume=50)

# Hold at 4°C
tc.set_block_temperature(4)
tc.deactivate_lid()
tc.open_lid()
```

## Heater-Shaker

```python
hs = protocol.load_module("heaterShakerModuleV1", "D1")
adapter = hs.load_adapter("opentrons_96_pcr_adapter")
plate = adapter.load_labware("nest_96_wellplate_200ul_pcr_full_skirt")

# Latch control (must close before shaking)
hs.open_labware_latch()
hs.close_labware_latch()

# Shaking
hs.set_and_wait_for_shake_speed(rpm=1000)   # 200–3000 RPM
hs.deactivate_shaker()                       # Must stop before pipetting (not stop_shaking)

# Temperature
hs.set_and_wait_for_temperature(celsius=37)
hs.set_target_temperature(celsius=37)         # Async
hs.wait_for_temperature()
hs.deactivate_heater()

# Properties
hs.current_temperature
hs.target_temperature
hs.current_speed
hs.target_speed
hs.status   # "idle", "running", "stalled"
```

### Heater-Shaker Adapters

- `opentrons_96_pcr_adapter` — for PCR plates
- `opentrons_96_deep_well_adapter` — for deep well plates
- `opentrons_96_flat_bottom_adapter` — for flat bottom plates
- `opentrons_universal_flat_adapter` — universal

### Important: Pipetting with Heater-Shaker

The pipette cannot access the Heater-Shaker while it is shaking. Always call `hs.stop_shaking()` before aspirating/dispensing on the HS. The latch must be closed during shaking but can be open for pipette access.

## Magnetic Block (Flex Only)

Unpowered passive module. Simply place a plate on it for bead separation.

```python
mag_block = protocol.load_module("magneticBlockV1", "C1")

# Move plate to magnetic block for separation
protocol.move_labware(plate, mag_block, use_gripper=True)
protocol.delay(minutes=2)  # Wait for beads to separate

# Move plate off for pipetting
protocol.move_labware(plate, "D1", use_gripper=True)
```

## Magnetic Module (OT-2 Only)

```python
mag_mod = protocol.load_module("magnetic module gen2", "1")
plate = mag_mod.load_labware("nest_96_wellplate_2ml_deep")

mag_mod.engage(height_from_base=6)  # mm from labware base
mag_mod.disengage()

# Properties
mag_mod.status  # "engaged" or "disengaged"
```

## Absorbance Plate Reader (Flex Only, API 2.21+)

```python
apr = protocol.load_module("absorbanceReaderV1", "B3")

# IMPORTANT: lid must be closed BEFORE initialize
apr.close_lid()
apr.initialize("single", [450], reference_wavelength=600)
# Modes: "single" (1 wavelength) or "multi" (up to 6)
# Multi example: apr.initialize("multi", [450, 570, 600])
apr.open_lid()

# Move plate in
protocol.move_labware(plate, apr, use_gripper=True)
apr.close_lid()

# Read
result = apr.read(export_filename="data.csv")

# Move plate out
apr.open_lid()
protocol.move_labware(plate, "D1", use_gripper=True)
```

> **Gotcha**: calling `apr.initialize()` without first calling `apr.close_lid()` raises `CannotPerformModuleAction: Cannot perform Initialize action on Absorbance Reader without calling .close_lid() first.`

## Flex Stacker (Flex Only, API 2.25+)

```python
stacker = protocol.load_module("flexStackerModuleV1", "D4")
stacker.set_stored_labware(
    load_name="opentrons_flex_96_tiprack_1000ul",
    count=6,
    lid="opentrons_flex_tiprack_lid",  # Optional
)

# Retrieve labware from stacker
tip_rack = stacker.retrieve()

# Move and use
protocol.move_labware(tip_rack, "C2", use_gripper=True)

# Store labware back
stacker.store(tip_rack)
```

## Concurrent Module Operations (API 2.27+)

```python
# Start async operations
hs_task = hs.set_target_temperature(celsius=37)
tc_task = tc.start_execute_profile(steps=[...], repetitions=30)
temp_task = temp_mod.start_set_temperature(4)

# Wait for all to complete
protocol.wait_for_tasks([hs_task, tc_task, temp_task])
```

## Lid Operations (API 2.23+, Flex Only)

```python
# Load a stack of lids
lids = protocol.load_lid_stack(
    load_name="opentrons_tough_pcr_auto_sealing_lid",
    location="A4",
    quantity=5,
    adapter="opentrons_flex_deck_riser",
)

# Move lid onto plate
protocol.move_lid(source_location=lids, new_location=plate, use_gripper=True)

# Remove lid
protocol.move_lid(source_location=plate, new_location=waste_chute, use_gripper=True)
```
