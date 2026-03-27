"""Build monorepo JS packages and apply release versions to package.json (CI-parity)."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Annotated, Optional

import typer
from github_summary import append_job_summary
from manifests import apply_release_versions
from publish_core import PACKAGES, resolve_version_input
from rich.console import Console

app = typer.Typer(no_args_is_help=True)
console = Console()

# Make invocations in publish order (keep in sync with _run_build).
_BUILD_COMMANDS: tuple[tuple[str, ...], ...] = (
    ("make", "build-ts"),
    ("make", "-C", "shared-data", "lib-js"),
    ("make", "-C", "step-generation", "lib"),
    ("make", "-C", "components", "build-ts"),
    ("make", "-C", "components", "lib"),
    ("make", "-C", "protocol-visualization", "build-ts"),
    ("make", "-C", "protocol-visualization", "lib"),
)


def _default_repo_root() -> Path:
    """Repository root (parent of scripts/)."""
    return Path(__file__).resolve().parent.parent.parent


def _run(cmd: list[str], *, cwd: Path, env: Optional[dict[str, str]] = None) -> None:
    """Run a command and fail with a clear message on non-zero exit."""
    merged_env = {**os.environ, **(env or {})}
    console.print(f"[blue]$[/blue] {' '.join(cmd)} [dim](cwd={cwd})[/dim]")
    result = subprocess.run(cmd, cwd=cwd, env=merged_env, check=False)
    if result.returncode != 0:
        raise typer.Exit(code=result.returncode)


def _run_build(repo_root: Path) -> None:
    """Build targets in publish order: shared-data, step-generation, components, protocol-visualization."""
    for cmd_tuple in _BUILD_COMMANDS:
        _run(list(cmd_tuple), cwd=repo_root)


def _build_job_summary_markdown(
    *,
    root: Path,
    ran_build: bool,
    version_raw: Optional[str],
    resolved_version: Optional[str],
    skip_build: bool,
) -> str:
    """Markdown for GITHUB_STEP_SUMMARY (and console)."""
    if skip_build and resolved_version is not None:
        mode = "Manifests only (`--skip-build`)"
    elif resolved_version is not None:
        mode = "Build + release manifests"
    else:
        mode = "Build only (no `package.json` release rewrite)"

    lines = [
        "## js-packages-release build",
        "",
        f"- **Repo root:** `{root}`",
        f"- **Mode:** {mode}",
    ]
    if version_raw is not None:
        lines.append(f"- **Version input:** `{version_raw}`")
    if resolved_version is not None:
        lines.append(f"- **Resolved version:** `{resolved_version}`")

    lines.extend(["", "### Build steps"])
    if ran_build:
        for cmd in _BUILD_COMMANDS:
            lines.append(f"- `{' '.join(cmd)}`")
    else:
        lines.append("- *(skipped, `--skip-build`)*")

    if resolved_version is not None:
        lines.extend(["", "### `package.json` targets"])
        for pkg in PACKAGES:
            lines.append(f"- `{pkg}`")

    status = "success"
    lines.extend(["", "### Result", f"- **Status:** {status}"])

    return "\n".join(lines)


@app.command()
def run(
    version: Annotated[
        Optional[str],
        typer.Option("--version", "-v", help="Release version, tag ref, or js-packages-release@... (omit for build only)"),
    ] = None,
    repo_root: Annotated[
        Optional[Path],
        typer.Option("--repo-root", help="Monorepo root (default: infer from script location)"),
    ] = None,
    skip_build: Annotated[bool, typer.Option("--skip-build", help="Only rewrite package.json files, do not run make")] = False,
    write_summary: Annotated[
        bool,
        typer.Option("--write-summary/--no-write-summary", help="Append markdown to GITHUB_STEP_SUMMARY if set"),
    ] = True,
) -> None:
    """Run production builds. With --version, also set version and internal @opentrons/* pins like CI."""
    root = repo_root or _default_repo_root()

    if skip_build and not version:
        console.print("--skip-build requires --version.", style="red")
        raise typer.Exit(code=1)

    ran_build = not skip_build
    if ran_build:
        _run_build(root)

    if version is None:
        markdown = _build_job_summary_markdown(
            root=root,
            ran_build=ran_build,
            version_raw=None,
            resolved_version=None,
            skip_build=skip_build,
        )
        console.print(markdown, style="blue")
        if write_summary:
            append_job_summary(markdown)
        console.print(f"Build finished under {root} (no package.json release rewrite).", style="green bold")
        return

    try:
        resolved = resolve_version_input(version)
    except ValueError as error:
        console.print(str(error), style="red")
        raise typer.Exit(code=1) from error

    apply_release_versions(root, resolved)
    markdown = _build_job_summary_markdown(
        root=root,
        ran_build=ran_build,
        version_raw=version,
        resolved_version=resolved,
        skip_build=skip_build,
    )
    console.print(markdown, style="blue")
    if write_summary:
        append_job_summary(markdown)
    console.print(f"Applied release version [green]{resolved}[/green] under {root}", style="green bold")


if __name__ == "__main__":
    app()
