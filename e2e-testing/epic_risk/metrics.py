"""Cyclomatic complexity + line counts from in-memory file contents."""

from __future__ import annotations

import lizard
from radon.complexity import cc_rank, cc_visit

METRICS_DOMAINS = frozenset({"⚙️ API / Python", "🦾 Firmware / C++", "🖥️ UI / React"})


def code_metrics_from_raw(file_path: str, domain: str, code_text: str | None) -> tuple[str, int | None]:
    """
    One in-memory pass: cyclomatic grade plus line count (None if unavailable).
    """
    if domain not in METRICS_DOMAINS:
        return "N/A", None

    if code_text is None:
        return "Deleted/Moved", None

    line_count = len(code_text.splitlines())

    try:
        if domain == "⚙️ API / Python":
            blocks = cc_visit(code_text)
            if not blocks:
                return "A (CC: 0)", line_count
            max_cc = max(b.complexity for b in blocks)
            return f"{cc_rank(max_cc)} (CC: {max_cc})", line_count

        if domain in ["🦾 Firmware / C++", "🖥️ UI / React"]:
            analysis = lizard.analyze_file.analyze_source_code(file_path, code_text)
            if not analysis.function_list:
                return "A (CC: 0)", line_count

            max_cc = max(f.cyclomatic_complexity for f in analysis.function_list)
            if max_cc <= 5:
                grade = "A"
            elif max_cc <= 10:
                grade = "B"
            elif max_cc <= 20:
                grade = "C"
            elif max_cc <= 30:
                grade = "D"
            elif max_cc <= 40:
                grade = "E"
            else:
                grade = "F"

            return f"{grade} (CC: {max_cc})", line_count
    except Exception:
        return "Parse Error", line_count
