---
name: protocol-authoring
description: Create valid Opentrons Python API protocols for OT-2 and Flex robots. Use when creating, writing, editing, or helping with protocol files, liquid handling automation, or Opentrons protocol development. Also use when debugging protocol errors to trace into API source code.
---

# Opentrons Protocol Authoring

## Behavior Defaults — READ FIRST

This skill is primarily used by **developers, SDETs, and QA** who need protocols for testing and development. Follow these defaults unless the user explicitly says otherwise:

1. **Don't ask unnecessary questions.** Pick reasonable labware, volumes, and pipettes. Just produce a valid, working protocol.
2. **Keep protocols minimal.** Use the fewest steps needed to demonstrate the requested behavior. Don't generate dozens of repeated transfers — 2–4 operations are enough to validate a feature.
3. **Always define liquids** with `protocol.define_liquid()` and `well.load_liquid()` for all source wells.
4. **Default to liquid class functions** (`transfer_with_liquid_class`, `distribute_with_liquid_class`, `consolidate_with_liquid_class`) on Flex with API >= 2.24. Fall back to plain `transfer`/`distribute`/`consolidate` only for OT-2 or when the user explicitly asks.
5. **Default to Flex** unless the user specifies OT-2.
6. **Use the latest API version** unless the user specifies otherwise. Look up `MAX_SUPPORTED_VERSION` in `api/src/opentrons/protocols/api_support/definitions.py` to get the current value.
7. **Default liquid class**: `water`. Use `glycerol_50` or `ethanol_80` if the protocol context calls for viscous or volatile liquids.
8. **Reasonable defaults**: `flex_1channel_1000` pipette, `opentrons_flex_96_tiprack_1000ul` tip rack, `nest_96_wellplate_2ml_deep` plate, 100 µL transfer volume.

## Quick Start — Flex Protocol (Default)

```python
from opentrons import protocol_api

metadata = {
    "protocolName": "Liquid Class Transfer Demo",
    "author": "Opentrons",
    "description": "Minimal transfer using liquid classes",
}

requirements = {"robotType": "Flex", "apiLevel": "<MAX_SUPPORTED_VERSION>"}
# ^^^ Replace <MAX_SUPPORTED_VERSION> with the value from
# api/src/opentrons/protocols/api_support/definitions.py

def run(protocol: protocol_api.ProtocolContext) -> None:
    trash = protocol.load_trash_bin("A3")

    tiprack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D2")
    source_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "D1")
    dest_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "C1")

    pipette = protocol.load_instrument(
        "flex_1channel_1000", mount="left", tip_racks=[tiprack]
    )

    # Define and load liquids
    sample = protocol.define_liquid(
        name="Sample", description="Aqueous sample", display_color="#0088FF"
    )
    source_plate["A1"].load_liquid(liquid=sample, volume=500)
    source_plate["A2"].load_liquid(liquid=sample, volume=500)

    # Use liquid class transfer (default: water)
    water = protocol.get_liquid_class(name="water")
    pipette.transfer_with_liquid_class(
        liquid_class=water,
        volume=100,
        source=[source_plate["A1"], source_plate["A2"]],
        dest=[dest_plate["A1"], dest_plate["A2"]],
        new_tip="always",
    )
```

## Quick Start — OT-2 Protocol

```python
from opentrons import protocol_api

metadata = {
    "protocolName": "OT-2 Transfer Demo",
    "author": "Opentrons",
    "description": "Minimal transfer for OT-2",
}

requirements = {"robotType": "OT-2", "apiLevel": "<MAX_SUPPORTED_VERSION>"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    tiprack = protocol.load_labware("opentrons_96_tiprack_300ul", "1")
    source_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "2")
    dest_plate = protocol.load_labware("nest_96_wellplate_2ml_deep", "3")

    pipette = protocol.load_instrument(
        "p300_single_gen2", mount="left", tip_racks=[tiprack]
    )

    sample = protocol.define_liquid(
        name="Sample", description="Aqueous sample", display_color="#0088FF"
    )
    source_plate["A1"].load_liquid(liquid=sample, volume=500)

    pipette.transfer(100, source_plate["A1"], dest_plate["A1"])
```

## Required Elements

1. **`requirements` dict** — `robotType` (`"Flex"` or `"OT-2"`) and `apiLevel`
2. **`def run(protocol):`** — entry point receiving `ProtocolContext`
3. **Flex only**: must load trash bin or waste chute before any `drop_tip`

`metadata` dict is optional but recommended. `apiLevel` goes in `metadata` OR `requirements`, not both.

**Look up the current max API version** from `MAX_SUPPORTED_VERSION` in `api/src/opentrons/protocols/api_support/definitions.py`. Flex requires >= 2.15.

## Liquid Classes (Default for Flex)

Available liquid classes (Flex, API >= 2.24):

| Name          | Type     | When to Use                         |
| ------------- | -------- | ----------------------------------- |
| `water`       | Aqueous  | Default for most protocols          |
| `glycerol_50` | Viscous  | Viscous samples, glycerol solutions |
| `ethanol_80`  | Volatile | Ethanol, volatile solvents          |

```python
water = protocol.get_liquid_class(name="water")

# Transfer (1-to-1)
pipette.transfer_with_liquid_class(
    liquid_class=water, volume=100,
    source=[plate["A1"]], dest=[plate["B1"]],
    new_tip="always",
)

# Distribute (1-to-many)
pipette.distribute_with_liquid_class(
    liquid_class=water, volume=50,
    source=reservoir["A1"], dest=plate.rows()[0][:4],
    new_tip="once",
)

# Consolidate (many-to-1)
pipette.consolidate_with_liquid_class(
    liquid_class=water, volume=50,
    source=plate.rows()[0][:4], dest=reservoir["A1"],
    new_tip="once",
)
```

## Defining Liquids (Always Do This)

```python
sample = protocol.define_liquid(
    name="Sample", description="Aqueous sample", display_color="#0088FF"
)
buffer = protocol.define_liquid(
    name="Buffer", description="Wash buffer", display_color="#00CC66"
)
reagent = protocol.define_liquid(
    name="Reagent", description="Reaction reagent", display_color="#FF4444"
)

source_plate["A1"].load_liquid(liquid=sample, volume=500)
reservoir["A1"].load_liquid(liquid=buffer, volume=10000)
```

Common display colors: `#0088FF` (blue/sample), `#00CC66` (green/buffer), `#FF4444` (red/reagent), `#FFB800` (yellow/media), `#9933FF` (purple/enzyme), `#FF6B35` (orange/beads).

## OT-2 vs Flex Key Differences

| Feature        | OT-2            | Flex                                       |
| -------------- | --------------- | ------------------------------------------ |
| Deck slots     | 1–11 (numeric)  | A1–D4 (alphanumeric)                       |
| Trash          | Fixed (slot 12) | Must call `load_trash_bin()`               |
| Liquid classes | Not supported   | `get_liquid_class()` (API 2.24+)           |
| Gripper        | N/A             | `move_labware(lw, dest, use_gripper=True)` |
| 96-channel     | N/A             | `flex_96channel_1000`                      |

### Flex Deck Layout

```text
     1        2        3        4 (staging)
A  [ A1 ]  [ A2 ]  [ A3 ]  [ A4 ]
B  [ B1 ]  [ B2 ]  [ B3 ]  [ B4 ]
C  [ C1 ]  [ C2 ]  [ C3 ]  [ C4 ]
D  [ D1 ]  [ D2 ]  [ D3 ]  [ D4 ]
```

### OT-2 Deck Layout

```text
 10    11    12(trash)
  7     8     9
  4     5     6
  1     2     3
```

## Pipettes

### Flex

| Name                  | Channels | Range     |
| --------------------- | -------- | --------- |
| `flex_1channel_50`    | 1        | 1–50 µL   |
| `flex_1channel_200`   | 1        | 1–200 µL  |
| `flex_1channel_1000`  | 1        | 5–1000 µL |
| `flex_8channel_50`    | 8        | 1–50 µL   |
| `flex_8channel_200`   | 8        | 1–200 µL  |
| `flex_8channel_1000`  | 8        | 5–1000 µL |
| `flex_96channel_1000` | 96       | 5–1000 µL |

### OT-2

| Name                | Channels | Range       |
| ------------------- | -------- | ----------- |
| `p20_single_gen2`   | 1        | 1–20 µL     |
| `p300_single_gen2`  | 1        | 20–300 µL   |
| `p1000_single_gen2` | 1        | 100–1000 µL |
| `p20_multi_gen2`    | 8        | 1–20 µL     |
| `p300_multi_gen2`   | 8        | 20–300 µL   |

## Common Labware

**Flex tip racks**: `opentrons_flex_96_tiprack_50ul`, `opentrons_flex_96_tiprack_200ul`, `opentrons_flex_96_tiprack_1000ul`

**OT-2 tip racks**: `opentrons_96_tiprack_20ul`, `opentrons_96_tiprack_300ul`, `opentrons_96_tiprack_1000ul`

**Plates**: `nest_96_wellplate_2ml_deep`, `corning_96_wellplate_360ul_flat`, `opentrons_96_wellplate_200ul_pcr_full_skirt`, `nest_96_wellplate_200ul_flat`

**Reservoirs**: `nest_12_reservoir_15ml`, `nest_1_reservoir_195ml`, `nest_1_reservoir_290ml`

**Tube racks**: `opentrons_24_tuberack_nest_1.5ml_snapcap`, `opentrons_6_tuberack_nest_50ml_conical`

## Modules Quick Reference

```python
temp_mod = protocol.load_module("temperature module gen2", "D1")
tc = protocol.load_module("thermocycler module gen2")        # A1+B1 on Flex
hs = protocol.load_module("heaterShakerModuleV1", "C1")
mag_block = protocol.load_module("magneticBlockV1", "C1")    # Flex only
mag_mod = protocol.load_module("magnetic module gen2", "1")   # OT-2 only
apr = protocol.load_module("absorbanceReaderV1", "B3")        # Flex, API 2.21+
stacker = protocol.load_module("flexStackerModuleV1", "D4")   # Flex, API 2.25+
```

For detailed module operations, see [reference-modules.md](reference-modules.md).

## Runtime Parameters (API 2.18+)

```python
def add_parameters(parameters: protocol_api.Parameters) -> None:
    parameters.add_int(variable_name="sample_count", display_name="Samples",
                       default=8, minimum=1, maximum=96)
    parameters.add_bool(variable_name="dry_run", display_name="Dry Run", default=False)

def run(protocol: protocol_api.ProtocolContext) -> None:
    count = protocol.params.sample_count
```

For complete RTP guide, see [reference-rtp.md](reference-rtp.md).

## Working Directories (Monorepo Root)

All local dev artifacts live in these gitignored directories:

| Directory             | Purpose                            |
| --------------------- | ---------------------------------- |
| `tmp-protocols/`      | Protocol `.py` files               |
| `tmp-custom-labware/` | Custom labware `.json` definitions |
| `tmp-csv/`            | CSV files for RTP inputs           |

## Custom Labware

Custom labware JSON files go in `tmp-custom-labware/`. The `parameters.loadName` in the JSON is the string passed to `load_labware()`.

### Creating a Custom Labware Definition

The easiest starting point is copying an existing definition from `shared-data/labware/definitions/2/<name>/<version>.json` and modifying the key fields:

```json
{
  "namespace": "custom",
  "version": 1,
  "parameters": {
    "loadName": "my_custom_plate"
  },
  "metadata": {
    "displayName": "My Custom Plate"
  }
  ...
}
```

**Required changes** when deriving from an existing definition:

- `parameters.loadName` → your unique load name (no spaces, underscores OK)
- `namespace` → `"custom"` (must not be `"opentrons"`)
- `version` → `1`
- `metadata.displayName` → human-readable name

Save as `tmp-custom-labware/<loadName>.json` (file name convention matches `loadName`).

### Using Custom Labware in a Protocol

```python
plate = protocol.load_labware("my_custom_plate", "D1")
```

No special import needed — the CLI handles loading the definition at run time.

### For a proper custom labware definition from scratch, use the [Opentrons Labware Creator](https://labware.opentrons.com/create/)

## CSV Runtime Parameters

CSV files go in `tmp-csv/`. They are used exclusively via the `add_csv_file` RTP type (API 2.20+).

### Defining a CSV Parameter

```python
def add_parameters(parameters: protocol_api.Parameters) -> None:
    parameters.add_csv_file(
        variable_name="transfer_map",
        display_name="Transfer Map",
        description="CSV with columns: source_well, dest_well, volume_ul",
    )
```

### Using the CSV in `run()`

```python
rows = protocol.params.transfer_map.parse_as_csv()
# rows is a list of lists; rows[0] is the header row
for row in rows[1:]:
    src, dst, vol = row[0].strip(), row[1].strip(), float(row[2].strip())
    pipette.transfer(vol, source[src], dest[dst])
```

### Example CSV (`tmp-csv/transfer_map.csv`)

```text
source_well,dest_well,volume_ul
A1,A1,100
A2,A2,150
A3,A3,75
```

> **Note**: `opentrons_simulate` cannot accept RTP files. Protocols with CSV RTPs must be verified with `opentrons analyze`. See the `protocol-verification` skill.

## Additional References

### Skill Reference Files (in this directory)

| File                                                         | When to use                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [reference-liquid-handling.md](reference-liquid-handling.md) | Detailed liquid handling patterns, tip math, transfer anti-patterns             |
| [reference-modules.md](reference-modules.md)                 | Module load names, operations, Flex Stacker, APR                                |
| [reference-rtp.md](reference-rtp.md)                         | Runtime parameters — all types, CSV RTPs                                        |
| [reference-source-map.md](reference-source-map.md)           | Source code navigation for debugging                                            |
| [reference-labware-deck.md](reference-labware-deck.md)       | Common labware load names, deck layout rules (Flex + OT-2), OT-2→Flex migration |
| [reference-96channel.md](reference-96channel.md)             | 96-channel pipette constraints, nozzle configs, tip adapter rules               |
| [reference-examples-index.md](reference-examples-index.md)   | Index of AI server example docs — what each covers and when to read it          |

### AI Server Source Docs (read on demand)

Located in `opentrons-ai-server/api/storage/docs/`. Use [reference-examples-index.md](reference-examples-index.md) to decide which file to read. Do not read all of them — they total ~10,000 lines. Read only what the current task needs.

| File                            | Contents                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| `full-examples.md`              | Complete production protocols (PCR, reagent transfer, HS)          |
| `casual_examples.md`            | Casual NL → protocol mappings, pooling, triplicates                |
| `serial_dilution_examples.md`   | Serial dilution patterns (single/multi-channel, row/column-wise)   |
| `pcr_protocols_with_csv.md`     | PCR + CSV RTP well mapping, thermocycler profiles                  |
| `transfer_function_notes.md`    | `transfer()` deep dive — loops, tip behavior, modules              |
| `out_of_tips_error_219.md`      | Tip math, multi-channel capacity, index error prevention           |
| `commands-v0.0.1.md`            | Common command patterns and pitfalls                               |
| `standard-loadname-info.md`     | Full labware catalog (86 items)                                    |
| `96-channel-pipette.md`         | Full 96-channel guide (see `reference-96channel.md` for summary)   |
| `deck_layout.md`                | Full deck rules (see `reference-labware-deck.md` for summary)      |
| `OT2ToFlex.md`                  | Full migration guide (see `reference-labware-deck.md` for summary) |
| `transfer_with_liquid_class.md` | Liquid class transfer differences and custom properties            |
| `flex_stacker_usage.md`         | Flex Stacker patterns (see `reference-modules.md` for summary)     |
| `runtime_parameters.md`         | RTP examples (see `reference-rtp.md` for summary)                  |

## Keeping This Skill Current

**Update this skill whenever you discover something new.** These files are the team's shared knowledge base — stale information hurts everyone.

| Trigger                                                                         | What to update                                                                                                         |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A new API method, parameter, or behavior is used                                | Add it to the relevant section in `SKILL.md` or the appropriate `reference-*.md`                                       |
| A bug or constraint is found via source inspection                              | Add it to `reference-source-map.md` under the relevant debugging section                                               |
| `MAX_SUPPORTED_VERSION` changes                                                 | Check `api/src/opentrons/protocols/api_support/definitions.py` and add any new API-version-gated features to the skill |
| A new labware load name is used                                                 | Add it to the Common Labware list                                                                                      |
| A new liquid class becomes available in `shared-data/liquid-class/definitions/` | Add it to the Liquid Classes table                                                                                     |
| Actual behavior differs from what this skill says                               | Correct the skill, not just the protocol                                                                               |
| A new module is supported                                                       | Add it to the Modules section and `reference-modules.md`                                                               |

**How to update**: use the Write or StrReplace tools on the relevant skill file. Keep edits focused — fix only what changed. Don't rewrite sections that are still accurate.

## Common Mistakes

- Forgetting `load_trash_bin()` on Flex
- Using OT-2 pipette names on Flex or vice versa
- Putting `apiLevel` in both `metadata` and `requirements`
- Using numeric slots on Flex or alpha on OT-2
- Exceeding pipette volume range
- Using `transfer` with `new_tip="never"` without calling `pick_up_tip()` first
- Forgetting to `define_liquid` / `load_liquid` for source wells
- Using plain `transfer` on Flex when `transfer_with_liquid_class` is available
- Calling `apr.initialize()` without `apr.close_lid()` first (APR lid must be closed before init)
- Passing only the top well (e.g. `plate["A1"]`) to 8-channel `*_with_liquid_class` — must pass full column or set `group_wells=False`
- Using f-strings or variable references in `metadata` dict — the parser requires static literals only (no `f"..."`, no `{var}`, no function calls)
- Wrapping `transfer()` in a `for` loop over wells — `transfer()` handles iteration internally; pass lists instead
- Using 8-channel pipette with `wells()` instead of `columns()` — 8-channel picks up an entire column at once
- Not accounting for 8-channel tip math: one `pick_up_tip()` = 8 tips; a single 96-well rack supports only 12 column operations
- Loading a 96-channel pipette without `adapter="opentrons_flex_96_tiprack_adapter"` for full (ALL) tip pickup
- Using `start="A1"` for 96-channel COLUMN mode — always use `start="A12"` to avoid deck edge collision
- Placing a tube rack in a staging area slot (A4–D4) — gripper cannot safely move tube racks
- Loading the Heater-Shaker or Temperature Module in column 2 slots (A2, B2, C2, D2) — forbidden on Flex
