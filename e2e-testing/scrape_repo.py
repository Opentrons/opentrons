"""Streamlit entrypoint for the QA Epic Risk Analyzer (`epic_risk` package)."""

from __future__ import annotations

import re
from datetime import datetime, timedelta

import pandas as pd
import streamlit as st

from epic_risk.aggregation import (
    aggregate_epic_file_rows,
    base_display_columns,
    drop_ignored_domains,
    sort_epic_summary,
)
from epic_risk.cached import (
    count_commits_touching_path,
    fetch_code_metrics,
    fetch_raw_file,
)
from epic_risk.constants import (
    DEFAULT_REPOS_OPTIONS,
    DEFAULT_REPOS_SELECTED,
    DEFAULT_TICKETS_TEXT,
    GH_COMMIT_CAP,
    PR_SEARCH_MERGED_SINCE_YEARS,
)
from epic_risk.domains import domain_kind_icon
from epic_risk.import_graph import build_fan_metrics_df
from epic_risk.pr_discovery import scan_merged_prs_for_epic_files
from epic_risk.risk import calculate_risk, generate_reasoning
from epic_risk.views import render_epic_results_table

# --- STREAMLIT UI SETUP ---
st.set_page_config(page_title="QA Epic Risk Analyzer", page_icon="🎯", layout="wide")
st.title("🎯 QA Epic Risk Analyzer")
st.markdown(
    "Paste your Jira tickets below to generate a targeted test plan based on code "
    "churn, PR overlap, and cyclomatic complexity."
)

col1, col2 = st.columns([2, 1])
with col1:
    ticket_input = st.text_area(
        "Paste Jira Tickets (comma or newline separated):",
        DEFAULT_TICKETS_TEXT,
    )
with col2:
    repos_input = st.multiselect(
        "Select Repositories to Scan:",
        DEFAULT_REPOS_OPTIONS,
        default=DEFAULT_REPOS_SELECTED,
    )

bug_epic_mode = st.checkbox(
    "Bug epic mode",
    value=False,
    help=(
        "Count commits on each file’s default branch between the earliest and latest **merge dates** "
        "among PRs matched for your tickets (PR-span window). Higher counts often mean unstable paths."
    ),
)


if st.button("Analyze Risk", type="primary"):
    if not repos_input:
        st.error("Please select at least one repository.")
        st.stop()

    tickets = [t.strip() for t in re.split(r"[,\n]+", ticket_input) if t.strip()]
    if not tickets:
        st.error("Please enter at least one ticket.")
        st.stop()

    discovery_floor = (datetime.now() - timedelta(days=365 * PR_SEARCH_MERGED_SINCE_YEARS)).strftime("%Y-%m-%d")

    progress_text = "Scanning GitHub API..."
    my_bar = st.progress(0, text=progress_text)
    with st.spinner("Fetching PRs and code diffs... This may take a minute."):
        all_file_data, pr_merge_datetimes = scan_merged_prs_for_epic_files(
            repos_input,
            tickets,
            discovery_floor,
            on_repo_complete=lambda cur, tot, repo: my_bar.progress(
                cur / tot, text=f"Finished scanning {repo}"
            ),
        )
    my_bar.empty()

    if pr_merge_datetimes:
        epic_since_date = min(pr_merge_datetimes).date().isoformat()
        epic_until_date = max(pr_merge_datetimes).date().isoformat()
    else:
        epic_since_date = discovery_floor
        epic_until_date = datetime.now().strftime("%Y-%m-%d")

    if not all_file_data:
        st.warning(f"No file changes found for these tickets (no merged PR hits since {discovery_floor}).")
        st.session_state["display_df"] = None
    else:
        df = pd.DataFrame(all_file_data)
        summary_df = aggregate_epic_file_rows(df)
        summary_df = drop_ignored_domains(summary_df)

        def _one_metrics(row: pd.Series) -> pd.Series:
            cg, ln = fetch_code_metrics(row["RepoFullName"], row["File"], row["Domain"])
            return pd.Series(
                {
                    "Complexity Grade": cg,
                    "Lines": ln if ln is not None else pd.NA,
                }
            )

        with st.spinner("Fetching files for complexity, line counts…"):
            _metrics = summary_df.apply(_one_metrics, axis=1)
            summary_df = pd.concat([summary_df, _metrics], axis=1)
            summary_df["Lines"] = summary_df["Lines"].astype("Int64")

        if bug_epic_mode:
            n_rows = len(summary_df)
            counts: list[int] = []
            prog = st.progress(0.0, text="Bug epic: counting commits per file…")
            for i, row in enumerate(summary_df.itertuples(index=False)):
                n = count_commits_touching_path(row.RepoFullName, row.File, epic_since_date, epic_until_date)
                if n < 0:
                    counts.append(-1)
                elif n >= GH_COMMIT_CAP:
                    counts.append(GH_COMMIT_CAP)
                else:
                    counts.append(n)
                prog.progress((i + 1) / max(n_rows, 1), text=f"Commits {i + 1}/{n_rows}…")
            prog.empty()
            summary_df["Commits (PR span)"] = counts

        with st.spinner("Mapping epic-local imports (fan-out / fan-in)…"):
            summary_df = build_fan_metrics_df(summary_df, fetch_raw_file)

        summary_df["Risk Score"] = summary_df.apply(calculate_risk, axis=1)
        summary_df["Risk Reasoning"] = summary_df.apply(generate_reasoning, axis=1)
        summary_df["Kind"] = summary_df["Domain"].map(domain_kind_icon)

        summary_df = sort_epic_summary(summary_df, bug_epic_mode=bug_epic_mode)

        has_commit_span = bug_epic_mode and "Commits (PR span)" in summary_df.columns
        display_cols = base_display_columns(bug_epic_mode=bug_epic_mode, has_commit_span=has_commit_span)

        display_df = summary_df[display_cols].copy()
        display_df["Domain"] = summary_df["Domain"].values

        st.session_state["display_df"] = display_df
        st.session_state["epic_pr_window_label"] = f"{epic_since_date} → {epic_until_date}"
        st.session_state["bug_epic_snapshot"] = bug_epic_mode
        st.session_state["last_repo_count"] = len(repos_input)


if st.session_state.get("display_df") is not None and not st.session_state["display_df"].empty:
    render_epic_results_table()
