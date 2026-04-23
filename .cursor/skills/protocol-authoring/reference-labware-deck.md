# Labware & Deck Layout Reference

> **Full source docs** (read these for complete catalog or deep detail):
>
> - Full labware catalog (86 entries): `opentrons-ai-server/api/storage/docs/standard-loadname-info.md`
> - Deck layout rules (full): `opentrons-ai-server/api/storage/docs/deck_layout.md`
> - OT-2 → Flex migration guide: `opentrons-ai-server/api/storage/docs/OT2ToFlex.md`

---

## Most-Used Labware Load Names

### Well Plates

| Load Name                                     | Wells | Max Vol | Shape    |
| --------------------------------------------- | ----- | ------- | -------- |
| `nest_96_wellplate_2ml_deep`                  | 96    | 2 mL    | U-bottom |
| `corning_96_wellplate_360ul_flat`             | 96    | 360 µL  | Flat     |
| `nest_96_wellplate_200ul_flat`                | 96    | 200 µL  | Flat     |
| `nest_96_wellplate_100ul_pcr_full_skirt`      | 96    | 100 µL  | V-bottom |
| `biorad_96_wellplate_200ul_pcr`               | 96    | 200 µL  | V-bottom |
| `opentrons_96_wellplate_200ul_pcr_full_skirt` | 96    | 200 µL  | V-bottom |
| `corning_384_wellplate_112ul_flat`            | 384   | 112 µL  | Flat     |
| `corning_24_wellplate_3.4ml_flat`             | 24    | 3.4 mL  | Flat     |

### Reservoirs

| Load Name                   | Wells | Max Vol    |
| --------------------------- | ----- | ---------- |
| `nest_1_reservoir_195ml`    | 1     | 195 mL     |
| `nest_1_reservoir_290ml`    | 1     | 290 mL     |
| `nest_12_reservoir_15ml`    | 12    | 15 mL/well |
| `agilent_1_reservoir_290ml` | 1     | 290 mL     |

### Tube Racks

| Load Name                                                | Tubes | Max Vol  |
| -------------------------------------------------------- | ----- | -------- |
| `opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap` | 24    | 1.5 mL   |
| `opentrons_24_tuberack_generic_2ml_screwcap`             | 24    | 2 mL     |
| `opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical`     | 10    | 50/15 mL |
| `opentrons_6_tuberack_falcon_50ml_conical`               | 6     | 50 mL    |

### Flex Tip Racks

| Volume  | Standard                           | Filter                                   |
| ------- | ---------------------------------- | ---------------------------------------- |
| 50 µL   | `opentrons_flex_96_tiprack_50ul`   | `opentrons_flex_96_filtertiprack_50ul`   |
| 200 µL  | `opentrons_flex_96_tiprack_200ul`  | `opentrons_flex_96_filtertiprack_200ul`  |
| 1000 µL | `opentrons_flex_96_tiprack_1000ul` | `opentrons_flex_96_filtertiprack_1000ul` |

### OT-2 Tip Racks

| Volume  | Load Name                     |
| ------- | ----------------------------- |
| 10 µL   | `opentrons_96_tiprack_10ul`   |
| 20 µL   | `opentrons_96_tiprack_20ul`   |
| 300 µL  | `opentrons_96_tiprack_300ul`  |
| 1000 µL | `opentrons_96_tiprack_1000ul` |

### Adapters (Flex)

| Load Name                                                      | Use                                |
| -------------------------------------------------------------- | ---------------------------------- |
| `opentrons_flex_96_tiprack_adapter`                            | Required for 96-channel tip pickup |
| `opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep`       | Deep well plate on thermocycler    |
| `opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt` | PCR plate on thermocycler          |
| `opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat`   | Flat plate on temp module          |

---

## Flex Deck Layout

Deck coordinates: **D1–D3** (front row) → **C1–C3** → **B1–B3** → **A1–A3** (back row)

### Module Placement (Flex)

| Module                  | Recommended | Allowed                        | Forbidden              |
| ----------------------- | ----------- | ------------------------------ | ---------------------- |
| Heater-Shaker           | D1          | A1, B1, C1, D1, A3, B3, C3, D3 | A2, B2, C2, D2         |
| Magnetic Block          | D2          | Any non-staging-area slot      | A4, B4, C4, D4         |
| Temperature Module      | D1          | A1, B1, C1, D1, A3, B3, C3, D3 | A2, B2, C2, D2         |
| Thermocycler            | A1+B1       | A1+B1 only                     | All other slots        |
| Absorbance Plate Reader | D3          | A3, B3, C3, D3                 | All column 1 & 2 slots |

### Fixture Placement (Flex)

| Fixture            | Placement                                         |
| ------------------ | ------------------------------------------------- |
| Trash bin          | A3 (recommended); also A1, B1, C1, D1, B3, C3, D3 |
| Waste chute        | D3 only                                           |
| Staging area slots | A3, B3, C3, or D3 → unlocks A4, B4, C4, D4        |

**Staging area constraints:**

- Column 4 slots (A4–D4) are **gripper-accessible only** — no pipetting allowed there.
- Tube racks cannot be placed in staging area slots (gripper cannot safely move them).
- Trash bin and staging area slot cannot share the same deck position.

### Labware Placement Order (Flex)

Place shortest to tallest from front-left to back-right:

| Labware Type        | Recommended Slots                     |
| ------------------- | ------------------------------------- |
| Well plates         | D1, D2, D3                            |
| Reservoirs          | C1, C2, C3                            |
| Tube racks          | B1, B2, B3                            |
| Tip racks           | A2, A1 (A3 only if no trash there)    |
| 96-tip rack adapter | A2, B2, C2, D2 (avoid module columns) |

---

## OT-2 Deck Layout

Deck slots: **1–11**, trash bin fixed at position 12.

### Module Placement (OT-2)

| Module             | Recommended | Allowed              | Forbidden       |
| ------------------ | ----------- | -------------------- | --------------- |
| Heater-Shaker      | 1           | 1, 3, 4, 6, 7        | 2, 5, 8, 9, 11  |
| Magnetic Module    | 1           | 1, 3, 4, 6, 7, 9, 10 | 2, 5, 8, 11     |
| Temperature Module | 3           | 1, 4, 6, 7, 9, 10    | 2, 5, 8, 11     |
| Thermocycler       | 7+8+10+11   | 7+8+10+11 only       | All other slots |

**OT-2 module notes:**

- Magnetic Block (Gen3) and Absorbance Plate Reader are Flex-only.
- Thermocycler occupies slots 7, 8, 10, and 11 simultaneously.

### Labware Placement Order (OT-2)

| Labware Type | Recommended Slots            |
| ------------ | ---------------------------- |
| Well plates  | 1, 2, 3                      |
| Reservoirs   | 4, 5, 6                      |
| Tube racks   | 7, 8, 9                      |
| Tip racks    | 11, 10, 9 (back-right first) |

---

## OT-2 → Flex Slot Conversion

| OT-2 | Flex |     | OT-2       | Flex |
| ---- | ---- | --- | ---------- | ---- |
| 1    | D1   |     | 7          | B1   |
| 2    | D2   |     | 8          | B2   |
| 3    | D3   |     | 9          | B3   |
| 4    | C1   |     | 10         | A1   |
| 5    | C2   |     | 11         | A2   |
| 6    | C3   |     | 12 (trash) | A3   |

Slots A4, B4, C4, D4 exist only on Flex (staging area, gripper-only).

---

## OT-2 → Flex Migration Checklist

### 1. Metadata & Requirements

Move `apiLevel` out of `metadata` into `requirements`; do **not** specify it in both.

```python
# OT-2
metadata = {"protocolName": "My Protocol", "apiLevel": "2.19"}

# Flex
metadata = {"protocolName": "My Protocol"}
requirements = {"robotType": "Flex", "apiLevel": "2.19"}
```

### 2. Trash Bin (must load before any `drop_tip()`)

```python
trash = protocol.load_trash_bin("A3")
```

### 3. Pipette Names

| OT-2                | Flex equivalent      |
| ------------------- | -------------------- |
| `p20_single_gen2`   | `flex_1channel_50`   |
| `p20_multi_gen2`    | `flex_8channel_50`   |
| `p300_single_gen2`  | `flex_1channel_1000` |
| `p300_multi_gen2`   | `flex_8channel_1000` |
| `p1000_single_gen2` | `flex_1channel_1000` |

### 4. Module Load Names

| OT-2 Module                | Flex Action                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `temperature module gen2`  | Same load name works                                                                      |
| `thermocycler module gen2` | Same load name works                                                                      |
| `heaterShakerModuleV1`     | Same load name works                                                                      |
| `magnetic module gen2`     | **Not compatible.** Use `magnetic_block` + `protocol.move_labware(..., use_gripper=True)` |

**Magnetic Module → Magnetic Block conversion:**

```python
# OT-2: pipette entire plate to magnetic module, then engage
mag_mod.engage()

# Flex: move plate with gripper to magnetic block (no pipetting needed)
hs_mod.open_labware_latch()
protocol.move_labware(sample_plate, mag_block, use_gripper=True)
```
