# Epic risk analyzer (`epic_risk`)

Small library + Streamlit UI that maps **Jira-style ticket tokens** to **merged GitHub PRs**, rolls up **per-file churn** across those PRs, and surfaces **heuristic risk**, **complexity**, optional **commit counts** in the PR merge window, and **epic-local import fan-out / fan-in** so QA can prioritize integration-heavy paths.

The numeric score is for **triage and conversation**, not a quality judgment. Narrative text in **Risk Reasoning** stays blameless and signal-based.

---

## Setup

**Prerequisites**

- **GitHub CLI** (`gh`) with access to the repos you select; must be logged in.
- **Python 3.12+** and **`uv`** (or another env manager) for dependencies.
- **Node.js** + **`npm`** if you want the **syntax tree** panel for TypeScript/TSX (Babel parser via `npx tsx`). Python AST uses `astpretty` only.

**Install (from the parent `e2e-testing/` directory)**

The Makefile targets assume your shell is `e2e-testing/` (one level up from this folder):

```bash
cd e2e-testing
make setup    # uv venv + pip packages + npm deps for AST
make auth     # gh auth login if needed
```

Minimum Python packages for the app (if you skip `make setup`): `pandas`, `streamlit`, `radon`, `lizard`, `astpretty`, plus dev tooling like `ruff` as you prefer.

---

## Run the UI

Still from **`e2e-testing/`**:

```bash
make run
# same as:
uv run streamlit run scrape_repo.py
```

Paste tickets, pick repos, click **Analyze Risk**. Optional **Bug epic mode** counts default-branch commits per file between the earliest and latest **merged PR** dates among matched PRs (capped; see `constants.py`).

---

## Repo layout (high level)

| Piece | Role |
| --- | --- |
| `scrape_repo.py` (sibling in `e2e-testing/`) | Streamlit entry: inputs, orchestration, session state |
| `constants.py` | GitHub pagination caps, PR search lookback, ignored domains, defaults |
| `github.py` | Uncached `gh api` helpers (raw file contents, commit lists) |
| `cached.py` | Streamlit-cached wrappers around GitHub + metrics |
| `metrics.py` | Cyclomatic complexity + line count from fetched source |
| `domains.py` | File extension → stack label; table “Kind” icons |
| `coverage.py` | Pull a coverage % hint from PR comments (Codecov-style) |
| `pr_discovery.py` | Search merged PRs by ticket text → expand with `gh pr view` → file rows |
| `import_graph.py` | Epic-scoped **Fan-out** / **Fan-in** (Python `ast` + TS import regex heuristics) |
| `risk.py` | **Risk Score** math + **Risk Reasoning** prose |
| `aggregation.py` | Group PR rows → one row per file; sort keys; display column order |
| `views.py` | Results table styling, column help text, optional AST inspector panel |
| `ast_tools.py` | Shell out to `../test_ast_parser.ts` for TS/TSX AST JSON |

Import **without** pulling Streamlit:

```python
from epic_risk.risk import calculate_risk, generate_reasoning
```

Caching / UI deps: `from epic_risk import cached` (loads Streamlit).

---

## The maths (Risk Score)

All terms are non-negative; result is **rounded to 2 decimals**.

Let:

- \(P\) = distinct merged PRs touching the path in the epic (**PR_Count**).
- \(C\) = **Total Churn** = additions + deletions summed across those PRs.
- \(F_o\) = **Fan-out**: distinct *other* epic-scoped files (same repo, same analysis table) that this file **statically imports** (Python + TS heuristics only).
- \(F_i\) = **Fan-in**: distinct epic-scoped files that **import** this file (reverse index over the same set).

Then:

\[
\textbf{Risk Score}
= 15P
+ 10 \cdot \log_{10}(C + 1)
+ 3 F_o + 4 F_i
\]

**Not in the formula:** **Contributors (epic)** (distinct PR authors). That count appears in the table and in **Risk Reasoning** only, so coordination context does not move the number.

**Elsewhere in the table:** **Complexity Grade** (Radon on Python, Lizard on TS/C++/etc.) and **Lines** inform reasoning text but are not added into Risk Score either.

---

## Practical limits (good to know)

- **Fan-out / Fan-in** only connect files that already appear in the epic’s blast-radius table for that repo—this is intentional (“lite” integration view, not a full repo graph).
- **Import parsing** is heuristic (package paths, relative imports, TS path aliases are best-effort).
- **Commits (PR span)** uses the GitHub commits API with encoded queries; failures show as `-1` in bug mode.
- **AST panel** needs network/file fetch success and, for TSX, `npx tsx` + `test_ast_parser.ts` next to `scrape_repo.py`.

---

## Lint

From `e2e-testing/`:

```bash
uv run ruff check epic_risk scrape_repo.py
```
