"""Heuristic Codecov / coverage % extraction from PR comment bodies."""

import re
from typing import Any


def _pct_from_match(prefix: str, m: re.Match[str]) -> str:
    return f"{prefix}{m.group(1)}%"


def attempt_coverage_extraction(comments_list: list[Any]) -> str:
    """Pull a coverage percentage from PR comments, preferring Codecov bot output."""
    codecov_bodies: list[str] = []
    other_bodies: list[str] = []

    for comment in comments_list:
        body = (comment.get("body") or "").strip()
        if not body:
            continue
        author = ((comment.get("author") or {}).get("login") or "").lower()
        lower = body.lower()
        if "codecov" in author or "codecov" in lower:
            codecov_bodies.append(body)
        elif "coverage" in lower and "%" in body:
            other_bodies.append(body)

    patterns: list[tuple[str, re.Pattern[str]]] = [
        ("Cov patch ", re.compile(r"(?:patch|diff)\s+coverage\s+is\s+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
        ("Cov proj ", re.compile(r"(?:project|total)\s+coverage\s*[:\s]+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
        ("Cov ", re.compile(r"coverage\s+(?:is|of|:)\s+(\d{1,3}(?:\.\d{1,2})?)\s*%", re.I)),
        ("Cov ", re.compile(r"(\d{1,3}(?:\.\d{1,2})?)\s*%\s*(?:of\s+)?(?:diff|patch|lines)", re.I)),
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

    return "Cov: Unknown"
