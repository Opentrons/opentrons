"""DataFrame aggregation, sorting, and display column lists for the epic risk table."""

from __future__ import annotations

import pandas as pd

from epic_risk.constants import IGNORED_DOMAINS


def aggregate_epic_file_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Group PR file rows into one row per (repo, domain, file) with churn and contributor counts."""
    summary_df = (
        df.groupby(["RepoFullName", "Repo", "Domain", "File"])
        .agg(
            Adds=("Adds", "sum"),
            Dels=("Dels", "sum"),
            PR_Count=("PR", "nunique"),
            PR_Numbers=("PR_Display", lambda x: ", ".join(sorted(list(set(x))))),
            _any_added=("File_Status", lambda s: (s == "added").any()),
            Contributors_epic=(
                "PR_Author",
                lambda s: pd.Series(s).dropna().astype(str).loc[lambda x: x != ""].nunique(),
            ),
        )
        .reset_index()
    )
    summary_df = summary_df.rename(columns={"Contributors_epic": "Contributors (epic)"})

    summary_df["New File"] = summary_df["_any_added"].map(lambda v: "🆕 New in epic" if v else "—")
    summary_df = summary_df.drop(columns=["_any_added"])

    summary_df["Total Churn"] = summary_df["Adds"] + summary_df["Dels"]
    return summary_df


def drop_ignored_domains(summary_df: pd.DataFrame) -> pd.DataFrame:
    return summary_df[~summary_df["Domain"].isin(IGNORED_DOMAINS)]


def sort_epic_summary(summary_df: pd.DataFrame, *, bug_epic_mode: bool) -> pd.DataFrame:
    """Stable sort: new files first, optional commit traffic, then risk score."""
    summary_df = summary_df.copy()
    summary_df["_nf_sort"] = summary_df["New File"].eq("🆕 New in epic")
    sort_cols: list[str] = ["_nf_sort", "Risk Score"]
    sort_asc = [False, False]
    if bug_epic_mode and "Commits (PR span)" in summary_df.columns:
        summary_df["_commit_sort"] = summary_df["Commits (PR span)"].clip(lower=0)
        sort_cols = ["_nf_sort", "_commit_sort", "Risk Score"]
        sort_asc = [False, False, False]

    return summary_df.sort_values(by=sort_cols, ascending=sort_asc).drop(
        columns=[c for c in ["_nf_sort", "_commit_sort"] if c in summary_df.columns]
    )


def base_display_columns(*, bug_epic_mode: bool, has_commit_span: bool) -> list[str]:
    cols = [
        "Risk Score",
        "New File",
        "Kind",
        "File",
        "Lines",
        "Fan-out",
        "Fan-in",
        "Contributors (epic)",
        "Complexity Grade",
        "Risk Reasoning",
        "Syntax tree",
        "PR_Numbers",
        "Adds",
        "Dels",
        "Total Churn",
        "RepoFullName",
    ]
    if bug_epic_mode and has_commit_span:
        return cols[:2] + ["Commits (PR span)"] + cols[2:]
    return cols
