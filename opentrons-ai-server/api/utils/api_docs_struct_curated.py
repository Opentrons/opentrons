"""Curated LLM-oriented descriptions for synced Python API documentation files.

See opentrons-ai-server/docs/API_DOCS_CURATION.md for the full curation workflow,
legacy RST → markdown mapping rules, and how to add new <about> descriptions.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

AI_SERVER_ROOT: Path = Path(__file__).resolve().parent.parent.parent
API_DOCS_ROOT: Path = AI_SERVER_ROOT / "api" / "storage" / "api_docs"
DOCS_V2_DIR: Path = API_DOCS_ROOT / "docs" / "v2"
CURATED_ABOUT_PATH: Path = API_DOCS_ROOT / "api_docs_struct_about.json"
LEGACY_STRUCT_PATH: Path = API_DOCS_ROOT / "api_docs_struct_v2.25.md"

STRUCT_ENTRY_RE = re.compile(
    r"^### \d+\. (?P<path>.+?)\r?\n\r?\n<about>\r?\n(?P<about>.*?)\r?\n</about>",
    re.MULTILINE | re.DOTALL,
)

# Maps legacy docs/v2/*.rst paths to synced markdown paths under docs/v2/.
LEGACY_RST_TO_MD: dict[str, str] = {
    "docs/v2/new_advanced_running.rst": "advanced-control/index.md",
    "docs/v2/new_atomic_commands.rst": "building-block-commands/index.md",
    "docs/v2/new_complex_commands.rst": "complex-commands/index.md",
    "docs/v2/new_examples.rst": "examples.md",
    "docs/v2/new_labware.rst": "labware.md",
    "docs/v2/new_modules.rst": "modules/index.md",
    "docs/v2/new_pipette.rst": "pipettes/index.md",
    "docs/v2/new_protocol_api.rst": "reference/protocols.md",
    "docs/v2/runtime_parameters.rst": "runtime-parameters/index.md",
    "docs/v2/basic_commands/liquids.rst": "building-block-commands/liquids.md",
    "docs/v2/basic_commands/pipette_tips.rst": "building-block-commands/pipette-tips.md",
    "docs/v2/basic_commands/utilities.rst": "building-block-commands/utilities.md",
    "docs/v2/advanced_control/motor_control.rst": "advanced-control/robot-motors.md",
    "docs/v2/modules/stacker.rst": "modules/flex-stacker.md",
    "docs/v2/parameters/choosing.rst": "runtime-parameters/choosing.md",
    "docs/v2/parameters/defining.rst": "runtime-parameters/defining.md",
    "docs/v2/parameters/style.rst": "runtime-parameters/style.md",
    "docs/v2/parameters/use_case_cherrypicking.rst": "runtime-parameters/use-case-cherrypicking.md",
    "docs/v2/parameters/use_case_dry_run.rst": "runtime-parameters/use-case-dry-run.md",
    "docs/v2/parameters/use_case_sample_count.rst": "runtime-parameters/use-case-sample-count.md",
    "docs/v2/parameters/using_values.rst": "runtime-parameters/using-values.md",
}

REFERENCE_ABOUT_OVERRIDES: dict[str, str] = {
    "reference/instruments.md": (
        "Instrument and pipette API reference for the Opentrons Python Protocol API, including "
        "InstrumentContext methods for liquid handling, tip management, movement, and pipette-specific behavior."
    ),
    "reference/labware.md": (
        "Labware API reference covering Labware, Well, and related classes for loading and interacting "
        "with plates, reservoirs, tip racks, and other deck labware."
    ),
    "reference/wells-liquids.md": ("API reference for wells, liquids, liquid classes, and liquid handling state in Opentrons protocols."),
    "reference/types.md": "Useful types, locations, and helper classes used throughout the Opentrons Python API.",
    "reference/execute-simulate.md": (
        "Reference for executing and simulating protocols outside the Opentrons App, including "
        "command-line and programmatic simulation helpers."
    ),
    "reference/robot-motors.md": (
        "RobotContext and low-level motor control reference for advanced robot positioning outside normal pipette commands."
    ),
    "reference/absorbance-plate-reader.md": "Absorbance Plate Reader Module API reference.",
    "reference/flex-stacker.md": "Flex Stacker Module API reference.",
    "reference/heater-shaker.md": "Heater-Shaker Module API reference.",
    "reference/magnetic-block.md": "Magnetic Block API reference for Flex protocols.",
    "reference/magnetic-module.md": "Magnetic Module API reference for OT-2 protocols.",
    "reference/temperature-module.md": "Temperature Module API reference.",
    "reference/thermocycler.md": "Thermocycler Module API reference.",
}

NEW_DOCS_ABOUT_OVERRIDES: dict[str, str] = {
    "modules/concurrent.md": (
        "Documentation for concurrent module actions (API 2.27+) on Flex and OT-2, explaining how to run module "
        "operations in parallel with pipetting or with other modules to reduce protocol runtime."
    ),
    "liquid-class-tables/aqueous.md": (
        "Detailed parameter tables for the aqueous liquid class used with Flex liquid class transfer methods, "
        "covering aspirate, dispense, and multi-dispense behavior by pipette and tip size."
    ),
    "liquid-class-tables/viscous.md": (
        "Detailed parameter tables for the viscous liquid class (glycerol-based) used with Flex liquid class "
        "transfer methods, covering aspirate, dispense, and multi-dispense behavior by pipette and tip size."
    ),
    "liquid-class-tables/volatile.md": (
        "Detailed parameter tables for the volatile liquid class (ethanol-based) used with Flex liquid class "
        "transfer methods, covering aspirate, dispense, and multi-dispense behavior by pipette and tip size."
    ),
}


def legacy_rst_path_to_md_path(rst_path: str) -> str | None:
    """Convert a legacy docs/v2/*.rst path to a synced markdown relative path."""
    if rst_path in LEGACY_RST_TO_MD:
        return LEGACY_RST_TO_MD[rst_path]

    if not rst_path.startswith("docs/v2/"):
        return None

    if rst_path.endswith("conf.py"):
        return None

    if "/example_protocols/" in rst_path:
        return "examples.md"

    rel = rst_path.removeprefix("docs/v2/")
    path = Path(rel)
    md_name = path.stem.replace("_", "-") + ".md"
    if path.parent == Path("."):
        return md_name
    return str(path.parent / md_name).replace("_", "-").replace("\\", "/")


def parse_legacy_struct_entries(struct_text: str) -> dict[str, str]:
    """Parse legacy api_docs_struct_v2.25.md entries into markdown-path -> about text."""
    curated: dict[str, str] = {}
    for match in STRUCT_ENTRY_RE.finditer(struct_text):
        legacy_path = match.group("path").strip()
        about = " ".join(match.group("about").split())
        md_path = legacy_rst_path_to_md_path(legacy_path)
        if md_path is None:
            continue
        if md_path in curated:
            continue
        curated[md_path] = about
    return curated


def load_curated_about() -> dict[str, str]:
    """Load curated about descriptions keyed by synced markdown relative paths."""
    if CURATED_ABOUT_PATH.is_file():
        loaded = json.loads(CURATED_ABOUT_PATH.read_text(encoding="utf-8"))
        return {str(key): str(value) for key, value in loaded.items()}

    if LEGACY_STRUCT_PATH.is_file():
        return parse_legacy_struct_entries(LEGACY_STRUCT_PATH.read_text(encoding="utf-8"))

    return {}


def build_curated_about_from_legacy_struct() -> dict[str, str]:
    """Build curated about map from the legacy struct file plus reference overrides."""
    if not LEGACY_STRUCT_PATH.is_file():
        raise FileNotFoundError(f"Legacy struct file not found: {LEGACY_STRUCT_PATH}")

    curated = parse_legacy_struct_entries(LEGACY_STRUCT_PATH.read_text(encoding="utf-8"))
    curated.update(REFERENCE_ABOUT_OVERRIDES)
    curated.update(NEW_DOCS_ABOUT_OVERRIDES)
    return curated


def write_curated_about_file(curated: dict[str, str], output_path: Path = CURATED_ABOUT_PATH) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(curated, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def regenerate_curated_about_file(output_path: Path = CURATED_ABOUT_PATH) -> dict[str, str]:
    curated = build_curated_about_from_legacy_struct()
    write_curated_about_file(curated, output_path)
    return curated


@dataclass(frozen=True)
class CurationCoverageReport:
    """Compare synced markdown paths to committed curated about entries."""

    synced_paths: frozenset[str]
    curated_paths: frozenset[str]

    @property
    def missing_curation(self) -> tuple[str, ...]:
        """Synced docs with no entry in api_docs_struct_about.json."""
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
        lines.append("Add entries to api_docs_struct_about.json (see docs/API_DOCS_CURATION.md).")
    if report.orphan_curation:
        lines.append("Curated entries with no matching synced doc:")
        lines.extend(f"  - {path}" for path in report.orphan_curation)
        lines.append("Remove stale keys or add LEGACY_RST_TO_MD mapping if the page was renamed.")
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
    parser = argparse.ArgumentParser(description="Manage curated API doc <about> descriptions.")
    parser.add_argument(
        "--check",
        action="store_true",
        help="Exit non-zero if synced docs and api_docs_struct_about.json are out of sync.",
    )
    parser.add_argument(
        "--docs-root",
        type=Path,
        default=DOCS_V2_DIR,
        help="Synced markdown root (default: api/storage/api_docs/docs/v2).",
    )
    args = parser.parse_args(argv)

    if args.check:
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

    curated = regenerate_curated_about_file()
    print(f"Wrote {len(curated)} curated about entries to {CURATED_ABOUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
