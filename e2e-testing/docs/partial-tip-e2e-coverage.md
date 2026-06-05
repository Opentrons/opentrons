# Partial Tip E2E Coverage

Flex partial-tip tests in Protocol Designer. Each test imports a deck fixture, adds transfer steps via `add_transfer_step()`, then asserts a clean timeline and visible Export button.

**Fixtures:** `single_eight_partial_tip_setup.py` (1ch + 8ch) · `96_channel_setup.py` (96ch)

---

## `test_pd_single_eight_partial_tip.py`

### `test_pd_8ch_partial_all_counts_paths_and_tip_strategies` (900s)

- Fixture: `single_eight_partial_tip_setup.py`
- 18 steps: partial nozzles **2/8–7/8** × paths **transfer / distribute / consolidate**
- Per path: mix of **Always / Once**, **automatic / manual** tip tracking, **tip rack / waste chute** drop
- Wells aligned to bottom *N* rows of a column; primary nozzle bottom-aligned (e.g. 5/8 → D1)
- Once steps run before Always (manual tips not blocked by prior auto pickups)
- Extra steps:
  - 5/8 partial, 384→TC, manual tips, waste chute (H23→H1)
  - 4/8 partial, Once (setup for Never)
  - 3/8 partial, **Never** (tip reuse)

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

---

## `test_pd_96_channel_partial_tip.py`

### `test_pd_96_channel_partial_tip_strategies` (900s)

- Fixture: `96_channel_setup.py`
- 384-well plate; primary nozzles at **A1, A12, H1, H12**
- **Single nozzle** (6 steps): transfer + distribute; Always/Once; automatic/manual; tip rack/waste chute
- **Single row** (6 steps): same tip strategies; includes consolidate + manual + waste chute (H1)
- **Single column** (6 steps): same tip strategies; includes distribute + manual + waste chute (A12)
- Extra: single A12 Once → single A12 **Never** (tip reuse)

### `test_pd_96_channel_full_rack_and_manual_tip_selection` (600s)

- Same fixture; **NEST 96 deep well**; 200 µL tip rack; all nozzles
- Transfer Once → tip rack
- Transfer Always → waste chute
- Distribute, Once, **manual** tips (full row A1–A12)
- Once setup → **Never** reuse (full rack)

---

## `test_pd_pd90_regression.py` (related)

Import-only customer protocol regressions (not wizard-authored partial-tip steps):

- `test_pd_import_maor_protocol_no_reservoir_timeline_errors` — RQA-5529, 90+ steps
- `test_pd_maor_protocol_reservoir_transfer_steps_have_no_errors` — RQA-5529, sample reservoir steps + export
- `test_pd_import_post_tagmentation_no_timeline_errors` — RQA-5354
- `test_pd_post_tagmentation_reservoir_wash_steps_have_no_errors` — RQA-5354, named wash steps

---

## Run

```bash
cd e2e-testing
make test-pd-local PYTEST_ARGS="tests/pd/test_pd_single_eight_partial_tip.py"
make test-pd-local PYTEST_ARGS="tests/pd/test_pd_96_channel_partial_tip.py"
make test-pd-local PYTEST_ARGS="-k partial_tip"
```
