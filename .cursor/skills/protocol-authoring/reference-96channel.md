# Flex 96-Channel Pipette Reference

> **Full source doc**: `opentrons-ai-server/api/storage/docs/96-channel-pipette.md`
> (1580 lines — read it for complete labware compatibility lists, advanced patterns, and full protocol examples)

---

## Critical Constraints

The 96-channel pipette (`flex_96channel_1000`) has fundamental physical constraints that shape protocol design:

- **Cannot access tubes** — no microcentrifuge tubes (1.5 mL, 2 mL), conical tubes (15 mL, 50 mL), PCR strip tubes, or any non-standard well spacing.
- **Occupies both pipette mounts** — you cannot load another pipette on a robot with the 96-channel.
- **Requires 9 mm well spacing** — only plate-format labware is compatible.
- **All reagents must be pre-aliquoted** into plates or reservoirs before the protocol runs.

---

## Compatible Labware (96-Channel)

**Reservoirs:**

- `nest_1_reservoir_195ml` — preferred for bulk reagent dispensing (all 96 tips access the same well)
- `nest_1_reservoir_290ml`
- `agilent_1_reservoir_290ml`
- `axygen_1_reservoir_90ml`

**96-Well Plates:**

- `nest_96_wellplate_2ml_deep` — samples
- `corning_96_wellplate_360ul_flat`
- `nest_96_wellplate_200ul_flat`
- `nest_96_wellplate_100ul_pcr_full_skirt`
- `biorad_96_wellplate_200ul_pcr`
- `opentrons_96_wellplate_200ul_pcr_full_skirt`

**NOT compatible:** 12-well reservoirs, tube racks, strip tubes.

---

## Tip Rack Configuration

| Use Case                             | Tip Rack          | Adapter                                           |
| ------------------------------------ | ----------------- | ------------------------------------------------- |
| Full 96-tip pickup                   | Any Flex tip rack | **Required**: `opentrons_flex_96_tiprack_adapter` |
| Partial pickup (COLUMN, SINGLE, ROW) | Any Flex tip rack | **No adapter**                                    |

```python
# Full pickup — adapter via load_labware()
tips_full = protocol.load_labware(
    "opentrons_flex_96_tiprack_1000ul", "C2",
    adapter="opentrons_flex_96_tiprack_adapter"
)

# Partial pickup — no adapter
tips_partial = protocol.load_labware(
    "opentrons_flex_96_tiprack_1000ul", "C1"
)
```

---

## Nozzle Layout Configurations

Import constants from `opentrons.protocol_api`:

```python
from opentrons.protocol_api import ALL, COLUMN, ROW, SINGLE
```

| Style    | Tips Used | Use Case                                      | Required `start`     |
| -------- | --------- | --------------------------------------------- | -------------------- |
| `ALL`    | 96        | Full plate replication, bulk dispensing       | N/A                  |
| `COLUMN` | 8         | Column-by-column work, behaves like 8-channel | `"A12"` (not `"A1"`) |
| `ROW`    | 12        | Row-by-row operations                         | `"H1"`               |
| `SINGLE` | 1         | Precision single-well work                    | `"H12"` or `"A1"`    |

```python
# Full plate operation
pipette.configure_nozzle_layout(style=ALL, tip_racks=[tips_full])

# Column mode (8 tips) — MUST use "A12", not "A1"
pipette.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tips_partial])

# Single tip mode — use H12 (has pressure sensor)
pipette.configure_nozzle_layout(style=SINGLE, start="H12", tip_racks=[tips_partial])
```

---

## Critical: Column Mode Start Position

**Always use `start="A12"` for COLUMN mode**, not `"A1"`.

Using `"A1"` causes a `PartialTipMovementNotAllowedError` because the nozzle block extends to the left and hits the deck edge.

```python
# CORRECT
pipette.configure_nozzle_layout(style=COLUMN, start="A12", tip_racks=[tips_partial])

# WRONG — causes collision error
pipette.configure_nozzle_layout(style=COLUMN, start="A1", tip_racks=[tips_partial])
```

---

## Reservoir Strategy: 8-Channel vs. 96-Channel

```python
# 8-channel: 12-well reservoir, one well per column
reservoir_12 = protocol.load_labware("nest_12_reservoir_15ml", "D1")
p8.aspirate(100, reservoir_12.wells()[col_index])

# 96-channel: single-well reservoir, all 96 tips from same well
reservoir_1 = protocol.load_labware("nest_1_reservoir_195ml", "D1")
p96.aspirate(100, reservoir_1["A1"])  # All 96 tips access this well simultaneously
p96.dispense(100, plate["A1"])        # Dispenses to all 96 wells
```

**Volume planning for single-well reservoirs:** add 10–20% excess for dead volume.

---

## Minimal 96-Channel Protocol Template

```python
from opentrons import protocol_api
from opentrons.protocol_api import ALL, COLUMN

metadata = {"protocolName": "96-Channel Transfer Demo"}
requirements = {"robotType": "Flex", "apiLevel": "<MAX_SUPPORTED_VERSION>"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    trash = protocol.load_trash_bin("A3")

    # Full pickup requires adapter
    tips = protocol.load_labware(
        "opentrons_flex_96_tiprack_1000ul", "C2",
        adapter="opentrons_flex_96_tiprack_adapter"
    )

    reservoir = protocol.load_labware("nest_1_reservoir_195ml", "D1")
    dest_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "D2")

    p96 = protocol.load_instrument("flex_96channel_1000", tip_racks=[tips])

    reagent = protocol.define_liquid(
        name="Reagent", description="Buffer", display_color="#00AAFF"
    )
    reservoir["A1"].load_liquid(liquid=reagent, volume=10000)

    p96.configure_nozzle_layout(style=ALL, tip_racks=[tips])
    p96.transfer(100, reservoir["A1"], dest_plate["A1"])
```

---

## Tip Management

```python
pipette.drop_tip()        # Drop in trash (cannot return full pickup to partial rack)
pipette.return_tip()      # Return to original position (only safe for full pickup to full rack)
pipette.reset_tipracks()  # Reset all tip rack usage counters (useful for repeated runs)
```

- After a **partial configuration change**, re-specify `tip_racks` in `configure_nozzle_layout`.
- Minimize nozzle layout configuration changes — group operations by configuration type.

---

## Pressure Sensor / Liquid Detection

Pressure sensors are located at channels **A1** and **H12**. Liquid detection only works with these channels in `SINGLE` mode:

```python
pipette.configure_nozzle_layout(style=SINGLE, start="H12")
if pipette.detect_liquid_presence(well):
    pipette.aspirate(volume, well)
else:
    protocol.pause("Check liquid levels in well")
```
