"""Streamlit layout: results table, column config, and optional AST inspector panel."""

from __future__ import annotations

import ast
from collections.abc import Callable
from pathlib import Path

import astpretty
import pandas as pd
import streamlit as st

from epic_risk.ast_tools import run_ts_ast_to_json
from epic_risk.constants import GH_COMMIT_CAP

_E2E_ROOT = Path(__file__).resolve().parent.parent
_TS_PARSER = _E2E_ROOT / "test_ast_parser.ts"


def _column_config_for_table(epic_window: str, *, include_commit_col: bool) -> dict:
    col_cfg: dict = {
        "Risk Score": st.column_config.NumberColumn(
            format="%.1f",
            help=(
                "Heuristic mix of PR overlap, churn, and import fan-out/in within this epic. "
                "There is **no fixed ceiling** — scores in the hundreds can appear when many PRs "
                "touch the same path or hub files; compare rows relatively, not to an absolute scale."
            ),
        ),
        "New File": st.column_config.TextColumn(width="small"),
        "Kind": st.column_config.TextColumn(
            " ",
            width="small",
            help="🐍 Python · ⚛️ React/TS · 🦾 C/C++ · 🐧 Bitbake · other stacks use adjacent emoji.",
        ),
        "File": st.column_config.TextColumn(width="large"),
        "Lines": st.column_config.NumberColumn(
            format="%d",
            help="Line count of the file on the repo default branch (one GitHub fetch).",
        ),
        "Fan-out": st.column_config.NumberColumn(
            format="%d",
            help=(
                "Distinct other files **in this epic’s blast radius** that this file statically imports "
                "(Python / TS heuristics; same repo only)."
            ),
        ),
        "Fan-in": st.column_config.NumberColumn(
            format="%d",
            help=(
                "How many other epic-scoped files import this path (reverse index over the same set) — "
                "higher often means a shared integration point."
            ),
        ),
        "Contributors (epic)": st.column_config.NumberColumn(
            format="%d",
            help=(
                "Distinct PR author logins among merged PRs that touched this file for your tickets. "
                "For context only — not included in Risk Score."
            ),
        ),
        "Complexity Grade": st.column_config.TextColumn(width="small"),
        "Risk Reasoning": st.column_config.TextColumn(
            width="large",
            help="Blameless, signal-based ideas for where to focus validation — not a quality judgment.",
        ),
        "Syntax tree": st.column_config.TextColumn(
            width="small",
            help="Rows marked ↓ can be parsed in the panel directly under this table.",
        ),
        "PR_Numbers": st.column_config.TextColumn(
            "Linked PRs & Coverage",
            width="medium",
            help=(
                "Merged PR numbers with a **Cov …** snippet when a percentage was found in issue comments "
                "or submitted reviews (Codecov-style text). **Cov n/a** means nothing matched — coverage "
                "may still exist under GitHub Checks only."
            ),
        ),
        "Jira tickets": st.column_config.TextColumn(
            width="medium",
            help=(
                "Epic ticket keys detected in each linked PR’s title, body, or comments "
                "(from your pasted list). Union across all PRs that touched this file."
            ),
        ),
    }
    if include_commit_col and epic_window:
        col_cfg["Commits (PR span)"] = st.column_config.NumberColumn(
            "Commits (PR span)",
            format="%d",
            help=(
                f"Commits on the default branch touching this path between **{epic_window}** "
                f"(merge dates of PRs matched for your tickets). Capped at {GH_COMMIT_CAP}; "
                "-1 means the GitHub request failed."
            ),
        )
    return col_cfg


def render_ast_inspector_below(
    display_df: pd.DataFrame,
    fetch_raw_file: Callable[[str, str], str | None],
) -> None:
    st.divider()
    st.subheader("Syntax tree (Python / TS / TSX)")
    st.caption(
        "Use the selector for any row where the table shows **↓ Panel below**. "
        "Fetches default-branch file contents via `gh` and parses locally."
    )
    parsable_files = display_df[display_df["Domain"].isin(["⚙️ API / Python", "🖥️ UI / React"])]
    if parsable_files.empty:
        st.info("No parsable Python or TS/TSX files in this epic’s blast radius.")
        return

    def _file_option_label(row: pd.Series) -> str:
        return f"{row['RepoFullName']}::{row['File']} ({row['Domain']})"

    file_options = parsable_files.apply(_file_option_label, axis=1).tolist()
    selected_option = st.selectbox(
        "Select a file to parse:",
        ["-- Select a file --"] + file_options,
    )
    if selected_option == "-- Select a file --":
        return

    repo_name, file_path_and_domain = selected_option.split("::")
    file_path = file_path_and_domain.split(" (")[0]
    domain = file_path_and_domain.split(" (")[1].replace(")", "")
    with st.spinner("Downloading and parsing…"):
        raw_code = fetch_raw_file(repo_name, file_path)
        if raw_code is None:
            st.error("Could not fetch the file from GitHub.")
            return
        if domain == "⚙️ API / Python":
            try:
                tree = ast.parse(raw_code)
                pretty_tree = astpretty.pformat(tree, indent="  ", show_offsets=True)
                st.caption(f"Python AST for `{file_path}` (astpretty)")
                st.code(pretty_tree, language="python", line_numbers=True)
            except SyntaxError:
                st.error("Could not parse file: invalid Python syntax.")
        elif domain == "🖥️ UI / React":
            ok, out, err = run_ts_ast_to_json(raw_code, parser_script=_TS_PARSER, cwd=_E2E_ROOT)
            if ok:
                st.caption(f"Babel AST for `{file_path}`")
                st.code(out, language="json", line_numbers=True)
            else:
                st.error(f"TS/TSX parser failed: {err or out or 'no output'}")


def render_epic_results_table(
    fetch_raw_file: Callable[[str, str], str | None],
) -> None:
    display_df = st.session_state.get("display_df")
    if display_df is None or display_df.empty:
        return
    epic_window = st.session_state.get("epic_pr_window_label", "")
    bug_epic_show = bool(st.session_state.get("bug_epic_snapshot"))
    n_repos = int(st.session_state.get("last_repo_count", 0))

    st.markdown(
        """
        <style>
        div[data-testid="stDataFrame"] div[role="grid"] div[role="row"] div[role="cell"] {
            white-space: normal !important;
            word-break: break-word;
            vertical-align: top;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.success(f"Successfully mapped {len(display_df)} functional files across {n_repos} repos!")
    if epic_window:
        if bug_epic_show:
            st.caption(
                f"**Matched PR merge span:** `{epic_window}` — "
                "**Commits (PR span)** = default-branch commits on each path between these dates."
            )
        else:
            st.caption(f"**Matched PR merge span** (earliest → latest merged PR for your tickets): `{epic_window}`")

    has_commits = bug_epic_show and "Commits (PR span)" in display_df.columns
    col_cfg = _column_config_for_table(epic_window, include_commit_col=has_commits)
    if has_commits:
        pos = display_df.loc[display_df["Commits (PR span)"] >= 0, "Commits (PR span)"]
        p75 = float(pos.quantile(0.75)) if len(pos) else 0.0

        def _commit_cell_style(v: object) -> str:
            if isinstance(v, (int, float)) and v < 0:
                return "background-color: #ffcdd2"
            if isinstance(v, (int, float)) and v >= p75 and p75 > 0:
                return "background-color: #ffe0b2"
            return ""

        table_df = display_df.drop(columns=["Domain"], errors="ignore")
        styled = table_df.style.map(_commit_cell_style, subset=["Commits (PR span)"])
        st.dataframe(styled, use_container_width=True, hide_index=True, column_config=col_cfg)
    else:
        table_df = display_df.drop(columns=["Domain"], errors="ignore")
        st.dataframe(
            table_df,
            use_container_width=True,
            hide_index=True,
            column_config=col_cfg,
        )

    render_ast_inspector_below(display_df, fetch_raw_file)
