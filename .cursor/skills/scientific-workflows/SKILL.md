---
name: scientific-workflows
description: Reusable robotic workflow tasks that compose scientific applications on Opentrons Flex, including magnetic bead cleanup, wash cycles, thermocycler profiles, heater-shaker mixing, lysis, and tip management. Use alongside the scientific-applications skill when writing protocols to implement standard procedural steps correctly.
---

# Scientific Workflow Tasks

Reusable tasks that appear across multiple scientific applications. Each entry describes the purpose, typical parameters, and the sequence of robot commands involved. Combine these tasks to build complete application protocols.

For application-level context (which tasks compose a given assay), see the **scientific-applications** skill.

## Magnetic Bead Cleanup (AMPure XP Pattern)

The most common workflow task in the protocol library. Used in NGS library prep (1-3x per protocol), nucleic acid extraction (as the core separation mechanism), protein purification, and single-cell workflows.

### Purpose

Selectively bind DNA/RNA/protein to paramagnetic beads, wash away contaminants, and elute purified target.

### Typical Parameters

| Parameter | Range | Common Default |
|---|---|---|
| Bead-to-sample ratio | 0.6x - 2.0x | 0.8x (NGS size selection), 1.0x (general) |
| Bead volume | 40-90 uL | Varies by input volume |
| Binding time | 5-20 min | 5 min (NGS), 10-20 min (extraction) |
| Mixing speed (H-S) | 1200-1800 RPM | 1400-1600 RPM |
| Mixing reps (pipette) | 10-15 reps | 10 reps |
| Mag block settle time | 2-5 min | 3 min |
| EtOH washes | 2x | Always 2 |
| EtOH volume | 150-200 uL per wash | 150 uL (NGS), 200 uL (extraction) |
| EtOH incubation | 30s - 2 min | 30s |
| Bead drying | 1-10 min | 2-5 min (NGS), 5-10 min (extraction) |
| Elution volume | 17-110 uL | 20-32 uL (NGS), 50-110 uL (extraction) |
| Elution mixing speed | 1800-2200 RPM | 2000 RPM |
| Elution time | 2-5 min | 2 min |

### Command Sequence

1. **Add beads** to sample -- pipette transfer from reservoir, mix by pipetting or heater-shaker
2. **Incubate** -- shake on H-S at 1200-1800 RPM for binding time, or pipette-mix 10-15 reps
3. **Move plate to mag block** -- use gripper (`move_labware`)
4. **Wait for pellet** -- `protocol.delay(minutes=3)` or similar
5. **Remove supernatant** -- aspirate slowly (0.25-0.5x normal rate), offset from bead pellet, dispense to waste
6. **EtOH wash 1** -- add 150-200 uL 80% EtOH, incubate 30s-2 min, remove
7. **EtOH wash 2** -- repeat
8. **Remove residual** -- aspirate remaining droplets with small volume (10-20 uL) at bottom
9. **Dry beads** -- air dry 1-10 min on mag block (some protocols heat to 55-65C)
10. **Move plate off mag block** -- back to H-S or deck slot
11. **Add elution buffer** -- RSB, EB, or water
12. **Resuspend** -- shake at 1800-2200 RPM for 2-5 min, or pipette-mix vigorously
13. **Move plate to mag block** -- re-engage
14. **Wait for pellet** -- 2-3 min
15. **Transfer eluate** -- aspirate carefully, transfer to clean plate

### Double-Sided Size Selection (Variant)

Used by Illumina DNA Prep and QIAseq miRNA for fragment size selection:

1. **Right cut** -- add bead volume (e.g., 45 uL for 0.6x), bind, mag separate, **keep supernatant** (contains target)
2. **Left cut** -- transfer supernatant to clean wells, add more beads (e.g., 15 uL for ~0.8x total), bind, mag separate, **discard supernatant** (too-small fragments removed)
3. Proceed with standard EtOH washes and elution on the beads from step 2

---

## Ethanol Wash

A sub-task within bead cleanup. Always performed on the magnetic block with beads pelleted.

### Typical Parameters

| Parameter | Range | Notes |
|---|---|---|
| EtOH concentration | 80% (v/v) | Standard across all protocols |
| Volume | 150-900 uL | 150-200 uL for NGS cleanup; 400-900 uL for extraction |
| Incubation | 30s - 5 min | 30s for NGS; 1-5 min for extraction (with shaking) |
| Dispense rate | Normal | Dispense slowly along well wall, away from bead pellet |
| Aspirate rate | 0.25-0.5x normal | Slow aspiration to avoid disturbing pellet |
| Number of washes | 2 (NGS cleanup), 3-6 (extraction) | |

### Command Sequence

1. **Dispense EtOH** -- add along wall opposite the bead pellet
2. **Incubate** -- wait 30s (NGS) or shake 1-5 min (extraction: move plate to H-S, shake, return to mag block)
3. **Remove EtOH** -- aspirate slowly from bottom, offset from pellet side
4. **Repeat** for second wash
5. **Remove residual** -- use 10-20 uL aspiration to remove remaining drops

For extraction protocols, washes use different buffers in sequence (e.g., VHB, SPM, MB3, MB4, MB5) rather than repeating the same ethanol wash.

---

## Thermocycler Incubation

Used for enzymatic reactions (fragmentation, ligation, PCR), denaturation, and temperature-controlled incubation.

### Common Profiles

**Enzymatic Fragmentation / End Repair / A-Tailing:**
```
Lid: 105C
Step 1: 37C for 10-30 min (fragmentation)
Step 2: 65C for 30 min (end repair / A-tailing)
Hold: 4C
```

**Tagmentation (Illumina DNA Prep):**
```
Lid: 105C
Step 1: 55C for 15 min (tagmentation)
Hold: 10C
Then add TAGSTOP:
Step 2: 37C for 15 min (stop)
Hold: 10C
```

**Adapter Ligation:**
```
Lid: 105C (or off)
Step 1: 20C for 15-30 min
Step 2 (optional): 65C for 10 min (heat-kill ligase)
Hold: 4C
```

**PCR Amplification (NGS):**
```
Lid: 105C
Initial denaturation: 98C for 30-45s (or 3 min for hot-start)
N cycles:
  Denature: 98C for 10-45s
  Anneal: 58-66C for 15-30s
  Extend: 68-72C for 15s-2.5 min
Final extension: 68-72C for 1-5 min
Hold: 4C
```

Cycle count varies by application: 5-7 (high-input NGS), 12-16 (standard NGS), 25-35 (low-input or standalone PCR).

**First/Second Strand Synthesis (RNA):**
```
Lid: 105C
First Strand: 25C/10 min -> 42C/15 min -> 70C/15 min
Second Strand: 16C/60 min
Hold: 4C
```

### Command Sequence

1. **Set lid temperature** -- `thermocycler.set_lid_temperature(105)`
2. **Open lid** -- `thermocycler.open_lid()`
3. **Move plate into TC** (if not already there) -- gripper move or manual load
4. **Add reagents** via pipette if lid is open
5. **Close lid** -- `thermocycler.close_lid()`
6. **Run profile** -- `thermocycler.execute_profile(steps=[...], repetitions=1)`
7. **Set block temperature** for hold -- `thermocycler.set_block_temperature(4)`
8. **Open lid** for next step
9. **Deactivate lid** when done -- `thermocycler.deactivate_lid()`

For PCR with cycling, the profile uses `repetitions=N` for the cycling portion, sandwiched between initial denaturation and final extension as separate `execute_profile` calls or a single combined profile.

---

## Heater-Shaker Mixing and Incubation

The heater-shaker combines orbital shaking with temperature control. Used for lysis, bead binding, enzymatic incubation, and wash step mixing.

### Typical Parameters

| Application | Speed (RPM) | Temperature | Duration |
|---|---|---|---|
| Lysis | 1500-2200 | 55-60C | 10-80 min |
| Bead binding | 1800 | RT or 37C | 5-20 min |
| Bead resuspension (cleanup) | 1200-1800 | RT | 2-5 min |
| Wash mixing (extraction) | 1800-2200 | RT | 1-5 min |
| Immunoassay incubation | 500-1000 | 37C | 30-100 min |
| PLA amplification | 500 | 37C | 100 min |
| Elution resuspension | 2000-2200 | RT or 55C | 3-5 min |

### Command Sequence

1. **Open latch** -- `heater_shaker.open_labware_latch()`
2. **Move plate onto H-S** -- gripper `move_labware(plate, heater_shaker)` or load directly
3. **Close latch** -- `heater_shaker.close_labware_latch()`
4. **Set temperature** (if heated) -- `heater_shaker.set_target_temperature(55)` then `wait_for_temperature()`
5. **Set and wait for speed** -- `heater_shaker.set_and_wait_for_shake_speed(1800)`
6. **Wait for duration** -- `protocol.delay(minutes=5)`
7. **Deactivate shaker** -- `heater_shaker.deactivate_shaker()`
8. **Deactivate heater** (if used) -- `heater_shaker.deactivate_heater()`
9. **Open latch** -- for plate removal or pipette access
10. **Remove plate** -- gripper move to mag block, deck slot, or TC

The H-S latch must be open for the gripper to move plates on/off, and must be closed before shaking. Pipettes can access the plate while the latch is open and the shaker is stopped.

---

## Lysis and Cell Disruption

The first step in nucleic acid extraction. Breaks open cells to release DNA/RNA.

### Typical Parameters

| Parameter | Range |
|---|---|
| Lysis buffer volume | 140-350 uL |
| Proteinase K volume | 6-25 uL |
| Temperature | 55-60C (most), 80C (GenElute heat inactivation) |
| Shake speed | 1500-2200 RPM |
| Duration | 4-80 min (4 min for RNA, 30-80 min for tough samples like bacteria) |

### Command Sequence

1. **Pre-mix PK into lysis buffer** in reservoir (if using 96-channel) or add separately
2. **Transfer lysis mix** to sample plate -- 140-350 uL
3. **Mix by pipetting** -- 10-15 reps if samples are cell pellets
4. **Move plate to H-S** -- gripper
5. **Incubate with shaking** -- 55C / 1800-2000 RPM for specified duration
6. **Cool down** (optional) -- deactivate heater
7. **Transfer lysate** to binding plate (some protocols transfer 200 uL of lysate to a new plate)

For bacterial samples, lysis times are longer (30-80 min) and may include a separate TL (tissue lysis) buffer step before AL (lysis) buffer.

---

## Magnetic Separation and Supernatant Removal

The core operation on the magnetic block. Used after every bead binding, wash, and elution step.

### Typical Parameters

| Parameter | Range | Notes |
|---|---|---|
| Settle time | 2-5 min | 2 min for small volumes, 5 min for deep wells |
| Aspirate rate | 0.25-0.5x default | Slow to avoid disturbing pellet |
| Aspirate height | 0.5-2 mm from bottom | Offset from bead pellet side |
| Residual removal volume | 10-20 uL | Final sweep after bulk removal |

### Command Sequence

1. **Move plate to mag block** -- `protocol.move_labware(plate, mag_block)`
2. **Wait for beads to pellet** -- `protocol.delay(minutes=3)` (adjust based on bead type and volume)
3. **Aspirate supernatant** -- slow rate, starting from top and stepping down, or aspirating from near-bottom with side offset away from pellet
4. **Dispense to waste** -- waste chute, waste reservoir, or trash
5. **Remove residual** (optional) -- aspirate 10-20 uL at very bottom after bulk removal

Many protocols track bead pellet position (left vs. right side of well depending on mag block orientation) and offset aspiration to the opposite side. The `well.bottom(z=0.5)` position with a side offset is common.

---

## Multi-Step Wash Cycles

A repeating pattern of buffer addition, mixing, magnetic separation, and supernatant removal. Central to nucleic acid extraction (3-6 washes) and affinity purification (3-5 washes).

### Typical Parameters

| Context | Washes | Volume | Mix Method |
|---|---|---|---|
| NA extraction (DNA) | 3-4 | 400-900 uL | H-S shake 1800-2200 RPM, 1-5 min |
| NA extraction (RNA) | 6 (3 pre-DNase, 3 post-DNase) | 400-700 uL | H-S shake |
| NGS bead cleanup | 2 (EtOH only) | 150-200 uL | No mix (settled on mag block) |
| Affinity purification | 3-5 | 200-500 uL | H-S shake or pipette mix |

### Command Sequence (Extraction Pattern)

For each wash buffer in sequence:

1. **Move plate off mag block** to H-S -- gripper
2. **Add wash buffer** -- pipette transfer from reservoir
3. **Mix** -- shake at 1800-2200 RPM for 1-5 min
4. **Move plate to mag block** -- gripper
5. **Wait for pellet** -- 2-5 min
6. **Remove supernatant** -- slow aspirate to waste
7. **Repeat** with next wash buffer

Extraction protocols use different buffers for each wash (VHB, SPM, ethanol, etc.). The final wash is often ethanol-based and followed by an extended drying step.

### Command Sequence (NGS EtOH Wash Pattern)

Performed entirely on the mag block (no plate movement):

1. **Add EtOH** -- dispense along wall opposite bead pellet
2. **Wait** -- 30s
3. **Remove EtOH** -- slow aspirate
4. **Repeat** once
5. **Remove residual** -- 10-20 uL aspiration

---

## DNase Treatment (RNA Extraction Only)

Inserted mid-wash during RNA extraction to digest contaminating genomic DNA.

### Typical Parameters

| Parameter | Value |
|---|---|
| DNase I volume | 50 uL |
| Incubation temperature | RT or 65C |
| Incubation time | 5-15 min |
| Shake speed | 300-2000 RPM |
| Stop solution volume | 100-500 uL |
| Stop incubation | 1500-1800 RPM, 6-10 min |

### Command Sequence

1. **Complete initial washes** (1-3 washes after bead binding)
2. **Add DNase I** -- transfer 50 uL to bead pellet
3. **Mix** -- pipette mix or gentle shake
4. **Incubate** -- shake at 300-2000 RPM for 5-15 min (some at 65C)
5. **Add stop solution** -- 100-500 uL to quench DNase
6. **Shake** -- 1500-1800 RPM for 6-10 min
7. **Mag separate** -- move to mag block, pellet, remove supernatant
8. **Continue remaining washes** (typically 3 more ethanol-based washes)

---

## Serial Dilution

Used for standard curves (BCA, Bradford, qPCR) and sample dilution (QUiCKR, ELISA).

### Typical Parameters

| Parameter | Range |
|---|---|
| Dilution factor | 2x (1:2) to 20x (1:20) |
| Transfer volume | 10-30 uL |
| Diluent volume | Pre-loaded or added first |
| Mix reps | 5-10 |
| Number of points | 6-8 for standard curves |
| Direction | Across rows (columns 1->12) or down columns |

### Command Sequence

1. **Pre-load diluent** in destination wells (or add from reservoir)
2. **Transfer from stock** to first dilution well
3. **Mix** -- 5-10 reps at 70-80% of well volume
4. **Transfer from first dilution** to second dilution well
5. **Mix** again
6. **Repeat** across the dilution series
7. **Change tips** between dilution series (different samples)

---

## Plate-to-Plate Transfers

Simple transfers between plates. Used in cherry-picking, normalization, sample distribution, and moving samples between workflow steps.

### Patterns

**Column-by-column (8-channel):** Transfer all columns of a plate sequentially. Most common for plate replication and library prep intermediate transfers.

**Well-by-well (single-channel):** Used for cherry-picking (CSV-driven), per-well antibody dispensing, and standard curve setup.

**Full-plate (96-channel):** Single transfer of entire plate. Used for stamping operations, full-plate reagent addition, and 96-channel bead cleanup.

**Partial-column (96-ch COLUMN mode):** Process 1-11 columns using the 96-channel pipette in COLUMN nozzle configuration. Picks up a single column of tips from the tip rack.

### Tips on Aspiration/Dispense

- **Slow aspiration** (0.25x rate) when removing supernatant from beads
- **Reverse pipetting** for viscous or foaming liquids (aspirate extra, dispense nominal, blow out)
- **Touch tip** after aspiration to remove droplets hanging on tip
- **Blow out** into waste or destination after dispense
- **Air gap** (1-5 uL) to prevent dripping during travel

---

## Tip Management

Protocols use several strategies to handle tip consumption, which can be significant (300+ tips for complex protocols).

### Dynamic Tip Rack Loading

Load tip racks into available deck positions as needed. When a rack is exhausted, load the next one (often via gripper from off-deck staging or Flex Stacker).

### Tip Reuse

Common in wash steps where cross-contamination is not a concern. The protocol picks up tips once and reuses them for all wash cycles on the same samples. Typical in:
- Ethanol washes during bead cleanup (same tips for both washes)
- Immunoassay wash buffer dispensing
- Supernatant removal across wash cycles

### Tip Rack Swapping via Gripper

When all deck-loaded tip racks are exhausted mid-protocol, the gripper moves empty racks to waste/off-deck and moves full racks from staging positions to active positions.

### Partial Tip Pickup (96-Channel)

The 96-channel pipette can operate in `COLUMN` nozzle layout mode to pick up a single column (8 tips) at a time. Used for processing fewer than 12 columns without wasting a full 96-tip rack per operation. Also used for accessing 12-well reservoirs column by column.

### Tip Quantity Planning

| Application | 50 uL Tips | 200 uL Tips | 1000 uL Tips |
|---|---|---|---|
| NGS Library Prep (48x) | 2-5 racks | 2-5 racks | 0 |
| NA Extraction (96-ch) | 0 | 0-4 | 2-4 racks |
| NA Extraction (8-ch) | 0 | 0-4 | 3-5 racks |
| Protein Quant (BCA) | 1-2 racks | 1-2 racks | 0 |
| Immunoassay | 0 | 1-3 racks | 1-2 racks |
| PCR Setup | 1-2 racks | 0 | 0 |

Tip consumption scales with sample count (number of columns processed) and the number of cleanup/wash steps. Protocols with 3+ bead cleanups (e.g., QIAseq FX) or 6+ wash cycles (e.g., Zymo Quick-RNA) are the heaviest consumers.
