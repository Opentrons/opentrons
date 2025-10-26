"""Utility helpers for GitHub Actions workflows.

This module centralizes small bits of branching logic so that multiple
workflows can share the same behavior. Each sub-command writes outputs back to
GitHub Actions, prints a nicely formatted table via rich, and appends a concise
summary block.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Dict, Iterable, Sequence, Tuple

_RICH_CONSOLE = None
_RICH_TABLE = None


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
        for key, value in rows:
            handle.write(f"- {key}: `{value}`\n")
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

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
