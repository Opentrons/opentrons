"""GitHub CLI (`gh`) subprocess helpers — uncached; pair with `cached.py` for Streamlit."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime
from urllib.parse import quote, urlencode

from epic_risk.constants import GH_COMMIT_MAX_PAGES, GH_COMMIT_PER_PAGE


def parse_github_datetime(iso: str) -> datetime:
    """Parse GitHub API timestamps (…Z suffix)."""
    if iso.endswith("Z"):
        iso = iso[:-1] + "+00:00"
    return datetime.fromisoformat(iso)


def fetch_raw_file_contents(repo: str, file_path: str) -> str | None:
    """Default-branch file body via GitHub raw contents API."""
    if not file_path:
        return None
    enc = quote(file_path, safe="")
    cmd = ["gh", "api", "-H", "Accept: application/vnd.github.raw", f"repos/{repo}/contents/{enc}"]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        return None
    return res.stdout


def commits_list_endpoint(repo: str, file_path: str, since_iso: str, until_iso: str | None, page: int) -> str:
    """Build GET path+query for List commits (proper encoding; avoids gh -f quirks)."""
    since_param = f"{since_iso}T00:00:00Z"
    pairs: list[tuple[str, str]] = [
        ("path", file_path),
        ("since", since_param),
        ("per_page", str(GH_COMMIT_PER_PAGE)),
        ("page", str(page)),
    ]
    if until_iso:
        pairs.append(("until", f"{until_iso}T23:59:59Z"))
    qs = urlencode(pairs, quote_via=quote)
    return f"repos/{repo}/commits?{qs}"


def count_commits_touching_path(
    repo: str,
    file_path: str,
    since_iso: str,
    until_iso: str | None = None,
) -> int:
    """
    Commits on the repo default branch that touch `file_path` between `since_iso` and `until_iso`
    (YYYY-MM-DD, inclusive span). If `until_iso` is None, only `since` is sent (open-ended).
    Returns -1 if the GitHub API call fails.
    """
    if not file_path:
        return 0

    total = 0
    page = 1

    while page <= GH_COMMIT_MAX_PAGES:
        endpoint = commits_list_endpoint(repo, file_path, since_iso, until_iso, page)
        cmd = ["gh", "api", "-H", "Accept: application/vnd.github+json", endpoint]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            return -1
        try:
            batch = json.loads(res.stdout)
        except json.JSONDecodeError:
            return -1
        if not isinstance(batch, list) or not batch:
            break
        total += len(batch)
        if len(batch) < GH_COMMIT_PER_PAGE:
            break
        page += 1

    return total
