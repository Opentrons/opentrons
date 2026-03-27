"""JS packages release preflight CLI."""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass
from typing import Optional

import typer
from github_summary import append_job_summary
from publish_core import DEFAULT_NPM_REGISTRY, PACKAGES, parse_semver, resolve_version_input
from rich.console import Console
from rich.prompt import Confirm, Prompt
from rich.table import Table

# Tests import these names from publish.
_resolve_version_input = resolve_version_input
_parse_semver = parse_semver

app = typer.Typer(no_args_is_help=True)
console = Console()


@dataclass(frozen=True)
class ReleaseContext:
    """Computed release values for one run."""

    version: str
    interactive: bool


def _resolve_context(version: Optional[str], interactive: bool) -> ReleaseContext:
    """Resolve the release version from args or prompt."""
    requested_version = version
    if requested_version is None and interactive:
        requested_version = Prompt.ask("Release version (semver)")

    if requested_version is None:
        raise ValueError("Missing release version. Provide --version or run with --interactive.")

    return ReleaseContext(version=resolve_version_input(requested_version), interactive=interactive)


def _npm_registry() -> str:
    """Resolve the npm-compatible registry used for preflight lookups."""
    return os.environ.get("OT_NPM_REGISTRY", DEFAULT_NPM_REGISTRY)


def _fetch_published_versions(package_name: str) -> list[str]:
    """Fetch published versions for a package from the configured registry."""
    registry = _npm_registry()
    result = subprocess.run(
        ["npm", "view", package_name, "versions", "--json", "--registry", registry],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        stderr = result.stderr.strip()
        # New packages can return E404 until first publish.
        if "E404" in stderr or "is not in this registry" in stderr:
            return []
        raise RuntimeError(f"Failed reading versions for {package_name} from {registry}: {stderr}")

    output = result.stdout.strip()
    if output == "":
        return []

    parsed = json.loads(output)
    if isinstance(parsed, list):
        return [str(version) for version in parsed]
    if isinstance(parsed, str):
        return [parsed]
    raise RuntimeError(f"Unexpected npm response for {package_name}: {parsed!r}")


def _latest_semver(versions: list[str]) -> Optional[str]:
    """Return latest semver from npm version list."""
    parsed_versions = []
    for version in versions:
        try:
            parsed_versions.append(parse_semver(version))
        except ValueError:
            continue
    if not parsed_versions:
        return None
    return str(max(parsed_versions))


def _check_target_version(version: str, package_versions: dict[str, list[str]]) -> list[str]:
    """Validate requested version against package history."""
    issues = []
    target = parse_semver(version)
    already_published: set[str] = set()

    for package_name, versions in package_versions.items():
        if version in versions:
            already_published.add(package_name)

        latest = _latest_semver(versions)
        if latest is None or version in versions:
            continue
        if target <= parse_semver(latest):
            issues.append(f"{package_name} latest is {latest}. Target {version} must be greater than the latest published version.")

    if already_published and len(already_published) == len(PACKAGES):
        issues.append(f"Target {version} is already published for all packages. npm does not allow overwriting an existing version.")
    elif already_published:
        published_packages = ", ".join(sorted(already_published))
        issues.append(f"Partial publish detected for {version}: already published for {published_packages}, but not all packages.")

    return issues


def _summary_markdown(context: ReleaseContext, package_versions: dict[str, list[str]]) -> str:
    """Render markdown summary for GitHub job summary output."""
    interaction_text = "interactive" if context.interactive else "non-interactive"
    package_lines = []
    for package_name in PACKAGES:
        versions = package_versions[package_name]
        latest = _latest_semver(versions) or "none"
        target_exists = "yes" if context.version in versions else "no"
        package_lines.append(f"- `{package_name}`: latest=`{latest}`, target_exists=`{target_exists}`")

    return "\n".join(
        [
            "## js-packages-release preflight",
            "",
            f"- Requested version: `{context.version}`",
            f"- Interaction: `{interaction_text}`",
            f"- Registry: `{_npm_registry()}`",
            "",
            "### Package registry state",
            *package_lines,
        ]
    )


def _print_registry_snapshot(package_versions: dict[str, list[str]]) -> None:
    """Print a readable registry snapshot before interactive prompts."""
    table = Table(title=f"Current package versions ({_npm_registry()})")
    table.add_column("Package", style="cyan")
    table.add_column("Latest", style="green")
    table.add_column("Published count", justify="right")
    for package_name in PACKAGES:
        versions = package_versions[package_name]
        latest = _latest_semver(versions) or "none"
        table.add_row(package_name, latest, str(len(versions)))
    console.print(table)


def _load_package_versions_or_exit() -> dict[str, list[str]]:
    """Load all package versions and exit on lookup errors."""
    try:
        return {package_name: _fetch_published_versions(package_name) for package_name in PACKAGES}
    except RuntimeError as error:
        console.print(str(error), style="red")
        raise typer.Exit(code=1) from error


def _resolve_context_or_exit(version: Optional[str], interactive: bool) -> ReleaseContext:
    """Resolve context and exit with readable errors."""
    try:
        return _resolve_context(version=version, interactive=interactive)
    except ValueError as error:
        console.print(str(error), style="red")
        raise typer.Exit(code=1) from error


@app.command()
def run(
    version: Optional[str] = typer.Option(None, help="Release semver value, for example 1.2.3."),
    interactive: bool = typer.Option(True, "--interactive/--non-interactive", help="Enable or disable prompts."),
    write_summary: bool = typer.Option(
        True,
        "--write-summary/--no-write-summary",
        help="Write markdown output to GITHUB_STEP_SUMMARY if available.",
    ),
) -> None:
    """Validate the requested release version against package registry state."""
    package_versions: Optional[dict[str, list[str]]] = None

    if interactive and version is None:
        package_versions = _load_package_versions_or_exit()
        _print_registry_snapshot(package_versions)

    context = _resolve_context_or_exit(version=version, interactive=interactive)

    if context.interactive:
        proceed = Confirm.ask("Proceed with js-packages-release preflight?", default=True)
        if not proceed:
            console.print("Cancelled by user.", style="yellow")
            raise typer.Exit(code=0)

    if package_versions is None:
        package_versions = _load_package_versions_or_exit()

    issues = _check_target_version(version=context.version, package_versions=package_versions)
    markdown = _summary_markdown(context=context, package_versions=package_versions)
    console.print(markdown, style="blue")

    if write_summary:
        append_job_summary(markdown)

    if issues:
        for issue in issues:
            console.print(issue, style="red")
        raise typer.Exit(code=1)

    console.print("Preflight checks passed.", style="green bold")


if __name__ == "__main__":
    app()
