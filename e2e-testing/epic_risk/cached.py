"""
Streamlit `@st.cache_data` wrappers around GitHub + metrics.

Keep **uncached** implementations in `github.py` / `metrics.py` for reuse in tests or CLIs.
"""

from __future__ import annotations

import streamlit as st

from epic_risk import github as gh
from epic_risk import metrics as met


@st.cache_data(show_spinner=False)
def fetch_raw_file(repo: str, file_path: str, *, _revision: int = 1) -> str | None:
    _ = _revision
    return gh.fetch_raw_file_contents(repo, file_path)


@st.cache_data(show_spinner=False)
def count_commits_touching_path(
    repo: str,
    file_path: str,
    since_iso: str,
    until_iso: str | None = None,
    *,
    _cache_revision: int = 3,
) -> int:
    _ = _cache_revision
    return gh.count_commits_touching_path(repo, file_path, since_iso, until_iso)


@st.cache_data(show_spinner=False)
def fetch_code_metrics(repo: str, file_path: str, domain: str, *, _revision: int = 1) -> tuple[str, int | None]:
    _ = _revision
    raw = fetch_raw_file(repo, file_path)
    return met.code_metrics_from_raw(file_path, domain, raw)
