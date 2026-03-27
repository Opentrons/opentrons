"""Build monorepo JS packages and apply release versions to package.json."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

from manifests import apply_release_versions
from publish_core import PACKAGES, resolve_version_input

# Build in release order, because these packages are not independent:
# later packages consume earlier ones and the release process pins them to the
# same version as a synchronized set. Keep this in dependency/release order.
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


def _run(cmd: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> None:
    """Run a command and fail with a clear message on non-zero exit."""
    merged_env = {**os.environ, **(env or {})}
    print(f"$ {' '.join(cmd)} (cwd={cwd})")
    result = subprocess.run(cmd, cwd=cwd, env=merged_env, check=False)
    if result.returncode != 0:
        raise subprocess.CalledProcessError(result.returncode, cmd)


def _run_build(repo_root: Path) -> None:
    """Build targets in publish order: shared-data, step-generation, components, protocol-visualization."""
    for cmd_tuple in _BUILD_COMMANDS:
        _run(list(cmd_tuple), cwd=repo_root)


def _print_build_summary(
    *,
    root: Path,
    ran_build: bool,
    version_raw: str | None,
    resolved_version: str | None,
    skip_build: bool,
) -> None:
    """Print a readable build summary."""
    if skip_build and resolved_version is not None:
        mode = "Manifests only (`--skip-build`)"
    elif resolved_version is not None:
        mode = "Build + release manifests"
    else:
        mode = "Build only (no `package.json` release rewrite)"

    print(f"Repo root: {root}")
    print(f"Mode: {mode}")
    if version_raw is not None:
        print(f"Version input: {version_raw}")
    if resolved_version is not None:
        print(f"Resolved version: {resolved_version}")

    print("Build steps:")
    if ran_build:
        for cmd in _BUILD_COMMANDS:
            print(f"- {' '.join(cmd)}")
    else:
        print("- skipped (`--skip-build`)")

    if resolved_version is not None:
        print("package.json targets:")
        for pkg in PACKAGES:
            print(f"- {pkg}")

    print("Status: success")


def _build_parser() -> argparse.ArgumentParser:
    """Create the CLI parser."""
    parser = argparse.ArgumentParser(description="Run synchronized JS package builds and manifest rewrites.")
    parser.add_argument("--version", "-v", help="Release version, tag ref, or js-packages-release@<semver>.")
    parser.add_argument("--repo-root", type=Path, help="Monorepo root (default: infer from script location).")
    parser.add_argument("--skip-build", action="store_true", help="Only rewrite package.json files, do not run make.")
    return parser


def main(argv: list[str] | None = None) -> int:
    """Run the build/manifests CLI."""
    args = _build_parser().parse_args(argv)
    root = args.repo_root or _default_repo_root()

    if args.skip_build and not args.version:
        print("--skip-build requires --version.", file=sys.stderr)
        return 1

    ran_build = not args.skip_build
    try:
        if ran_build:
            _run_build(root)
    except subprocess.CalledProcessError as error:
        return error.returncode

    resolved_version: str | None = None
    if args.version is not None:
        try:
            resolved_version = resolve_version_input(args.version)
        except ValueError as error:
            print(str(error), file=sys.stderr)
            return 1
        apply_release_versions(root, resolved_version)

    _print_build_summary(
        root=root,
        ran_build=ran_build,
        version_raw=args.version,
        resolved_version=resolved_version,
        skip_build=args.skip_build,
    )

    if resolved_version is None:
        print(f"Build finished under {root} (no package.json release rewrite).")
    else:
        print(f"Applied release version {resolved_version} under {root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
