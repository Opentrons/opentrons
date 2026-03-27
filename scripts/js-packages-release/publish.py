"""Validate synchronized JS package release versions against GitHub Packages."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

from publish_core import DEFAULT_NPM_REGISTRY, PACKAGES, parse_semver, resolve_version_input

# Tests import these names from publish.
_resolve_version_input = resolve_version_input
_parse_semver = parse_semver


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


def _latest_semver(versions: list[str]) -> str | None:
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


def _load_package_versions() -> dict[str, list[str]]:
    """Load all package versions or raise a readable error."""
    return {package_name: _fetch_published_versions(package_name) for package_name in PACKAGES}


def _print_preflight_summary(version: str, package_versions: dict[str, list[str]]) -> None:
    """Print a readable preflight summary."""
    print(f"Requested version: {version}")
    print(f"Registry: {_npm_registry()}")
    for package_name in PACKAGES:
        versions = package_versions[package_name]
        latest = _latest_semver(versions) or "none"
        target_exists = "yes" if version in versions else "no"
        print(f"{package_name}: latest={latest} target_exists={target_exists}")


def _print_current_versions(package_versions: dict[str, list[str]]) -> None:
    """Print a simple registry snapshot for local inspection."""
    print(f"Registry: {_npm_registry()}")
    for package_name in PACKAGES:
        versions = package_versions[package_name]
        latest = _latest_semver(versions) or "none"
        print(f"{package_name}: latest={latest} published_count={len(versions)}")


def _build_parser() -> argparse.ArgumentParser:
    """Create the CLI parser."""
    parser = argparse.ArgumentParser(description="Validate synchronized JS package release versions.")
    parser.add_argument("--version", help="Release version, tag ref, or js-packages-release@<semver>.")
    parser.add_argument(
        "--current",
        action="store_true",
        help="Print current published versions from the configured registry and exit.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the preflight CLI."""
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.current and args.version is not None:
        parser.error("--current cannot be combined with --version.")
    if not args.current and args.version is None:
        parser.error("either --version or --current is required.")

    try:
        package_versions = _load_package_versions()
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return 1

    if args.current:
        _print_current_versions(package_versions)
        return 0

    try:
        resolved_version = resolve_version_input(args.version)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    _print_preflight_summary(resolved_version, package_versions)

    issues = _check_target_version(resolved_version, package_versions)
    if issues:
        for issue in issues:
            print(issue, file=sys.stderr)
        return 1

    print("Preflight checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
