"""Heuristic risk score and blameless narrative reasoning for QA prioritization."""

from __future__ import annotations

import math
import re
from typing import Any

import pandas as pd


def calculate_risk(row: Any) -> float:
    """
    **Risk Score** (the table’s “magic number”) is a weighted sum of observable epic signals. It is
    **heuristic** — for prioritization and discussion, not a pass/fail grade.

    Components (all non‑negative; rounded to 2 decimals):

    1. **PR overlap** — `PR_Count * 15`
       More distinct merged PRs touching the path → more chance of cross‑change interaction.

    2. **Churn** — `log10(Total Churn + 1) * 10`
       Dampened by log so huge diffs add weight without dominating.

    3. **Epic import graph** (same repo, files in this table only) — `Fan_out * 3 + Fan_in * 4`
       Fan-out = distinct other epic files this file imports. Fan-in = distinct epic files that import
       this file. Slightly higher weight on fan-in as a simple “integration hub” hint.

    **Contributors (epic)** is listed in the table and reflected in **Risk Reasoning** text for context;
    it is **not** added into this numeric score.
    """
    pr_weight = row["PR_Count"] * 15
    churn_weight = math.log10(row["Total Churn"] + 1) * 10
    fo = int(row.get("Fan-out", 0) or 0)
    fi = int(row.get("Fan-in", 0) or 0)
    hub_weight = fo * 3 + fi * 4
    return round(pr_weight + churn_weight + hub_weight, 2)


def _cc_from_grade(complexity_grade: str) -> int | None:
    """Extract max cyclomatic number from 'B (CC: 12)' etc."""
    if not isinstance(complexity_grade, str):
        return None
    m = re.search(r"CC:\s*(\d+)", complexity_grade)
    if m:
        return int(m.group(1))
    return None


def generate_reasoning(row: pd.Series) -> str:
    """
    Blameless, stacked testing hints — tied to observable signals only.
    """
    clauses: list[str] = []

    pc = int(row["PR_Count"])
    churn = int(row["Total Churn"])
    score = float(row["Risk Score"])
    contributors = int(row.get("Contributors (epic)", 0) or 0)
    lines_val = row.get("Lines")
    if lines_val is not None and pd.notna(lines_val):
        try:
            n_lines = int(lines_val)
        except (TypeError, ValueError):
            n_lines = None
    else:
        n_lines = None

    new_in_epic = row.get("New File") == "🆕 New in epic"
    commits_span = row.get("Commits (PR span)")
    has_commits = False
    if commits_span is not None and pd.notna(commits_span):
        try:
            has_commits = int(commits_span) >= 0
        except (TypeError, ValueError):
            has_commits = False

    if pc >= 4:
        clauses.append(
            f"Several merged PRs ({pc}) touched this path — good focus area for cross-flow checks "
            "where those changes meet."
        )
    elif pc == 3:
        clauses.append(
            f"Three PRs ({pc}) intersect here — worth a quick pass on integration scenarios across those merges."
        )

    if churn >= 800:
        clauses.append(
            f"High change volume in this epic (~{churn} lines added/removed); a broader regression slice is reasonable."
        )
    elif 400 <= churn < 800:
        clauses.append(f"Moderate–high churn (~{churn} lines in this epic); extend coverage on dependent behaviors.")

    if new_in_epic:
        clauses.append("Introduced as new in this epic — allow extra time for first-use paths.")

    if contributors == 1:
        clauses.append(
            "Single distinct PR author in this epic for this path — narrower ownership; "
            "plan validation so critical assumptions aren’t only in one person’s head."
        )
    elif 2 <= contributors <= 3:
        clauses.append(
            f"A small set of contributors ({contributors}) — relatively contained coordination "
            "for cross‑scenario checks."
        )
    elif contributors >= 4:
        clauses.append(
            f"Several contributors ({contributors} distinct PR authors) — higher coordination surface; "
            "align on shared behaviors when testing end-to-end."
        )

    fo = int(row.get("Fan-out", 0) or 0)
    fi = int(row.get("Fan-in", 0) or 0)
    if fi >= 6:
        clauses.append(
            f"Several other files in this epic’s scope import this one ({fi} importers) — a likely integration hub; "
            "exercise a few end-to-end paths that use it."
        )
    elif 3 <= fi < 6:
        clauses.append(
            f"Multiple epic-scoped importers ({fi}) — worth checking combined behaviors where those callers overlap."
        )

    if fo >= 8:
        clauses.append(
            f"This file references many other epic paths ({fo} distinct in-epic imports) — wide coordination surface; "
            "sample a few dependency chains rather than every leaf."
        )
    elif 4 <= fo < 8:
        clauses.append(
            f"Touches several other epic files ({fo} import edges) — integration-style regressions are plausible."
        )

    if n_lines is not None:
        if n_lines >= 900:
            clauses.append(
                f"Large file (~{n_lines} lines); prioritize representative journeys rather than exhaustive line reads."
            )
        elif n_lines >= 400:
            clauses.append(f"Mid-sized file (~{n_lines} lines); combine spot checks with critical-path scenarios.")

    cc = _cc_from_grade(str(row.get("Complexity Grade", "")))
    if cc is not None:
        if cc >= 25:
            clauses.append(
                f"Complexity reads elevated (CC ~{cc}); worth extra edge-case passes where branching is dense."
            )
        elif cc >= 15:
            clauses.append(f"Moderate structural complexity (CC ~{cc}); include a few branch-heavy cases.")

    if has_commits:
        cspan = int(commits_span)
        if cspan >= 30:
            clauses.append(
                f"Sustained activity on default branch in the PR window ({cspan} commits touching this path); "
                "good candidate for stability-focused retesting."
            )
        elif 12 <= cspan < 30:
            clauses.append(f"Meaningful commit traffic in the PR window ({cspan}); sanity-check recent fixes together.")

    if score >= 45 and not clauses:
        clauses.append(
            "Risk score is elevated from epic churn and PR overlap — scale breadth of validation accordingly."
        )
    elif score >= 45:
        clauses.append("Overall hotspot for this epic — sequencing breadth before depth is a fair trade.")

    if not clauses:
        clauses.append("Change profile looks typical for this epic — follow your usual risk-based sampling.")

    return " · ".join(clauses)
