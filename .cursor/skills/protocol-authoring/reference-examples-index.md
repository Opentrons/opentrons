# AI Server Docs — Knowledge Index

These files live in `opentrons-ai-server/api/storage/docs/` and contain curated protocol knowledge, examples, and pitfall guides. **Do not duplicate their content** — use this index to know _when_ to read each file.

---

## Quick Decision Guide

| I need to…                                                       | Read this file                                     |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| Find real complete protocol examples (PCR, HS, reagent transfer) | `full-examples.md`                                 |
| Understand how casual/NL descriptions map to protocol code       | `casual_examples.md`                               |
| Write a serial dilution protocol                                 | `serial_dilution_examples.md`                      |
| Write a PCR protocol that reads well mapping from CSV            | `pcr_protocols_with_csv.md`                        |
| Fix a transfer() iteration bug or understand tip behavior        | `transfer_function_notes.md`                       |
| Debug an "out of tips" or index error                            | `out_of_tips_error_219.md`                         |
| Look up a specific labware load name                             | `standard-loadname-info.md`                        |
| Use the 96-channel pipette                                       | See `reference-96channel.md` in this skills dir    |
| Migrate OT-2 protocol to Flex                                    | See `reference-labware-deck.md` in this skills dir |
| Understand deck slot restrictions                                | See `reference-labware-deck.md` in this skills dir |

---

## File Summaries

### `commands-v0.0.1.md` (~1260 lines, ~90% code)

**Topic:** Common command patterns and pitfalls.

**Key unique knowledge:**

- `transfer()` iterates internally — wrapping it in a `for` loop is a common anti-pattern.
- Temperature module requires aluminum block adapter for PCR plates.
- Thermocycler occupies slots 7+8+10+11 on OT-2, A1+B1 on Flex.
- Multi-channel well access: always use `columns()` not `wells()`.
- Many-to-many transfer behavior when source/dest lengths differ.

**When to read:** You need a quick code example for a specific command or want to verify common patterns.

---

### `transfer_function_notes.md` (~650 lines, ~60% prose)

**Topic:** Deep guide to the `transfer()` function — behavior, pitfalls, module integration.

**Key unique knowledge:**

- `transfer()` handles well iteration automatically — never put it inside a `for` loop iterating over wells.
- `new_tip='once'` inside a manual loop is incorrect; pass lists of source/dest to `transfer()` instead.
- Multi-channel: 8 tips consumed per `pick_up_tip()`, so 12 columns × 8 = 96 tips per rack.
- Many-to-many pairing rules: shorter list is repeated or truncated based on mode.
- CSV-driven transfer patterns: parse rows and pass lists to `transfer()`.
- Module integration patterns (thermocycler, heater-shaker).

**When to read:** Any time you use `transfer()` with complex well lists, tip management, or modules.

---

### `transfer_with_liquid_class.md` (~235 lines, ~60% code)

**Topic:** Differences between `transfer()` and `transfer_with_liquid_class()`.

**Key unique knowledge (also in `reference-liquid-handling.md`):**

- Liquid class requires API ≥ 2.24 and Flex only.
- Source and dest lists must be the same length (1:1 pairing).
- Use `distribute_with_liquid_class()` for 1-to-many, `consolidate_with_liquid_class()` for many-to-1.
- Liquid classes auto-handle mixing, air gaps, touch-tip — no manual params.
- `trash_location` parameter takes the trash fixture, not a well.

**When to read:** Debugging `transfer_with_liquid_class` parameter errors or implementing custom liquid class properties.

---

### `out_of_tips_error_219.md` (~383 lines, ~50% prose)

**Topic:** Preventing "out of tips" and index errors — tip math, multi-channel calculation, strategies.

**Key unique knowledge:**

- Single-channel: 1 tip per `pick_up_tip()`. A single 96-tip rack supports 96 operations.
- Multi-channel (8-channel): **8 tips per `pick_up_tip()`**. A single 96-tip rack supports only 12 column operations (96 / 8 = 12).
- Many-to-many tip count = number of operations = size of larger group.
- Nested loops multiply tip consumption: validate total tip count before writing the loop.
- Index errors: `plate.rows()[0][i]` will raise `IndexError` if `i > 11` (columns are 0-indexed, 0–11).
- Use `move_labware()` for mid-protocol tip replenishment.

**When to read:** Before running any multi-channel or nested-loop protocol; whenever you see `OutOfTipsError` or `IndexError`.

---

### `standard-loadname-info.md` (~747 lines, ~95% structured data)

**Topic:** Complete Opentrons standard labware catalog — all 86 labware items with load names, dimensions, volumes, and well shapes.

**When to read:** When you need to find the exact `loadName` for any labware not in `reference-labware-deck.md`. Also use to check well counts, volumes, or well shape (flat/V/U-bottom) for protocol design.

---

### `deck_layout.md` (~170 lines, ~80% prose)

**Topic:** Deck slot placement guidelines for OT-2 and Flex — modules, fixtures, labware order.

**Note:** Key facts are already extracted into `reference-labware-deck.md` in this skills dir. Read this source doc only when you need full details on edge cases or the Confluence/manual references.

---

### `OT2ToFlex.md` (~210 lines, ~60% prose)

**Topic:** How to convert OT-2 protocols to Flex — metadata, pipettes, slots, modules, trash.

**Note:** Key conversion tables are already extracted into `reference-labware-deck.md` in this skills dir. Read this source doc for detailed Magnetic Module → Magnetic Block conversion examples.

---

### `full-examples.md` (~1263 lines, ~90% code)

**Topic:** Complete, production-ready protocol examples — PCR setup, reagent transfer, heater-shaker workflows.

**Key unique knowledge:**

- Real-world protocol structures with all boilerplate included.
- Module integration sequences (temperature module → thermocycler handoff).
- Tip management across multi-step protocols.
- Column-wise well allocation patterns for multi-channel pipettes.

**When to read:** Starting a new protocol from scratch and want a complete working starting point. Also useful for module integration patterns you haven't seen before.

---

### `casual_examples.md` (~979 lines, ~70% code)

**Topic:** Natural language protocol descriptions paired with their implementations.

**Key unique knowledge:**

- How vague language maps to specific API calls ("distribute to every other well" → slicing with `[::2]`).
- Triplicate/duplicate transfer patterns (each source → 3 destinations).
- Pooling operations (many-to-one consolidation).
- Serial dilution with variable dilution factors.
- Heater-shaker incubation + shaking patterns.

**When to read:** The user's request is in casual/natural language and you're uncertain how to interpret it. Also good for pooling or replicate patterns.

---

### `serial_dilution_examples.md` (~1346 lines, ~70% code)

**Topic:** Serial dilution protocols — single-channel, multi-channel, row-wise, column-wise, variable factors.

**Key unique knowledge:**

- Diluent must be distributed to all destination wells **before** transferring sample (common mistake to do them simultaneously).
- Row-wise vs column-wise differences in well indexing.
- `mix_after` parameter for proper mixing at each step.
- Air gap usage to prevent cross-contamination.
- Variable dilution factor calculation patterns.
- Multi-channel serial dilution uses `columns()`, single-channel uses `wells()`.

**When to read:** Any serial dilution protocol. These examples cover the full range of common lab patterns.

---

### `pcr_protocols_with_csv.md` (~1065 lines, ~90% code)

**Topic:** PCR protocols that read well/volume mapping from CSV runtime parameters.

**Key unique knowledge:**

- CSV-driven mastermix → destination well mapping patterns.
- Triplicate/duplicate sample transfer from CSV data.
- Thermocycler temperature profile execution (complete PCR cycle examples).
- Multi-step PCR workflow: mastermix distribution → sample addition → thermocycling.
- Column-wise multi-channel sample allocation from CSV.
- Volume calculation from CSV data (volumes as strings → float conversion).

**When to read:** Any protocol that reads a well map, sample list, or volume list from a CSV RTP. Also use for complete thermocycler PCR workflows.

---

### `runtime_parameters.md` (~320 lines, ~80% code)

**Topic:** Runtime parameter definitions — `add_int`, `add_float`, `add_bool`, `add_str`.

**Note:** Key patterns are already in `reference-rtp.md` in this skills dir. Read this source doc for additional parameter validation examples or less common field patterns.

---

### `flex_stacker_usage.md` (~194 lines, ~50% prose)

**Topic:** Flex Stacker Module patterns, constraints, and lid management.

**Note:** Key patterns are already in `reference-modules.md` in this skills dir. Read this source doc for full protocol flow examples and waste hierarchy decisions.

---

## How to Use These Docs

1. **Start with this index** — identify which file(s) are relevant.
2. **Read the file** using the Read tool when you need its content.
3. **Do not copy content** from these files into protocols verbatim — adapt it.
4. **Update this index** if you discover a doc covers something not listed here.
