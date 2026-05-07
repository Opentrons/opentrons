"""Scan merged GitHub PRs for ticket tokens and collect per-file change rows."""

from __future__ import annotations

import json
import re
import subprocess
from collections.abc import Callable
from datetime import datetime
from typing import Any

from epic_risk.constants import PR_QUERY_CHUNK_SIZE
from epic_risk.coverage import attempt_coverage_extraction
from epic_risk.domains import categorize_domain
from epic_risk.github import parse_github_datetime


def _tickets_mentioned_in_text(haystack: str, tickets: list[str]) -> str:
    """Return comma-separated epic tickets whose keys appear in PR title/body/comments (word-safe match)."""
    if not haystack.strip() or not tickets:
        return ""
    matched: list[str] = []
    seen: set[str] = set()
    for raw in tickets:
        t = raw.strip()
        if not t:
            continue
        pat = r"(?<![A-Z0-9])" + re.escape(t.upper()) + r"(?![A-Z0-9])"
        if re.search(pat, haystack, flags=re.IGNORECASE) and t not in seen:
            seen.add(t)
            matched.append(t)
    matched.sort(key=lambda x: x.upper())
    return ", ".join(matched)


def _pr_text_for_ticket_scan(pr_data: dict[str, Any]) -> str:
    parts: list[str] = []
    title = pr_data.get("title")
    if title:
        parts.append(str(title))
    body = pr_data.get("body")
    if body:
        parts.append(str(body))
    for c in pr_data.get("comments") or []:
        if isinstance(c, dict):
            b = c.get("body")
            if b:
                parts.append(str(b))
    return "\n".join(parts)


def _iter_ticket_chunks(tickets: list[str], chunk_size: int) -> list[list[str]]:
    return [tickets[i : i + chunk_size] for i in range(0, len(tickets), chunk_size)]


def scan_merged_prs_for_epic_files(
    repos: list[str],
    tickets: list[str],
    discovery_floor: str,
    *,
    on_repo_complete: Callable[[int, int, str], None] | None = None,
) -> tuple[list[dict[str, Any]], list[datetime]]:
    """
    For each repo, search merged PRs mentioning ticket chunks, then expand each hit with `gh pr view`.

    Returns:
        - `all_file_data`: one dict per (PR × file) row for aggregation
        - `pr_merge_datetimes`: merge times for the PR-span window (may be empty if no dates parsed)
    """
    all_file_data: list[dict[str, Any]] = []
    processed_prs: dict[str, str] = {}
    pr_merge_datetimes: list[datetime] = []

    chunks = _iter_ticket_chunks(tickets, PR_QUERY_CHUNK_SIZE)

    for repo_idx, repo in enumerate(repos):
        for chunk in chunks:
            ticket_query = " OR ".join([f'"{t}"' for t in chunk])
            search_query = f"is:pr is:merged merged:>={discovery_floor} {ticket_query}"

            search_cmd = [
                "gh",
                "pr",
                "list",
                "--repo",
                repo,
                "--search",
                search_query,
                "--state",
                "merged",
                "--json",
                "number,title,mergedAt",
            ]

            try:
                result = subprocess.run(search_cmd, stdout=subprocess.PIPE, text=True, check=True)
                prs = json.loads(result.stdout)
            except (subprocess.CalledProcessError, json.JSONDecodeError):
                continue

            for pr in prs:
                pr_num = str(pr["number"])
                pr_id = f"{repo}#{pr_num}"
                ma_list = pr.get("mergedAt")
                if ma_list:
                    try:
                        pr_merge_datetimes.append(parse_github_datetime(ma_list))
                    except ValueError:
                        pass

                if pr_id in processed_prs:
                    continue

                view_cmd = [
                    "gh",
                    "pr",
                    "view",
                    pr_num,
                    "--repo",
                    repo,
                    "--json",
                    "files,comments,reviews,mergedAt,title,body,author",
                ]
                try:
                    view_result = subprocess.run(view_cmd, stdout=subprocess.PIPE, text=True, check=True)
                    pr_data = json.loads(view_result.stdout)
                    if not ma_list and pr_data.get("mergedAt"):
                        try:
                            pr_merge_datetimes.append(parse_github_datetime(pr_data["mergedAt"]))
                        except ValueError:
                            pass
                    cov_status = attempt_coverage_extraction(pr_data)
                    processed_prs[pr_id] = f"#{pr_num} ({cov_status})"
                    pr_author = (pr_data.get("author") or {}).get("login") or ""
                    jira_tickets = _tickets_mentioned_in_text(_pr_text_for_ticket_scan(pr_data), tickets)

                    for file_info in pr_data.get("files", []):
                        status = file_info.get("status") or file_info.get("changeType") or "modified"
                        all_file_data.append(
                            {
                                "RepoFullName": repo,
                                "Repo": repo.split("/")[-1],
                                "PR": pr_num,
                                "PR_Display": processed_prs[pr_id],
                                "PR_Author": pr_author,
                                "File": file_info.get("path"),
                                "Domain": categorize_domain(file_info.get("path", "")),
                                "Adds": file_info.get("additions", 0),
                                "Dels": file_info.get("deletions", 0),
                                "File_Status": status,
                                "Jira tickets": jira_tickets,
                            }
                        )
                except Exception:
                    continue

        if on_repo_complete is not None:
            on_repo_complete(repo_idx + 1, len(repos), repo)

    return all_file_data, pr_merge_datetimes
