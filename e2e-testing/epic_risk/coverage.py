"""Heuristic Codecov / coverage % extraction from PR comments and reviews."""

import re
from typing import Any


def _pct_from_match(prefix: str, m: re.Match[str]) -> str:
    return f"{prefix}{m.group(1)}%"


def _gather_comment_like_entries(pr_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Issue comments plus submitted PR review bodies (Codecov often posts as reviews, not comments)."""
    out: list[dict[str, Any]] = []
    for c in pr_data.get("comments") or []:
        if isinstance(c, dict):
            out.append(c)
    for rev in pr_data.get("reviews") or []:
        if not isinstance(rev, dict):
            continue
        body = rev.get("body")
        if not (body or "").strip():
            continue
        out.append({"body": body, "author": rev.get("author") or {}})
    return out


def attempt_coverage_extraction(pr_data: dict[str, Any]) -> str:
    """Pull a coverage percentage from PR issue comments and reviews, preferring Codecov bot output."""
    codecov_bodies: list[str] = []
    other_bodies: list[str] = []

    for comment in _gather_comment_like_entries(pr_data):
        body = (comment.get("body") or "").strip()
        if not body:
            continue
        author = ((comment.get("author") or {}).get("login") or "").lower()
        lower = body.lower()
        is_codecov = "codecov" in author or "codecov" in lower or "codecov.io" in lower or "codecov-commenter" in author
        if is_codecov:
            codecov_bodies.append(body)
        elif "%" in body and (
            "coverage" in lower
            or "diff hit" in lower
            or "lines covered" in lower
            or re.search(r"\d{1,3}(?:\.\d{1,2})?\s*%\s+of\s+(?:the\s+)?diff", lower)
        ):
            other_bodies.append(body)

    patterns: list[tuple[str, re.Pattern[str]]] = [
        ("Cov patch ", re.compile(r"(?:patch|diff)\s+coverage\s+is\s+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
        ("Cov proj ", re.compile(r"(?:project|total)\s+coverage\s*[:\s]+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
        ("Cov ", re.compile(r"coverage\s+(?:is|of|:)\s+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
        ("Cov ", re.compile(r"(\d{1,3}(?:\.\d{1,2})?)\s*%\s*(?:of\s+)?(?:diff|patch|lines)", re.I)),
        (
            "Cov ",
            re.compile(r"(\d{1,3}(?:\.\d{1,2})?)\s*%\s+of\s+(?:the\s+)?(?:diff|patch)", re.I),
        ),
        ("Cov ", re.compile(r"(?:hit|coverage)\s*[:\s]+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
    ]

    for pool in (codecov_bodies, other_bodies):
        for text in pool:
            for prefix, pat in patterns:
                m = pat.search(text)
                if m:
                    return _pct_from_match(prefix, m)
        if pool is codecov_bodies and codecov_bodies:
            break

    for text in codecov_bodies:
        m = re.search(r"(\d{1,3}(?:\.\d{1,2})?)\s*%", text)
        if m:
            return _pct_from_match("Cov ", m)

    # Not an error — many PRs only expose coverage in Checks UI or bots we did not parse.
    return "Cov n/a"
