---
name: scientific-applications
description: Common scientific applications automated on Opentrons Flex robots, including NGS library prep, nucleic acid extraction, protein analysis, immunoassays, single-cell sequencing, and PCR. Use when writing protocols for a specific assay type to understand typical hardware, labware, reagents, and workflow composition.
---

# Scientific Applications Reference

Derived from ~129 production Flex protocols in the Opentrons Protocol Library. Use this reference when writing a protocol for a particular assay to choose appropriate hardware, labware, reagents, and workflow steps.

For the reusable robotic tasks that compose these applications (bead cleanup, wash cycles, thermocycler profiles, etc.), see the **scientific-workflows** skill.

## NGS Library Preparation

The largest application area (~30 protocols). Covers DNA and RNA library construction for Illumina, PacBio, Nanopore, and other sequencing platforms.

### Representative Kits

| Kit / Protocol Family | Throughput | Notes |
|---|---|---|
| Illumina DNA Prep (Tagmentation) | 32x, 48x, 96x | Tagmentation-based; optional double-sided size selection |
| Illumina DNA Prep PCR-Free | 48x | Bead-linked transposomes, no PCR step |
| Illumina Stranded Total RNA (Ribo-Zero Plus) | Up to 96x | rRNA depletion, first/second strand synthesis, 14-step workflow |
| Illumina Stranded mRNA Prep | Up to 96x | Poly-A capture with RPBX beads, then cDNA + ligation |
| QIAseq FX | 48x | Enzymatic fragmentation, optional normalizer add-on |
| QIAseq Targeted DNA Pro | 8x, 48x | Target enrichment with panel-specific primers |
| QIAseq miRNA | 48x | 3'/5' adapter ligation, RT, double-sided size selection |
| IDT xGen EZ | 48x | Enzymatic frag, supports Flex Stacker and PCR lids |
| KAPA HyperPlus | Variable | Enzymatic fragmentation + ligation |
| KAPA Library Quant | 48x | qPCR-based quantification (96- or 384-well output) |
| Twist Library Prep EF 2.0 | Variable | Enzymatic frag with Twist UDI primers |
| AMPure XP Cleanup | 48x | Standalone bead cleanup (configurable ratio) |
| PacBio HiFi | 96x | SMRTbell adapter ligation, nuclease treatment, ABC |
| PacBio SRE + Shearing | Variable | Short read elimination + high-speed pipette shearing |
| Nanopore Genomic Ligation | 24x | End repair + adapter ligation with Long Fragment Buffer washes |
| SeqWell expressPlex | 96x | 96-channel index + DNA transfer, off-deck TC |
| ForenSeq DNA Signature Prep | Variable | Forensic STR/SNP enrichment, normalization, pooling |
| MiSeq Library Prep | 96x | Two-round PCR with index primers, 96-channel |
| NEBNext Ultra II / UltraExpress | Variable | Multi-part RNA library prep (PTCL series) |

### Hardware

| Component | Typical Configuration |
|---|---|
| Pipettes | Flex 8-channel 1000 uL (left) + 8-channel 50 uL (right). Some full-plate protocols use 96-channel 1000 uL instead. |
| Thermocycler | Gen2 (slots A1/B1). Used for fragmentation, ligation, PCR cycling. Lid temp 100-105C. |
| Temperature Module | Gen2 (typically C1). Holds reagent plate at 4C on aluminum block adapter. |
| Heater-Shaker | V1 (typically D1). Used for bead resuspension, mixing at 1200-1800 RPM. |
| Magnetic Block | V1 (typically D2 or A3). Bead separation for cleanup steps. |
| Waste Disposal | Waste chute (most protocols) or trash bin. |

All four modules are used simultaneously in most NGS library prep protocols.

### Labware

| Type | Labware Name | Qty | Purpose |
|---|---|---|---|
| PCR plate | `opentrons_96_wellplate_200ul_pcr_full_skirt` | 1-3 | Sample plate, reagent plate (on temp module adapter), barcode/index plate |
| Deep-well plate | `nest_96_wellplate_2ml_deep` | 1-2 | Bead cleanup plate (on heater-shaker or mag block), reagent reservoir |
| Reservoir | `nest_12_reservoir_15ml` | 0-1 | Bulk reagents (ethanol, RSB, beads) for 8-channel protocols |
| 50 uL tips | `opentrons_flex_96_tiprack_50ul` | 2-5 | Low-volume reagent additions (adapters, enzymes, elution) |
| 200 uL tips | `opentrons_flex_96_tiprack_200ul` | 2-5 | Bead cleanups, ethanol washes, sample transfers |
| 1000 uL tips | `opentrons_flex_96_tiprack_1000ul` | 0-2 | High-volume transfers (96-channel protocols) |
| Specialty | `appliedbiosystemsmicroamp_384_wellplate_40ul` | 0-1 | KAPA Library Quant qPCR output |
| Specialty | `eppendorf_96_wellplate_150ul` | 0-1 | Twist UDI primers, Illumina RNA index plates |

Many protocols use dynamic tip rack loading and gripper-based tip rack swapping to maximize tip availability.

### Liquids and Volumes

| Reagent Category | Examples | Volume per Sample |
|---|---|---|
| Fragmentation / Tagmentation | TAGMIX, FRERAT, FX enzyme, BLT+TB1 | 10-22 uL |
| Ligation mix | LIG, ELM, adapter ligation buffer | 14-45 uL |
| Adapters / Barcodes | UDI indexes, Stubby adapters, SMRTbell | 4-10 uL per column |
| PCR master mix | EPM, Equinox Amp Mix, KAPA mix | 20-30 uL |
| Stop / Wash buffer | TAGSTOP, ST2, TWB, LNW | 10-300 uL |
| AMPure XP / Cleanup beads | AMPure, SPB2, QiaSeq beads, SMRTbell beads | 0.8-1.2x sample volume (typically 40-90 uL) |
| 80% Ethanol | EtOH | 150-200 uL per wash, 2 washes per cleanup |
| Elution / RSB | RSB, EB, H2O, elution buffer | 17-50 uL |
| Sample input | gDNA, RNA, cDNA | 10-50 uL |

### Workflow Composition

A typical NGS library prep composes these tasks (see scientific-workflows skill for details):

1. **Enzymatic reaction** (fragmentation, end repair, A-tailing) -- thermocycler incubation
2. **Adapter/barcode ligation** -- add reagents, thermocycler incubation
3. **Bead cleanup** (1-3 rounds) -- AMPure XP pattern on mag block
4. **PCR amplification** -- thermocycler cycling (5-35 cycles depending on input and kit)
5. **Final bead cleanup** -- AMPure XP pattern, elute to final plate

Illumina tagmentation-based preps replace steps 1-2 with a combined tagmentation + wash step on the heater-shaker. RNA library preps add rRNA depletion or poly-A capture, first strand synthesis, and second strand synthesis before ligation.

---

## Nucleic Acid Extraction

Magnetic bead-based DNA and RNA extraction from cells, bacteria, blood, or fecal samples (~21 protocols).

### Representative Kits

| Kit / Protocol Family | Sample Type | Nucleic Acid |
|---|---|---|
| HDQ DNA (Qiagen) | Bacteria, cells | DNA |
| Macherey-Nagel (MN) DNA | Cells | DNA |
| Macherey-Nagel (MN) RNA | Cells | RNA |
| MagMAX RNA (Thermo Fisher) | Cells | RNA |
| Zymo Magbead DNA | Cells | DNA |
| Zymo Quick-RNA | Cells | RNA |
| Zymo Quick-DNA Fecal Microbe | Fecal samples | DNA |
| Zymo Quick-DNA Magbead Plus | Buccal swabs | DNA |
| GenElute (Millipore) | Blood | DNA |
| Blood Punch Distribution | Blood | N/A (aliquoting) |

### Hardware

| Component | Typical Configuration |
|---|---|
| Pipettes | 96-channel 1000 uL (full-plate processing) or 8-channel 1000 uL (partial plates up to 48 samples). Large-volume washes drive the choice of 1000 uL pipettes. |
| Heater-Shaker | V1 (D1). Lysis incubation (55-60C, 1500-2200 RPM), bead binding (1800 RPM), wash mixing. Central to every extraction protocol. |
| Magnetic Block | V1 (C1 or D1). Bead pelleting between each wash step. |
| Temperature Module | Gen2 (A3). Holds elution plate at 4C to preserve extracted nucleic acids. |
| Thermocycler | Not typically used for extraction (only in a few Zymo fecal protocols for bead drying at 65C). |

### Labware

| Type | Labware Name | Qty | Purpose |
|---|---|---|---|
| Deep-well plate | `nest_96_wellplate_2ml_deep` | 5-8 | Sample plate (on H-S), reagent reservoirs (lysis, binding, wash 1, wash 2, wash 3, beads). Each reagent gets its own reservoir for 96-channel protocols. |
| PCR plate | `opentrons_96_wellplate_200ul_pcr_full_skirt` | 1 | Elution plate (on temp module aluminum block adapter) |
| Waste reservoir | `nest_1_reservoir_195ml` | 1 | Liquid waste collection |
| 12-well reservoir | `nest_12_reservoir_15ml` | 1-3 | Reagent reservoirs for 8-channel protocols (multiple reagents share one reservoir) |
| 1000 uL tips | `opentrons_flex_96_tiprack_1000ul` | 2-4 | High-volume wash and transfer steps |
| 200 uL tips | `opentrons_flex_96_tiprack_200ul` | 0-4 | MagMAX RNA protocols use 200 uL tips |
| Filter tips | `opentrons_flex_96_filtertiprack_1000ul` | 0-4 | Zymo fecal protocols use filter tips |

96-channel protocols dedicate one deep-well plate per reagent (spread across deck slots B1-D2). 8-channel protocols consolidate reagents into 12-well reservoirs.

### Liquids and Volumes

| Reagent | Volume per Well | Notes |
|---|---|---|
| Lysis buffer | 140-350 uL | AL, Shield, MR1 depending on kit |
| Proteinase K (PK) / TCEP | 6-25 uL | Mixed with lysis buffer before transfer |
| Binding buffer | 320-600 uL | Often mixed with beads before transfer |
| Magnetic beads | 20-30 uL | Pre-mixed into binding buffer reservoir |
| Wash buffers (3-6 washes) | 400-900 uL each | VHB, SPM, MB3, MB4, MB5, ethanol-based |
| DNase I | 50 uL | RNA extraction only |
| Stop solution | 100-500 uL | RNA extraction only (quenches DNase) |
| Elution buffer | 50-110 uL | Final elution volume |
| Sample input | 180-400 uL | Cell pellet (0 uL) + PBS, blood, fecal material in shield |

### Workflow Composition

**DNA extraction:**
1. **Lysis** -- transfer lysis buffer + PK, shake at 55C / 1500-2000 RPM for 10-80 min
2. **Bead binding** -- add beads + binding buffer, shake at 1800 RPM for 5-20 min
3. **Magnetic separation** -- move plate to mag block, pellet 2-5 min
4. **Wash cycles** (3-6 rounds) -- add wash buffer, shake 1-5 min, mag separate, remove supernatant
5. **Bead drying** -- air dry on mag block 2-10 min (some heat to 55-65C)
6. **Elution** -- add elution buffer, shake at 2000 RPM for 3-5 min, mag separate, transfer to elution plate

**RNA extraction** adds after step 4 (mid-wash):
- **DNase I treatment** -- transfer 50 uL DNase, shake at 300-2000 RPM for 5-15 min
- **Stop reaction** -- add stop solution (100-500 uL), shake 1500-1800 RPM for 6-10 min, mag separate
- Resume remaining washes (typically ethanol-based), then elute

---

## Protein Analysis and Purification

Protein quantification, digestion, labeling, and affinity purification (~19 protocols).

### Sub-Applications

| Sub-Application | Protocols | Description |
|---|---|---|
| **Protein Quantification** | BCA (3 variants), Bradford | Colorimetric assays with serial-diluted standards |
| **Protein Digestion** | EasyPep Digest + TMT, Protein Digest LC/MS | Reduction, alkylation, trypsin digestion, optional TMT labeling |
| **Peptide Cleanup** | EasyPep Cleanup, Peptide Cleanup LC/MS, Evotips | Magnetic bead or SP3 cleanup for mass spec |
| **Affinity Purification** | IMAC (Ni-NTA), PureProteome, Immunoprecipitation (Dynabeads) | His-tag or antibody-based protein capture and elution |
| **Ni-NTA Purification** | neoSwitch 96-ch | 96-channel Ni-NTA purification |

### Hardware

| Component | Typical Configuration |
|---|---|
| Pipettes | 8-ch 1000 uL + 8-ch 50 uL (most). 96-ch for IP-96ch and neoSwitch. Single-channel 50 uL or 1000 uL for per-well standard dispensing. |
| Heater-Shaker | V1. Bead resuspension, incubation mixing (500-2000 RPM). |
| Magnetic Block | V1. Bead separation for cleanup and affinity purification. |
| Thermocycler | Gen2. Digestion incubation (37C, 47C), TMT labeling, denaturation (90-95C). |
| Temperature Module | Gen2. Cold reagent storage (4C), standard/sample holding. |
| Absorbance Plate Reader | Used by BCA and Bradford protocols for quantification readout. |

### Labware

| Type | Labware Name | Qty | Purpose |
|---|---|---|---|
| PCR plate | `opentrons_96_wellplate_200ul_pcr_full_skirt` | 1-3 | Assay plate, sample plate, reagent plate |
| Deep-well plate | `nest_96_wellplate_2ml_deep` | 1-3 | Wash plates, reagent reservoirs |
| 12-well reservoir | `nest_12_reservoir_15ml` | 0-2 | Bulk wash buffers, ethanol |
| Tube racks | `opentrons_24_tuberack_nest_1.5ml_snapcap` or `_2ml_snapcap` | 0-2 | Standards, samples, individual reagents |
| 50 uL tips | `opentrons_flex_96_tiprack_50ul` | 1-3 | Reagent additions, standard dispensing |
| 200 uL tips | `opentrons_flex_96_tiprack_200ul` | 1-3 | Transfers, washes |
| 1000 uL tips | `opentrons_flex_96_tiprack_1000ul` | 0-2 | High-volume washes (IP protocols) |

### Liquids and Volumes

**Quantification (BCA/Bradford):**
- BSA standards: 2 mg/mL stock, serial diluted (typically 7-8 points, 10 uL each)
- Working reagent: 200-250 uL per well (BCA Reagent A + B at 50:1, or Bradford 1x)
- Samples: 10-25 uL per well

**Digestion:**
- Reduction buffer (DTT/TCEP): 1-20 uL
- Alkylation buffer (IAA/CAA): 1-20 uL
- Trypsin/LysC: 2-10 uL at 0.1-1 ug/uL
- TMT reagent: 5-10 uL per sample
- Quench (hydroxylamine): 5 uL

**Affinity Purification (IP/IMAC):**
- Magnetic beads (Dynabeads, Ni-NTA agarose): 25-50 uL
- Binding/wash buffers: 200-500 uL per wash, 3-5 washes
- Elution buffer: 50-200 uL (low pH or imidazole gradient)
- Antibody: 1-10 uL (IP protocols)

### Workflow Composition

**Quantification:** Serial dilution of standards -> Distribute standards + samples to assay plate -> Add working reagent -> Incubate (37C/30 min for BCA, RT/5 min for Bradford) -> Read absorbance at 562 nm (BCA) or 595 nm (Bradford)

**Digestion + Cleanup:** Add reduction agent -> Incubate (55C/30 min) -> Add alkylation agent -> Incubate (RT/30 min, dark) -> Add trypsin -> Incubate (37C/3-16 hr) -> [Optional TMT labeling] -> SP3/magnetic bead cleanup -> Elute for LC/MS

**Affinity Purification:** Pre-wash beads -> Bind antibody to beads (IP) or load lysate directly (IMAC) -> Incubate with rotation/shaking -> Mag separate -> Wash (3-5x) -> Elute with elution buffer -> Transfer eluate

---

## Immunoassays

Antibody-based detection assays (~16 protocols). Often multi-day with overnight incubation steps.

### Sub-Applications

| Sub-Application | Protocols | Description |
|---|---|---|
| **Sandwich ELISA** | Invitrogen ELISA (3 parts: coating, target capture, signal) | Classic plate-based ELISA with capture Ab, sample, detection Ab, substrate |
| **Multiplex Bead Assay** | MILLIPLEX Cytokine Panel A (same-day and 2-day) | Luminex xMAP bead-based multiplex cytokine detection |
| **Proximity Ligation Assay** | Duolink PLA (8 variants: component/multiwell x round/square x day1/day2) | In-situ PLA for protein-protein interaction detection with fluorescence readout |
| **Single Molecule Counting** | SMC Immunoassay + dilution | High-sensitivity bead-based immunoassay |

### Hardware

| Component | Typical Configuration |
|---|---|
| Pipettes | 8-ch 1000 uL (left) + 1-ch 1000 uL (right). Single-channel needed for per-well antibody dispensing and standard serial dilutions. Some use 8-ch 50 uL instead. |
| Heater-Shaker | V1 (D1). Incubation at 37C with 500-1000 RPM orbital mixing. Central to every immunoassay. Uses `opentrons_universal_flat_adapter` for flat-bottom assay plates. |
| Temperature Module | Gen2 (optional). Holds reagents cold or provides 37C incubation backup. |
| Magnetic Block | V1. Required for bead-based assays (MILLIPLEX, SMC) but not plate-based ELISA or Duolink. |

### Labware

| Type | Labware Name | Qty | Purpose |
|---|---|---|---|
| Assay plate | `corning_96_wellplate_360ul_flat` | 1 | ELISA, Duolink round-well (with matching lid) |
| Assay plate | `ibidi_96_square_well_plate_300ul` | 1 | Duolink square-well variant (with matching lid) |
| Filter plate | `milliplex_96_filterplate_350ul` (custom) | 1 | MILLIPLEX bead-based assays |
| Reagent plate | `nest_96_wellplate_2ml_deep` | 1 | Reagent storage |
| Wash reservoir | `nest_12_reservoir_15ml` | 1 | Wash buffers A, B, PBS |
| Waste reservoir | `nest_1_reservoir_290ml` | 1 | Liquid waste collection |
| 200 uL tips | `opentrons_flex_96_tiprack_200ul` | 1-3 | Reagent dispensing (often reused across washes) |
| 1000 uL tips | `opentrons_flex_96_tiprack_1000ul` | 1-2 | Wash buffer dispensing and aspiration |

Immunoassay protocols make heavy use of **tip reuse** -- wash steps reuse the same tips across multiple wash cycles.

### Liquids and Volumes

| Reagent | Volume | Notes |
|---|---|---|
| Blocking solution | 40-80 uL/well | 40 uL for round-well, 80 uL for square-well |
| Primary antibody | 40-80 uL/well | Per-column (component) or uniform (multiwell) |
| Detection antibody | 25-100 uL/well | HRP-conjugated for ELISA; biotinylated for MILLIPLEX |
| Wash buffers | 200 uL/well, 2-6 washes per step | Buffer A (between steps), Buffer B (final washes) |
| PLA probe solution | 40-80 uL/well | Duolink Day 2 |
| Ligation solution | 40-80 uL/well | Duolink Day 2 |
| Amplification solution | 40-80 uL/well | Duolink Day 2 |
| Substrate / TMB | 100 uL/well | ELISA signal development |
| Stop solution | 100 uL/well | ELISA (2N H2SO4) |
| DAPI | 40-80 uL/well | Duolink nuclear counterstain |

### Workflow Composition

**ELISA (3 separate protocols):**
1. **Capture Ab Coating** -- dispense capture antibody, incubate overnight at 4C, wash
2. **Target Capture** -- block plate (37C/1hr), wash, add samples/standards, incubate 2hr, wash
3. **Signal Development** -- add detection Ab (1hr), wash, add HRP-streptavidin (30min), wash, add TMB substrate (15min), add stop solution, read at 450nm

**MILLIPLEX Cytokine Panel:**
- Add beads to filter plate -> Add standards/samples -> Incubate overnight (2-day) or 2hr (same-day) at 800 RPM -> Wash 3x on mag block -> Add detection Ab (1hr) -> Add streptavidin-PE (30min) -> Wash -> Resuspend in drive fluid -> Read on Luminex

**Duolink PLA (2-day):**
- Day 1: Block (37C/60min) -> Primary antibody -> Overnight 4C
- Day 2: Wash A (2x) -> PLA probe (37C/60min) -> Wash A (2x) -> Ligation (37C/30min) -> Wash A (2x) -> Amplification (37C/100min) -> Wash B (2x/10min) -> Wash B 0.01x -> DAPI (15min) -> PBS wash -> Anti-fade buffer

---

## Single-Cell Sequencing

Multi-part protocols for single-cell barcoding and library construction (~6 protocols).

### Representative Kits

| Kit | Parts | Description |
|---|---|---|
| Parse Biosciences Evercode WT | 3 protocols | Combinatorial barcoding: fixation, 3 rounds of barcoding, lysis, RT, cDNA amp |
| Scale Biosciences Single Cell Methylation | 1 protocol | Methylation-specific library prep |
| 10X Genomics Chromium GEM-X | 2 protocols (Day 1, Day 2) | GEM generation, RT, cDNA amp, library construction |

### Hardware

Typically uses all four modules:
- **96-channel 1000 uL** (Parse, Scale) or **8-channel** (10X Genomics)
- **Thermocycler Gen2** -- RT, cDNA amplification, fragmentation
- **Temperature Module Gen2** -- cold reagent storage
- **Magnetic Block V1** -- bead cleanups
- **Heater-Shaker V1** -- mixing (some protocols)

### Labware

| Type | Qty | Purpose |
|---|---|---|
| PCR plates (`opentrons_96_wellplate_200ul_pcr_full_skirt`) | 3-7 | Sample plates, reagent plates, intermediate plates across multi-part protocols |
| Deep-well plates (`nest_96_wellplate_2ml_deep`) | 1-3 | Reagent reservoirs, bead cleanup plates |
| 50 uL tip racks | 2-4 | Reagent additions |
| 200 uL or 1000 uL tip racks | 2-4 | Transfers, bead cleanups |

### Liquids

Barcoding reagents (ligation buffers, barcoded oligos), reverse transcription mix, cDNA amplification master mix, AMPure XP beads, 80% ethanol, elution buffer, fragmentation enzyme, ligation mix, PCR master mix. Volumes vary by kit but follow similar ranges to NGS library prep.

### Workflow Composition

1. **Cell fixation / permeabilization** -- chemical fixation, wash, permeabilize
2. **Combinatorial barcoding** (Parse: 3 rounds) -- add barcode oligos, ligate, wash, repeat with different barcode sets
3. **Cell lysis** -- lyse barcoded cells to release RNA
4. **Reverse transcription** -- convert barcoded RNA to cDNA
5. **cDNA amplification** -- PCR amplify cDNA (12-18 cycles)
6. **Library construction** -- fragmentation, adapter ligation, index PCR (same as NGS library prep)
7. **Final bead cleanup** -- AMPure XP, elute

These are almost always **multi-protocol workflows** -- the user runs 2-4 separate protocol files sequentially, with manual steps (e.g., centrifugation, cell counting) between them.

---

## PCR and Amplification

Standalone PCR reaction setup and thermocycling (~5 protocols). Distinct from PCR steps embedded within library prep workflows.

### Representative Protocols

| Protocol | Description |
|---|---|
| bms-pcr | CSV-driven PCR setup with single-channel, mastermix + DNA + water from tubes |
| pcr-csv / pcr-csv-16 | Primer distribution from tube rack + DNA transfer by multi-channel |
| pcr_amp_uminn | 96-channel PCR + SPRI bead cleanup with barcode addition |
| MiSeq Library Prep | Two-round PCR (target + index) with 96-channel, dilution between rounds |

### Hardware

| Component | Typical Configuration |
|---|---|
| Pipettes | Single-channel 50 uL (per-well reagent dispensing from tubes), 8-channel 50 uL (plate transfers), or 96-channel 1000 uL (full-plate). |
| Thermocycler | Gen2 / V2. The defining module for PCR. Lid temp 100-105C. |
| Temperature Module | Gen2 (optional). Holds reagent tubes at 4C. |
| Magnetic Block | V1 (optional). Only when PCR is followed by bead cleanup. |

### Labware

| Type | Labware Name | Qty | Purpose |
|---|---|---|---|
| PCR plate | `opentrons_96_wellplate_200ul_pcr_full_skirt` | 1-2 | Reaction plate (in TC), source DNA plate |
| Tube rack | `opentrons_24_aluminumblock_nest_1.5ml_snapcap` | 0-1 | Mastermix, water, primers (on temp module) |
| Tube rack | `opentrons_24_tuberack_nest_2ml_snapcap` | 0-1 | Primer tubes |
| Source plate | `axygen_96_wellplate_200ul` or `biorad_96_wellplate_200ul_pcr` | 0-1 | DNA source plate |
| 50 uL tips | `opentrons_flex_96_tiprack_50ul` | 1-2 | Reagent dispensing |

### Liquids

| Reagent | Volume per Well | Notes |
|---|---|---|
| PCR master mix | 5-30 uL | Pre-mixed enzyme + buffer + dNTPs |
| Primers | 1.5-12 uL | From tubes or plate; forward + reverse or indexed |
| DNA template | 3-5 uL | From source plate or tubes |
| Water | Variable | Calculated to reach final reaction volume |

Many PCR protocols use **CSV-driven layouts** where well assignments, volumes, and source locations are specified in a user-uploaded CSV file parsed at runtime.

### Workflow Composition

1. **Set temperature** -- temp module to 4C, TC lid to 105C
2. **Distribute water** (to normalize volumes per CSV)
3. **Distribute master mix** (from tubes or plate)
4. **Transfer DNA** (from source plate, with mixing)
5. **Thermocycler profile:**
   - Initial denaturation: 94-98C / 1-3 min
   - N cycles (12-35): Denature (98C/10-30s) -> Anneal (58-66C/10-30s) -> Extend (68-72C/15s-2.5min)
   - Final extension: 72C / 1-5 min
   - Hold: 4C

---

## Utility and General Lab Automation

General-purpose protocols for common lab tasks (~10+ protocols).

### Sub-Applications

| Sub-Application | Protocols | Description |
|---|---|---|
| **Serial Dilution** | customizable_serial_dilution_flex | Configurable dilution series across a plate |
| **Normalization** | normalization_with_csv, normalization_with_csv_upload | CSV-driven concentration normalization (add diluent + sample) |
| **Cherry-Picking** | cherrypicking-sick-kids, flex-custom-parameters-cherrypicking | CSV-driven well-to-well transfers between plates |
| **Sample Distribution** | sample-dil, blood | Aliquot samples from tubes to plates |
| **Plate Reading** | plate_read_abs | Absorbance measurement with plate reader module |
| **Staining / Washes** | staining, washes | Cell staining and wash protocols for microscopy |
| **Microbiology** | agar_plate_method_bacteria | Bacterial colony work |
| **Cloning** | takara_infusion_assembly_flex | Takara In-Fusion assembly reaction setup |

### Hardware

Varies widely. Common patterns:
- **Single-channel** (1-ch 50 uL or 1000 uL) for tube-to-well transfers and cherry-picking
- **8-channel** for plate-to-plate normalization and dilution
- **96-channel** for full-plate operations
- **Heater-Shaker** for mixing/incubation in staining and wash protocols
- **Absorbance Plate Reader** for quantification readout
- **Temperature Module** for cold storage

### Labware

Highly variable. Common items: PCR plates, deep-well plates, tube racks (24-tube, 15 mL conical), reservoirs, 1-4 tip racks.

### Workflow Composition

These protocols are typically simpler and shorter than the application-specific ones:
- **Serial dilution**: Transfer sample -> mix -> transfer to next well -> repeat across row/column
- **Normalization**: For each well, transfer calculated diluent volume, then calculated sample volume (from CSV)
- **Cherry-picking**: For each entry in CSV, transfer specified volume from source well to destination well (new tip each)
