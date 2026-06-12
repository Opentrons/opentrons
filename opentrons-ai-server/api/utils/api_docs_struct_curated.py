"""Curated LLM-oriented descriptions for synced Python API documentation files.

See opentrons-ai-server/docs/API_DOCS_CURATION.md for the curation workflow.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

AI_SERVER_ROOT: Path = Path(__file__).resolve().parent.parent.parent
API_DOCS_ROOT: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs"
DOCS_V2_DIR: Path = API_DOCS_ROOT / "docs" / "v2"
CURATED_ABOUT_PATH: Path = API_DOCS_ROOT / "api_docs_struct_about.md"

CURATED_ENTRY_RE = re.compile(
    r"^### (?P<path>.+?)\r?\n\r?\n<about>\r?\n(?P<about>.*?)\r?\n</about>",
    re.MULTILINE | re.DOTALL,
)


def parse_curated_about_file(content: str) -> dict[str, str]:
    """Parse api_docs_struct_about.md entries into markdown-path -> about text."""
    curated: dict[str, str] = {}
    for match in CURATED_ENTRY_RE.finditer(content):
        path = match.group("path").strip()
        about = match.group("about").strip()
        if path in curated:
            msg = f"Duplicate curated entry for {path!r} in {CURATED_ABOUT_PATH}"
            raise ValueError(msg)
        curated[path] = about
    return curated


def load_curated_about() -> dict[str, str]:
    """Load curated about descriptions keyed by synced markdown relative paths."""
    if not CURATED_ABOUT_PATH.is_file():
        return {}

    return parse_curated_about_file(CURATED_ABOUT_PATH.read_text(encoding="utf-8"))


@dataclass(frozen=True)
class CurationCoverageReport:
    """Compare synced markdown paths to committed curated about entries."""

    synced_paths: frozenset[str]
    curated_paths: frozenset[str]

    @property
    def missing_curation(self) -> tuple[str, ...]:
        """Synced docs with no entry in api_docs_struct_about.md."""
        return tuple(sorted(self.synced_paths - self.curated_paths))

    @property
    def orphan_curation(self) -> tuple[str, ...]:
        """Curated entries with no matching synced doc (removed/renamed pages)."""
        return tuple(sorted(self.curated_paths - self.synced_paths))

    @property
    def has_gaps(self) -> bool:
        return bool(self.missing_curation or self.orphan_curation)


class CurationCoverageError(RuntimeError):
    """Raised when synced docs and curated about entries are out of sync."""


def list_synced_markdown_paths(docs_root: Path) -> frozenset[str]:
    if not docs_root.is_dir():
        return frozenset()
    return frozenset(path.relative_to(docs_root).as_posix() for path in docs_root.rglob("*.md") if path.is_file())


def audit_curation_coverage(
    docs_root: Path,
    curated_about: dict[str, str] | None = None,
) -> CurationCoverageReport:
    curated = curated_about if curated_about is not None else load_curated_about()
    return CurationCoverageReport(
        synced_paths=list_synced_markdown_paths(docs_root),
        curated_paths=frozenset(curated),
    )


def format_curation_coverage_issues(report: CurationCoverageReport) -> str:
    lines: list[str] = []
    if report.missing_curation:
        lines.append("Synced docs missing curated <about> entries:")
        lines.extend(f"  - {path}" for path in report.missing_curation)
        lines.append("Add entries to api_docs_struct_about.md (see docs/API_DOCS_CURATION.md).")
    if report.orphan_curation:
        lines.append("Curated entries with no matching synced doc:")
        lines.extend(f"  - {path}" for path in report.orphan_curation)
        lines.append("Remove stale entries from api_docs_struct_about.md.")
    return "\n".join(lines)


def assert_curation_coverage(
    docs_root: Path,
    curated_about: dict[str, str] | None = None,
) -> CurationCoverageReport:
    report = audit_curation_coverage(docs_root, curated_about)
    if report.has_gaps:
        raise CurationCoverageError(format_curation_coverage_issues(report))
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Check curated API doc <about> descriptions.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if synced docs and api_docs_struct_about.md are out of sync.",
    )
    parser.add_argument(
        "--docs-root",
        type=Path,
        default=DOCS_V2_DIR,
        help="Synced markdown root (default: api/storage/api_docs/docs/v2).",
    )
    args = parser.parse_args(argv)

    if not args.check:
        parser.error("Only --check is supported.")

    if not args.docs_root.is_dir():
        print(
            f"error: synced docs not found at {args.docs_root}. Run make sync-api-docs first.",
            file=sys.stderr,
        )
        return 1
    try:
        report = assert_curation_coverage(args.docs_root)
    except CurationCoverageError as error:
        print(f"error: API docs curation coverage check failed:\n{error}", file=sys.stderr)
        return 1
    print(f"API docs curation coverage OK ({len(report.synced_paths)} synced docs, {len(report.curated_paths)} curated entries).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
