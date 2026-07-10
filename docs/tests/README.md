# Docs code-snippet tests (RTC-46)

Automatic verification of the Python code snippets in the Python Protocol API
manual (`python-api/docs/**/*.md`). Nothing here changes the docs build — it
adds a pytest suite that extracts every ` ```python ` block, renders its MkDocs
macros, and checks it at one of three tiers.

## Running

```sh
make test            # everything (Tier 3 is best-effort — see below)
make test TIER=1     # syntax only
make test TIER=2     # syntax + complete-protocol simulation
```

`TIER` is cumulative (`N` runs tiers 1..N; default `all`). Equivalent directly:
`uv run pytest tests/ --tier=2`.

## Tiers

| Tier | What | Blocking? |
|---|---|---|
| **1 — syntax** | `compile()` every snippet (after macro rendering). | **Yes** |
| **2 — complete protocols** | Snippets with `def run(` are simulated. Flex via `opentrons.simulate.simulate`; OT-2 via `get_protocol_api` + calling `run()` (the top-level `simulate` refuses OT-2 in this build). A missing `requirements`/`metadata` header is synthesized from the enclosing tab. | **Yes** |
| **3 — fragments** | Bare command snippets, run against a context seeded from the Flex/OT-2 **base template** (`examples.md`, "Protocol template") plus any page-template. | **Best-effort** |

**Tier 3 is best-effort by design.** Most fragments can't run standalone — they
carry forward protocol state (a tip picked up in an earlier example) or need
runtime-parameter values that only exist mid-protocol. Those are reported as
`xfail` (with the exception type) rather than failing the suite; the ~100+ that
*do* simulate give real API-misuse coverage. Tiers 1 and 2 are the hard gate.

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
| `<!-- test: page-template -->` | This snippet's setup (a module load, etc.) seeds every other fragment on the page. Use on the page's setup block so later fragments see names like `hs_mod`, `tc_mod`. |
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
    execute.py           # cases, base/page templates, tier runners
```

A single collector discovers and parametrizes over snippets, so adding a snippet
automatically adds a test case — no test references a block by index.

## Scope / follow-ups

- Covers `python-api/docs/**` only. Other publications (flex, ot-2,
  protocol-designer) can be added to `ROOTS` in `test_snippets.py`.
- CI wiring (a blocking `make test` step in `docs-build-deploy.yaml`, sharded
  like `analyses-snapshot-test.yaml` if slow) is a deferred follow-up.
- Raising real fragment coverage is a matter of adding `page-template` markers to
  more name-defining pages; the state/param-dependent fragments stay best-effort.
