# Partial Tip E2E Coverage

Flex partial-tip tests in Protocol Designer. Each test imports a deck fixture, adds transfer (or mix) steps, re-opens a sample of timeline steps in the editor, exports the protocol to `test-results/exports/<test-name>/`, and asserts a clean timeline.

**Fixtures:** `single_eight_partial_tip_setup.py` (1ch + 8ch) · `96_channel_setup.py` (96ch)

**Exports:** `test-results/exports/` (per-test subfolder via `pd_exports_dir` fixture)

**Never tip handling:** `Never` must immediately follow an adjacent `Once` or `Always` step on the same pipette with the **same nozzle configuration** (e.g. 4/8 partial cannot reuse a 5/8 tip). Each Never pair in these tests is authored back-to-back with matching `partial_count` / `nozzle_config`.

---

## `test_pd_single_eight_partial_tip.py`

### `test_pd_8ch_partial_all_counts_paths_and_tip_strategies` (900s)

- Fixture: `single_eight_partial_tip_setup.py`
- 18 steps: partial nozzles **2/8–7/8** × paths **transfer / distribute / consolidate**
- Per path: mix of **Always / Once**, **automatic / manual** tip tracking, **tip rack / waste chute** drop
- Wells aligned to bottom _N_ rows of a column; primary nozzle bottom-aligned (e.g. 5/8 → D1)
- Once steps run before Always (manual tips not blocked by prior auto pickups)
- Extra steps:
  - 5/8 partial, 384→TC, manual tips, waste chute (H23→H1)
  - 4/8 partial, Once (setup for Never)
  - 4/8 partial, **Never** (reuse same 4/8 tip from prior step)
- Re-opens sample step indices `[2, 8, 14, 21]`; exports `8ch_partial_all_counts.py`

### `test_pd_8ch_partial_mix_on_96_well` (300s)

- Same fixture; **8ch partial 4/8** mix on TC 96-well (`D1`, `E1`); Once tip handling
- Re-opens mix step; exports `8ch_partial_mix_96well.py`

### `test_pd_8ch_single_nozzle_and_1ch_workflows` (600s)

- Same fixture
- **8ch single nozzle:**
  - Distribute 384→temp 24, Always, automatic
  - Transfer 384→TC, Once, manual tips (H12)
- **1ch:**
  - Distribute TC→temp 24, Always
  - Consolidate temp 24→TC, Once, waste chute
  - Transfer TC→temp 24, Once, manual tips (A1)
  - Transfer temp 24→TC, **Never** (reuse tip)
- Re-opens sample step indices `[2, 5, 7]`; exports `8ch_single_nozzle_and_1ch.py`

---

## `test_pd_96_channel_partial_tip.py`

Partial-tip coverage is split into three ~7-step suites (each starts from a fresh
`96_channel_setup.py` import + gripper Move B3→B2).

### `test_pd_96ch_partial_single_nozzle_tip_strategies` (600s)

- **Deck prep:** gripper Move of 1000 µL tiprack **B3 → B2** (stacker collision)
- Five **single-nozzle** transfers on 384-well plate (A12/H12/H1/A1 primaries)
- **Returned tip ⇒ manual:** H1-primary auto returns tip at cascade corner **A12**; distribute reuses A12 manually
- **Last pickup before Never:** H1 Once, **manual A12**, Waste Chute (tip stays on pipette) — not auto
- **Never:** matching H1 single nozzle (same layout as manual setup)
- Exports `96ch_partial_single_nozzle.py`

### `test_pd_96ch_partial_row_nozzle_tip_strategies` (600s, xfail)

- Move + six **row** transfers (H1/A1, Once/Always, distribute/consolidate)
- **xfail:** row pickup needs cascade-empty path (H1 ⇒ A–G empty; A1 ⇒ B–H empty); depletion setup TBD
- Exports `96ch_partial_row_nozzle.py` when un-xfails

### `test_pd_96ch_partial_column_nozzle_tip_strategies` (600s, xfail)

- Move + six **column** A1 transfers (Once/Always, return/waste, distribute/consolidate)
- **xfail:** column A1 needs cols 2–12 empty; depletion setup TBD
- Exports `96ch_partial_column_nozzle.py` when un-xfails

### `test_pd_96_channel_full_rack_and_manual_tip_selection` (600s)

- Same fixture; **NEST 96 deep well**; 200 µL tip rack; all nozzles
- Transfer Once → tip rack
- Transfer Always → waste chute
- Distribute, Once, **manual** tips (full row A1–A12)
- Once setup → **Never** reuse (full rack)
- Re-opens sample step indices `[0, 5, 6]`; exports `96ch_full_rack_manual_tips.py`

---

## `test_pd_pd90_regression.py` (related)

Customer protocol regressions (RQA-5529 Maor / RQA-5354 post-tagmentation).

**Import-only:**

- `test_pd_import_maor_protocol_no_reservoir_timeline_errors` — RQA-5529, 96 steps
- `test_pd_maor_protocol_reservoir_transfer_steps_have_no_errors` — RQA-5529, sample reservoir steps + export
- `test_pd_import_post_tagmentation_no_timeline_errors` — RQA-5354
- `test_pd_post_tagmentation_reservoir_wash_steps_have_no_errors` — RQA-5354, named wash steps

**Post-import wizard steps** (split like 96ch partial suites — tip inventory after long protocols is depleted; do not assume fresh full racks / tip well == primary):

Shared tip rules: auto only picks **CLEAN** tips; 96ch SINGLE tip well is the cascade corner opposite the primary (`A1→H12`, `A12→H1`, …); Once + Tip rack returns `DIRTY` (next Once needs **manual**); Once + Waste Chute keeps tip on pipette for Never.

Maor (50 µL tiprack on D4; clear C4/D2 adapters + depleted 1000 µL neighbors; Greiner `(1)` only; single-A1 tip AABB stays blocked on this dense deck):

- `test_pd_maor_96ch_reservoir_column_transfer` — 12-reservoir → Greiner, column A12, Once + Waste Chute

Post-tagmentation (move unused tiprack `(4) B3→A1` after clearing A2 + A3 tipracks, B1 Indexes, and B2 Waste Plate):

- `test_pd_post_tagmentation_96ch_wash_like_single_transfer` — TWB → LP1, single A1 Once + Waste (no ALL without a full CLEAN rack)
- `test_pd_post_tagmentation_96ch_lp1_single_once` — LP1 → LP1, single A1 Once + Waste
- `test_pd_post_tagmentation_96ch_single_always_distribute` — distribute, single A1 Always + Waste (row A1 needs B–H empty)

---

## Run

```bash
cd e2e-testing
make test-pd-local PYTEST_ARGS="tests/pd/test_pd_single_eight_partial_tip.py"
make test-pd-local PYTEST_ARGS="tests/pd/test_pd_96_channel_partial_tip.py"
make test-pd-local PYTEST_ARGS="-k partial_tip"
```
