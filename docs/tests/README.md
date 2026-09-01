# Docs code-snippet tests (RTC-46)

Automatic verification of the Python code snippets in the Python Protocol API
manual (`python-api/docs/**/*.md`). Nothing here changes the docs build — it
adds a pytest suite that extracts every ` ```python ` block, renders its MkDocs
macros, and checks it at one of three tiers.

## Running

```sh
make test            # everything (see Tier 3 below)
make test TIER=1     # syntax only
make test TIER=2     # syntax + complete-protocol simulation
```

`TIER` is cumulative (`N` runs tiers 1..N; default `all`). Equivalent directly:
`uv run pytest tests/ --tier=2`. The run ends with a per-`.md`-file table
(pass / xfail / FAIL counts) so it's clear what got tested — the default
`.`/`x` progress dots hide which files are covered.

## Tiers

| Tier | What | Blocking? |
|---|---|---|
| **1 — syntax** | `compile()` every snippet (after macro rendering). | **Yes** |
| **2 — complete protocols** | Snippets with `def run(` are simulated. Flex via `opentrons.simulate.simulate`; OT-2 via `get_protocol_api` + calling `run()` (the top-level `simulate` refuses OT-2 in this build). A missing `requirements`/`metadata` header is synthesized from the enclosing tab. | **Yes** |
| **3 — fragments** | Bare command snippets, run against a context seeded from the Flex/OT-2 **base template** (`snippets/templates.py`) plus any page-template and/or object-registry setup the fragment needs. | **Partial** — see below |

**Tier 3 distinguishes "can't run standalone" from "actually broken."** Many
fragments can't run on their own — they carry forward protocol state (a tip
picked up in an earlier example), reference a name defined earlier on the page,
or need a runtime-parameter value. When a fragment fails for one of those
reasons it's reported as `xfail` (non-blocking). But any *other* failure — a
wrong keyword, unknown labware, bad argument order — is a real defect and
**fails** the suite. So the many fragments that genuinely run against the
template give real, blocking API-misuse coverage, while the ones that can't run
stand aside gracefully. The classifier is `is_context_failure` in
`snippets/execute.py` (a small, centralized signature list — extend it if a new
"missing-context" error type shows up as a false failure).

### Base template + object registry

The base template (`templates.py`) is intentionally minimal: a tip rack,
pipette, plate, and reservoir (plus a trash bin on Flex) — the same handful of
things the old "Protocol template" on `examples.md` provided. Loading every
module up front for every single fragment used to be the design, but that made
each Tier 3 test pay for module setup it usually never touched.

Instead, `templates.py` also defines `OBJECT_SEEDS`: a registry mapping common
object names (`hs_mod`, `tc_mod`, `temp_mod`, `mag_mod`, `magnetic_block`,
`pr_mod`, `stacker_1`, `chute`) to the code that loads and prepares each one —
not just the load call, but whatever its own docs page says is needed before
typical use (e.g. closing the Heater-Shaker's labware latch before shaking, or
opening the Thermocycler's lid so labware can move onto the block). For each
fragment, `execute._object_setup_for` scans its rendered code (and any
`continue-previous` chain it's part of) for these names and injects setup only
for the ones actually referenced *and* not already defined by a page-template
or the chain itself — so a page whose own snippet loads `hs_mod` locally isn't
handed a second, conflicting one.

### Pipette-tip preconditions

The same on-demand idea applies to pipette state. Plenty of building-block
examples (`touch_tip()`, `mix()`, `dispense()`, `air_gap()`, ...) assume a tip
was already picked up — and often that liquid was already aspirated — by an
earlier, unmarked example on the same page. `execute._tip_setup_for` scans a
fragment's rendered code for tip-requiring method calls and, for each pipette
name that doesn't call `pick_up_tip()` itself, injects `pick_up_tip()` plus an
`aspirate()` at half the pipette's `max_volume` (enough headroom either way:
room to dispense, or room to aspirate/air_gap more on top). A fragment that
manages its own tip lifecycle (`pick_up_tip()`/`drop_tip()` pairs, partial-tip
layouts, etc.) is left alone.

## Classification

By convention, no annotation needed:

- contains `def run(` → **complete protocol** (Tier 2)
- otherwise → **fragment** (Tier 3)

## Markers

Exceptions are declared with an HTML comment on the line(s) immediately above a
fence (invisible in the rendered page, ignored by the build):

| Marker | Effect |
|---|---|
| `<!-- test: skip -->` | Never executed or syntax-checked (pseudocode, deliberately-incomplete illustrations). |
| `<!-- test: syntax-only -->` | Tier 1 only; never simulated (e.g. a `run()` body that needs a separate `add_parameters` block or a CSV file). |
| `<!-- test: raises -->` | Simulation is expected to raise an error; asserted. |
| `<!-- test: continue-previous -->` | Fragment builds on the previous fragment's namespace (same page + track) instead of a fresh one. Default is fresh. |
| `<!-- test: page-template -->` | This snippet's setup (a module load, etc.) seeds every other fragment on the page. Rarely needed now that the object registry (see above) covers the common module/fixture names automatically; reach for this only for page-specific setup outside that registry. |
| `<!-- test: robot=flex \| ot2 -->` | Force the robot track for an untabbed fragment (default: Flex). |

## Layout

```
tests/
  conftest.py            # --tier option, markers, log suppression
  test_snippets.py       # the three tiered, parametrized tests
  snippets/
    extract.py           # line scanner: fences, tabs, headings, markers
    render.py            # Jinja2 macro substitution from mkdocs.yml `extra:`
    classify.py          # convention + markers -> category & directives
    templates.py         # base Flex/OT-2 templates + injectable object registry
    execute.py           # cases, base/page/object seeding, tier runners
```

A single collector discovers and parametrizes over snippets, so adding a snippet
automatically adds a test case — no test references a block by index.

## Scope / follow-ups

- Covers `python-api/docs/**` only. Other publications (flex, ot-2,
  protocol-designer) can be added to `ROOTS` in `test_snippets.py`.
- CI wiring (a blocking `make test` step in `docs-build-deploy.yaml`, sharded
  like `analyses-snapshot-test.yaml` if slow) is a deferred follow-up.
- Raising real fragment coverage further is mostly a matter of growing
  `OBJECT_SEEDS` in `templates.py` as new common object names show up; the
  state/param-dependent fragments stay best-effort.
