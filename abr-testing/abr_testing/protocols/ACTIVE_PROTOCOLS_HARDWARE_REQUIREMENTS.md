# ABR Active Protocols — Hardware Requirements

Hardware and tip-rack requirements for every protocol in
`abr-testing/abr_testing/protocols/active_protocols/`, derived from the
`load_instrument`, `load_module`, `load_adapter`, `load_trash_bin`,
`load_waste_chute`, `load_labware`, `set_stored_labware` and
`use_gripper=True` calls in each file (including calls made through
`helpers/run_helpers.py`).

Counts reflect **default runtime parameter values**. Items that only appear
under a non-default parameter are called out in [Conditional hardware](#conditional-hardware).

## Protocol Index

| # | File | Pipette(s) |
| --- | --- | --- |
| 1 | `1_Simple Normalize Long Right.py` | P1000 Multi (L), P1000 Single (R) |
| 2 | `2_BMS_PCR_Protocol.py` | P50 Multi |
| 4 | `4_Illumina DNA Enrichment.py` | P1000 Multi (L), P50 Multi (R) |
| 5 | `5_MiSeq Library Preparation.py` | P96 200 uL |
| 6 | `6_Olink_Target_48-96.py` | P96 1000 uL |
| 7 | `7_HDQ_DNA_Bacteria_Flex.py` | P1000 Multi |
| 8 | `8_Milllipore_Duolink_RoundWell.py` | P1000 Multi (L), P1000 Single (R) |
| 9 | `9_Magmax_RNA_Cells_Flex.py` | P1000 Multi |
| 10 | `10_ZymoBIOMICS_Magbead_DNA_Cells_Flex.py` | P1000 Multi |
| 11 | `11_IDT xGen 1000 ul 96ch.py` | P96 1000 uL |
| 12 | `12_Illumina RNA all parts.py` | P96 200 uL |
| 13 | `13_Stacker_Labware_Stamping_Test.py` | P96 1000 uL |
| 14 | `14_IDT xGen 200 ul 96ch.py` | P96 200 uL |

## Summary

- **Protocols** is how many of the 13 protocols use the item.
- **Total across all runs** is the sum over every protocol (for tip racks, this is the number of racks consumed if every protocol runs once).
- **Max in one protocol** is the most any single protocol needs at once, which is what one robot must have to run it.

| Item | Protocols | Total across all runs | Max in one protocol | Used by |
| --- | :-: | :-: | :-: | --- |
| P1000 Single | 2 | 2 | 1 | 1, 8 |
| P1000 Multi (8ch) | 6 | 6 | 1 | 1, 4, 7, 8, 9, 10 |
| P50 Single | 0 | 0 | 0 | — |
| P50 Multi (8ch) | 2 | 2 | 1 | 2, 4 |
| P96 1000 uL | 3 | 3 | 1 | 6, 11, 13 |
| P96 200 uL | 3 | 3 | 1 | 5, 12, 14 |
| Gripper | 11 | 11 | 1 | 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 |
| Mag Block | 7 | 7 | 1 | 4, 7, 9, 10, 11, 12, 14 |
| Heater-Shaker | 6 | 6 | 1 | 4, 5, 7, 8, 9, 10 |
| Temp Module | 10 | 10 | 1 | 2, 4, 5, 7, 8, 9, 10, 11, 12, 14 |
| Thermocycler | 6 | 6 | 1 | 2, 4, 5, 11, 12, 14 |
| Absorbance Reader | 1 | 1 | 1 | 9 |
| Vacuum Manifold | 0 | 0 | 0 | — |
| Deck Expansion (Riser) | 1 | 1 | 1 | 4 |
| Flex Stacker Modules | 4 | 12 | 4 | 11 (2), 12 (4), 13 (4), 14 (2) |
| Waste Chute Expansion Slot (column-4 staging slot) | 6 | 12 | 3 | 4 (2), 5 (3), 6 (2), 8 (1), 11 (2), 14 (2) |
| Waste Chute | 4 | 4 | 1 | 5, 11, 12, 14 |
| Tip Rack Adapter | 6 | 10 | 2 | 5 (1), 6 (1), 11 (2), 12 (2), 13 (2), 14 (2) |
| Trash Bin | 8 | 8 | 1 | 1, 2, 4, 6, 7, 8, 10, 13 |
| 20 uL Racks | 1 | 7 | 7 | 12 (7) |
| 50 uL Racks | 8 | 39 | 8 | 2 (2), 4 (2), 5 (2), 6 (4), 11 (8), 12 (7), 13 (6), 14 (8) |
| 200 uL Racks | 6 | 26 | 6 | 1 (3), 4 (3), 8 (3), 9 (5), 11 (6), 14 (6) |
| 1000 uL Racks | 3 | 8 | 3 | 7 (3), 8 (2), 10 (3) |

## Per-Protocol Matrix

Blank cells mean the item isn't used.

| Item | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| P1000 Single | 1 | | | | | | 1 | | | | | | |
| P1000 Multi (8ch) | 1 | | 1 | | | 1 | 1 | 1 | 1 | | | | |
| P50 Single | | | | | | | | | | | | | |
| P50 Multi (8ch) | | 1 | 1 | | | | | | | | | | |
| P96 1000 uL | | | | | 1 | | | | | 1 | | 1 | |
| P96 200 uL | | | | 1 | | | | | | | 1 | | 1 |
| Gripper | | opt | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Mag Block | | | 1 | | | 1 | | 1 | 1 | 1 | 1 | | 1 |
| Heater-Shaker | | | 1 | 1 | | 1 | 1 | 1 | 1 | | | | |
| Temp Module | | 1 | 1 | 1 | | 1 | 1 | 1 | 1 | 1 | 1 | opt | 1 |
| Thermocycler | | 1 | 1 | 1 | | | | | | 1 | 1 | | 1 |
| Absorbance Reader | | | | | | | | 1 | | | | | |
| Vacuum Manifold | | | | | | | | | | | | | |
| Deck Expansion (Riser) | | opt | 1 | | | | | | | | | | |
| Flex Stacker Modules | | | | | | | | | | 2 | 4 | 4 | 2 |
| Waste Chute Expansion Slot | | | 2 | 3 | 2 | | 1 | | | 2 | | | 2 |
| Waste Chute | | | | 1 | opt | | | | | 1 | 1 | | 1 |
| Tip Rack Adapter | | | | 1 | 1 | | | | | 2 | 2 | 2 | 2 |
| Trash Bin | 1 | 1 | 1 | | 1 | 1 | 1 | | 1 | | | 1 | |
| 20 uL Racks | | | | | | | | | | | 7 | | |
| 50 uL Racks | | 2 | 2 | 2 | 4 | | | | | 8 | 7 | 6 | 8 |
| 200 uL Racks | 3 | | 3 | | | | 3 | 5 | | 6 | | | 6 |
| 1000 uL Racks | | | | | | 3 | 2 | | 3 | | | | |

`opt` = only needed when a non-default runtime parameter is enabled (see below).

## Deck Layout Details

### 1 — Simple Normalize Long Right
- Pipettes: `flex_8channel_1000` (left), `flex_1channel_1000` (right)
- Tip racks: 200 uL × 3 (D1, D2, A1)
- Trash bin: A3
- No modules, no gripper moves

### 2 — BMS PCR Protocol
- Pipette: `flex_8channel_50` (mount set by a runtime parameter; runs in SINGLE nozzle layout)
- Modules: Thermocycler, Temp Module (D3)
- Tip racks: 50 uL × 2 (slots 8, 9 → B2, B3)
- Trash bin: A3
- Gripper, and optionally a riser at C3, only when `disposable_lid` is on (default off)

### 4 — Illumina DNA Enrichment
- Pipettes: `flex_8channel_1000` (left), `flex_8channel_50` (right)
- Modules: Heater-Shaker (D1), Temp Module (D3), Mag Block (C1), Thermocycler
- Tip racks: 200 uL × 3 (C2, B2, A2), 50 uL × 2 (C3, B3)
- Deck riser at **C4**, holding 3 auto-sealing lids (`deck_riser` defaults to True)
- Staging slots: **B4** (universal lid stack of 2), **C4** (riser)
- Trash bin: A3
- Gripper: yes (`USE_GRIPPER = True`)

### 5 — MiSeq Library Preparation
- Pipette: `flex_96channel_200`
- Modules: Thermocycler, Temp Module (C1), Heater-Shaker (D1)
- Tip racks: 50 uL × 2 (one on a tip rack adapter at B3, one partial rack at C2)
- Tip rack adapter: 1 (B3)
- Staging slots: **A4**, **C4**, **D4**. D4 sits next to the waste chute, so this needs the waste chute with staging area configuration.
- Waste chute: yes
- Gripper: yes

### 6 — Olink Target 48-96
- Pipette: `flex_96channel_1000`
- Tip racks (filter 50 uL): A1, B3, plus adapter A3 and B4 when `num_samples = 96` (default), so 4 total (2 if 48 samples)
- Tip rack adapter: 1 (A3, 96-sample mode only)
- Staging slots: **B4** (tips), **C4** (tip rack parking)
- Trash bin: D3 by default. With `waste_chute = True`, it uses a waste chute instead and also parks racks on **A4**.
- Gripper: yes (moves tip racks)

### 7 — HDQ DNA Bacteria
- Pipette: `flex_8channel_1000`
- Modules: Heater-Shaker (D1), Temp Module (D3), Mag Block (C1)
- Tip racks: 1000 uL × 3 (A1, A2, B1)
- Trash bin: A3
- Gripper: yes

### 8 — Millipore Duolink RoundWell
- Pipettes: `flex_8channel_1000` (left), `flex_1channel_1000` (right)
- Modules: Heater-Shaker (D1), Temp Module (C1, `use_temp` defaults to True)
- Tip racks: 1000 uL × 2 (B3, B2), 200 uL × 3 (B1, A2, A1)
- Staging slot: **C4** (universal lid)
- Trash bin: A3
- Gripper: yes

### 9 — MagMax RNA Cells
- Pipette: `flex_8channel_1000`
- Modules: Heater-Shaker (D1), Temp Module (D3), Mag Block (C1), Absorbance Reader (A3)
- Tip racks: 200 uL × 5 (A1, A2, B1, B2, C2)
- **No trash bin.** The Absorbance Reader occupies A3, and tips are returned to the rack (`TIP_TRASH = False`).
- Gripper: yes (Heater-Shaker and plate reader moves)

### 10 — ZymoBIOMICS Magbead DNA Cells
- Pipette: `flex_8channel_1000`
- Modules: Heater-Shaker (D1), Temp Module (D3), Mag Block (C1)
- Tip racks: 1000 uL × 3 (A1, A2, B1)
- Trash bin: A3
- Gripper: yes

### 11 — IDT xGen 1000 uL 96ch
- Pipette: `flex_96channel_1000`
- Modules: Thermocycler, Temp Module (C1), Mag Block (D2)
- Flex Stackers: **B4** holds 6 × 200 uL racks (with tip rack lids), **C4** holds 6 × 50 uL racks (with tip rack lids)
- Tip rack adapters: 2 (A2, A3), each starting with a 50 uL rack
- Tip racks: 50 uL × 8 (2 on deck + 6 in stacker), 200 uL × 6 (stacker)
- Staging slots: **A4** (Sample Plate 2), **D4** (Cleanup Plate 2, next to the waste chute)
- Waste chute: yes
- Gripper: yes

### 12 — Illumina RNA All Parts
- Pipette: `flex_96channel_200`
- Modules: Thermocycler, Temp Module (C1, `temperature_module` defaults to True), Mag Block (D2)
- Flex Stackers (4):
  - **A4**: empty, collects used 20 uL racks
  - **B4**: 6 × 20 uL racks
  - **C4**: empty, collects used 50 uL racks
  - **D4**: 6 × 50 uL racks
- Tip rack adapters: 2 (A3 starts with a 20 uL rack, C2 starts with a 50 uL rack)
- Tip racks: 20 uL × 7 (1 + 6), 50 uL × 7 (1 + 6)
- Waste chute: yes
- Gripper: yes

### 13 — Stacker Labware Stamping Test
- Pipette: `flex_96channel_1000`
- Flex Stackers (4):
  - **A4**: 6 × 50 uL racks
  - **B4**: 6 PCR plates
  - **C4**: 6 × 384-well plates
  - **D4**: 6 NEST deep-well plates
- Tip rack adapters: 2 (A2, A3)
- Tip racks: 50 uL × 6 (all from the stacker)
- Trash bin: A1
- Gripper: yes

### 14 — IDT xGen 200 uL 96ch
- Pipette: `flex_96channel_200`
- Same deck layout as protocol 11:
  - Modules: Thermocycler, Temp Module (C1), Mag Block (D2)
  - Flex Stackers: **B4** holds 6 × 200 uL racks, **C4** holds 6 × 50 uL racks
  - Tip rack adapters: 2 (A2, A3)
  - Tip racks: 50 uL × 8, 200 uL × 6
  - Staging slots: **A4**, **D4**
  - Waste chute: yes
  - Gripper: yes

## Conditional Hardware

| Protocol | Parameter (default) | Adds when enabled |
| --- | --- | --- |
| 2 | `disposable_lid` (False) | Gripper, plus 3 auto-sealing lids at C3 |
| 2 | `deck_riser` (False) | Deck Riser at C3 (only with `disposable_lid`) |
| 4 | `disposable_lid` (True) / `deck_riser` (True) | Turning these off removes the riser at C4 |
| 6 | `waste_chute` (False) | Waste Chute instead of the Trash Bin at D3; A4 is also used as a staging slot |
| 6 | `num_samples` (96) | At 48 samples, drops the tip rack adapter and 2 of the 4 filter 50 uL racks |
| 8 | `use_temp` (True) | Turning this off removes the Temp Module |
| 12 | `temperature_module` (True) | Turning this off removes the Temp Module |
| 13 | `use_temp_mod` (False) | Temp Module at D1 |

## Notes and Assumptions

- **Waste Chute Expansion Slot** is counted as column-4 staging area slots used as plain deck positions. Column-4 slots occupied by a Flex Stacker are counted as stackers, not staging slots. Protocols 5, 11 and 14 use D4 as a staging slot next to the waste chute. Protocol 12 puts a stacker at D4 next to the waste chute.
- **Tip rack counts** include racks pre-loaded into Flex Stackers, because they have to be physically supplied before the run. Protocol 6 uses **filter** 50 uL racks (`opentrons_flex_96_filtertiprack_50ul`). All other racks are standard.
- **Protocol 8** loads 3 × 200 uL racks, but no pipette is ever given them (both pipettes use only the 1000 uL racks). They still need to be on the deck because the protocol loads them.
- **Protocol 13** loads its optional Temp Module as `"temperaturModuleV1"`, which looks like a misspelling of `temperatureModuleV1`. This only matters if `use_temp_mod` is enabled. That module would also go in D1, where the reservoir is already loaded.
- No active protocol uses a **P50 Single** pipette or a **Vacuum Manifold**. The vacuum miniprep protocol (`15_Miniprep_Vacuum_96_Stackers`) exists only in `active_protocols(return)/`.
