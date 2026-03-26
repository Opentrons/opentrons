"""Rewrite package.json files for a unified npmjs release."""

from __future__ import annotations

import json
from pathlib import Path

from publish_core import PACKAGE_REL_DIRS, PACKAGES, prior_packages


def package_json_path(repo_root: Path, package_name: str) -> Path:
    """Path to package.json for a scoped npm package name."""
    relative = PACKAGE_REL_DIRS[package_name]
    return repo_root / relative / "package.json"


def apply_release_versions(repo_root: Path, version: str) -> None:
    """Set version and pin prior @opentrons/* deps to the release version (exact semver).

    Matches CI intent: replace link: workspace refs with the release version for packages
    that depend on earlier packages in PACKAGES order.
    """
    for package_name in PACKAGES:
        path = package_json_path(repo_root, package_name)
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload["version"] = version
        dependencies = payload.get("dependencies")
        if isinstance(dependencies, dict):
            for prior in prior_packages(package_name):
                if prior in dependencies:
                    dependencies[prior] = version
            payload["dependencies"] = dependencies
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
