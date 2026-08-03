# Epic risk analyzer (`epic_risk`)

Maps **Jira ticket tokens** to **merged GitHub PRs**, rolls up **per-file churn**, and
surfaces **heuristic risk**, **complexity** (Python via Radon; TS/JS and C/C++ via Lizard),
optional **bug-epic commit counts**, **coverage hints** from PR comments, **import
fan-out / fan-in** (Python + TS), and **Risk Reasoning** prose for QA triage.

The numeric score is for prioritization, not a pass/fail grade.

## Setup

Prerequisites: GitHub CLI (`gh`) logged in, Python 3.12+, `uv`.

```bash
cd e2e-testing
make -C epic_risk setup
make -C epic_risk auth
```

## Run

```bash
make -C epic_risk run
```

Paste tickets, pick repos, click **Analyze Risk**. Enable **Bug epic mode** to count
default-branch commits per file between the earliest and latest matched PR merge dates.

## Risk score

```text
Risk Score = 15P + 10·log10(C + 1) + 3 Fo + 4 Fi
```

- `P` = distinct merged PRs touching the path
- `C` = total churn (adds + dels)
- `Fo`, `Fi` = epic-local import fan-out / fan-in (Python + TS heuristics)

Complexity, coverage, contributors, and commit traffic inform **Risk Reasoning** and
the table; they are not all folded into the numeric score.

## Language coverage

| Signal             | Python | TypeScript / JS | C / C++ |
| ------------------ | ------ | --------------- | ------- |
| Complexity         | Radon  | Lizard          | Lizard  |
| Import fan-in/out  | yes    | yes (heuristic) | no      |
| Churn / PR overlap | yes    | yes             | yes     |

## Layout

| Piece               | Role                            |
| ------------------- | ------------------------------- |
| `../scrape_repo.py` | Streamlit UI                    |
| `pr_discovery.py`   | Ticket → merged PRs → file rows |
| `aggregation.py`    | Per-file rollup                 |
| `import_graph.py`   | Fan-out / fan-in                |
| `metrics.py`        | Complexity + line counts        |
| `coverage.py`       | Cov % from PR comments/reviews  |
| `risk.py`           | Score + reasoning               |
| `views.py`          | Results table                   |

## Lint

```bash
uv run --extra epic-risk ruff check epic_risk scrape_repo.py
```
