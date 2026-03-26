"""Write markdown to GitHub Actions job summaries (GITHUB_STEP_SUMMARY)."""

from __future__ import annotations

import os


def append_job_summary(markdown: str) -> None:
    """Append markdown to the job summary file when GITHUB_STEP_SUMMARY is set."""
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return
    with open(summary_path, "a", encoding="utf-8") as handle:
        handle.write(markdown)
        handle.write("\n")
