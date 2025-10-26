"""Utility helpers for GitHub Actions workflows.

This module centralizes small bits of branching logic so that multiple
workflows can share the same behavior. Each sub-command writes outputs back to
GitHub Actions, prints a nicely formatted table via rich, and appends a concise
summary block.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Mapping, Sequence, Tuple

_RICH_CONSOLE = None
_RICH_TABLE = None

_DEPENDENCY_DIR_EXCLUDES = {".git", "node_modules", ".venv", "__pycache__", ".mypy_cache", ".pytest_cache"}
_PYTHON_DEP_FILES = ("Pipfile", "Pipfile.lock")
_JS_DEP_FILES = ("package.json", "package-lock.json", "yarn.lock")


def _ensure_rich() -> None:
    """Ensure rich is available and cache useful symbols."""

    global _RICH_CONSOLE, _RICH_TABLE
    if _RICH_CONSOLE is not None and _RICH_TABLE is not None:
        return

    try:
        from rich.console import Console  # type: ignore
        from rich.table import Table  # type: ignore
    except ImportError as exc:  # pragma: no cover - environment misconfiguration
        raise RuntimeError(
            "The 'rich' package is required. Run 'make -C ci-docker setup' to "
            "synchronize the uv environment before invoking this helper."
        ) from exc

    _RICH_CONSOLE = Console()
    _RICH_TABLE = Table


def _print_table(title: str, rows: Sequence[Tuple[str, str]]) -> None:
    _ensure_rich()
    assert _RICH_CONSOLE is not None and _RICH_TABLE is not None

    table = _RICH_TABLE(title=title, show_header=True, header_style="bold")
    table.add_column("Key", style="cyan")
    table.add_column("Value", style="magenta")
    for key, value in rows:
        table.add_row(key, value)

    _RICH_CONSOLE.print(table)


def _append_summary(title: str, rows: Sequence[Tuple[str, str]], notes: Iterable[str] | None) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return

    with open(summary_path, "a", encoding="utf-8") as handle:
        handle.write(f"## {title}\n\n")
        handle.write("| Key | Value |\n")
        handle.write("| --- | ----- |\n")
        for key, value in rows:
            handle.write(f"| {key} | `{value}` |\n")
        if notes:
            handle.write("\n")
            for note in notes:
                handle.write(f"{note}\n")
        handle.write("\n")


def _write_outputs(outputs: Dict[str, str]) -> None:
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return

    with open(output_path, "a", encoding="utf-8") as handle:
        for key, value in outputs.items():
            handle.write(f"{key}={value}\n")


def _should_skip(path: Path, root: Path) -> bool:
    rel = path.relative_to(root)
    return any(part in _DEPENDENCY_DIR_EXCLUDES for part in rel.parts)


def _collect_dependency_files(root: Path, patterns: Sequence[str]) -> List[Path]:
    files: List[Path] = []
    seen = set()
    for pattern in patterns:
        for candidate in root.rglob(pattern):
            if not candidate.is_file():
                continue
            if _should_skip(candidate, root):
                continue
            rel = candidate.relative_to(root)
            key = rel.as_posix()
            if key in seen:
                continue
            seen.add(key)
            files.append(candidate)
    files.sort(key=lambda path_: path_.relative_to(root).as_posix())
    return files


def _hash_files(root: Path, files: Sequence[Path]) -> str:
    digest = hashlib.sha256()
    for file in files:
        rel = file.relative_to(root).as_posix().encode("utf-8")
        digest.update(rel)
        with open(file, "rb") as handle:
            for chunk in iter(lambda: handle.read(65536), b""):
                digest.update(chunk)
    return digest.hexdigest()


def _compute_dependency_checksums(root: Path) -> Dict[str, Dict[str, object]]:
    python_files = _collect_dependency_files(root, _PYTHON_DEP_FILES)
    js_files = _collect_dependency_files(root, _JS_DEP_FILES)
    return {
        "python": {
            "checksum": _hash_files(root, python_files),
            "files": [file.relative_to(root).as_posix() for file in python_files],
        },
        "javascript": {
            "checksum": _hash_files(root, js_files),
            "files": [file.relative_to(root).as_posix() for file in js_files],
        },
    }


@dataclass
class SourceRefResult:
    ref: str
    ref_name: str
    reason: str


def determine_source_ref(ref: str | None, default_branch: str) -> SourceRefResult:
    """Determine the Git ref to use for building the container."""

    ref = (ref or "").strip()
    if not ref or ref == "refs/heads/":
        computed_ref = f"refs/heads/{default_branch}"
        reason = f"Input ref empty; defaulting to {default_branch}"
    else:
        computed_ref = ref
        reason = f"Using event ref {ref}"

    if computed_ref.startswith("refs/heads/"):
        ref_name = computed_ref.split("/", 2)[-1]
    else:
        ref_name = computed_ref

    return SourceRefResult(ref=computed_ref, ref_name=ref_name, reason=reason)


@dataclass
class ContainerTagResult:
    tag: str
    reason: str


def determine_container_tag(
    *,
    event_name: str,
    base_ref: str | None,
    ref_name: str | None,
    default_tag: str,
    release_prefix: str,
) -> ContainerTagResult:
    """Select the container tag to use for downstream jobs."""

    event_name = (event_name or "").strip()
    base_ref = (base_ref or "").strip()
    ref_name = (ref_name or "").strip()

    tag = default_tag
    reason = f"Defaulting to {default_tag}"

    def _sanitise(branch: str) -> str:
        return branch.replace("/", "-")

    if event_name == "pull_request" and base_ref.startswith(release_prefix):
        sanitized = _sanitise(base_ref)
        tag = f"branch-{sanitized}"
        reason = f"Base ref {base_ref} matches release prefix"
    elif event_name != "pull_request" and ref_name.startswith(release_prefix):
        sanitized = _sanitise(ref_name)
        tag = f"branch-{sanitized}"
        reason = f"Branch {ref_name} matches release prefix"

    return ContainerTagResult(tag=tag, reason=reason)


def _run_determine_source_ref(args: argparse.Namespace) -> None:
    result = determine_source_ref(args.ref, args.default_branch)
    rows = [("Full ref", result.ref), ("Ref name", result.ref_name), ("Reason", result.reason)]
    _print_table(args.title, rows)
    _append_summary(args.title, rows, notes=None)
    _write_outputs({"ref": result.ref, "ref_name": result.ref_name})


def _run_determine_container_tag(args: argparse.Namespace) -> None:
    result = determine_container_tag(
        event_name=args.event_name,
        base_ref=args.base_ref,
        ref_name=args.ref_name,
        default_tag=args.default_tag,
        release_prefix=args.release_prefix,
    )
    rows = [("Tag", result.tag), ("Reason", result.reason)]
    _print_table(args.title, rows)
    _append_summary(args.title, rows, notes=None)
    _write_outputs({"tag": result.tag})


def _load_baseline(path: Path) -> Mapping[str, Dict[str, object]] | None:
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _run_dependency_checksums(args: argparse.Namespace) -> None:
    root = Path(args.root).resolve()
    data = _compute_dependency_checksums(root)

    python_checksum = str(data["python"]["checksum"])
    javascript_checksum = str(data["javascript"]["checksum"])
    rows = [
        ("Python checksum", python_checksum),
        ("JavaScript checksum", javascript_checksum),
    ]
    notes: List[str] = []
    outputs: Dict[str, str] = {
        "python_checksum": python_checksum,
        "javascript_checksum": javascript_checksum,
        "python_changed": "false",
        "javascript_changed": "false",
        "dependencies_changed": "false",
    }

    baseline_path = Path(args.baseline).resolve() if args.baseline else None
    python_changed = False
    javascript_changed = False

    if baseline_path:
        baseline = _load_baseline(baseline_path)
        if baseline is None:
            notes.append(f"- Baseline file `{baseline_path}` not found; treating dependencies as changed")
            python_changed = True
            javascript_changed = True
        else:
            baseline_python = str(baseline.get("python", {}).get("checksum", ""))
            baseline_js = str(baseline.get("javascript", {}).get("checksum", ""))
            python_changed = baseline_python != data["python"]["checksum"]
            javascript_changed = baseline_js != data["javascript"]["checksum"]

            if python_changed:
                notes.append("- Python dependency manifest checksum differs from baseline")
            if javascript_changed:
                notes.append("- JavaScript dependency manifest checksum differs from baseline")

    outputs["python_changed"] = "true" if python_changed else "false"
    outputs["javascript_changed"] = "true" if javascript_changed else "false"
    outputs["dependencies_changed"] = "true" if (python_changed or javascript_changed) else "false"

    if args.output:
        output_path = Path(args.output).resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, sort_keys=True)
            handle.write("\n")

    _print_table(args.title, rows)
    summary_notes = notes if notes else None
    _append_summary(args.title, rows, notes=summary_notes)
    _write_outputs(outputs)

    if args.fail_on_change and (python_changed or javascript_changed):
        raise SystemExit(1)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Shared helpers for CI Docker workflows")
    subparsers = parser.add_subparsers(dest="command", required=True)

    source_parser = subparsers.add_parser("determine-source-ref", help="Compute the Git ref to use")
    source_parser.add_argument("--ref", help="The event-derived ref (e.g. refs/heads/edge)")
    source_parser.add_argument(
        "--default-branch",
        required=True,
        help="Repository default branch used when the event ref is missing",
    )
    source_parser.add_argument("--title", default="CI Docker Source Ref", help="Heading used for summary output")
    source_parser.set_defaults(func=_run_determine_source_ref)

    tag_parser = subparsers.add_parser("determine-container-tag", help="Compute the container tag to use")
    tag_parser.add_argument("--event-name", required=True, help="GitHub event name (push, pull_request, etc.)")
    tag_parser.add_argument("--base-ref", help="Base ref for pull requests")
    tag_parser.add_argument("--ref-name", help="Branch or tag name for push events")
    tag_parser.add_argument("--default-tag", default="edge", help="Fallback image tag when no overrides match")
    tag_parser.add_argument(
        "--release-prefix",
        default="chore_release",
        help="Branch prefix that should use a branch-specific image",
    )
    tag_parser.add_argument("--title", default="CI Docker Container Tag", help="Heading used for summary output")
    tag_parser.set_defaults(func=_run_determine_container_tag)

    deps_parser = subparsers.add_parser("dependency-checksums", help="Compute dependency manifest checksums")
    deps_parser.add_argument("--root", default=".", help="Repository root to scan")
    deps_parser.add_argument("--output", help="Optional path to write checksums as JSON")
    deps_parser.add_argument("--baseline", help="Baseline JSON file to compare against")
    deps_parser.add_argument(
        "--fail-on-change",
        action="store_true",
        help="Exit with a non-zero status when checksums differ from baseline",
    )
    deps_parser.add_argument("--title", default="CI Dependency Checksums", help="Heading used for summary output")
    deps_parser.set_defaults(func=_run_dependency_checksums)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
