"""Tests for package.json release manifest rewriting."""

from __future__ import annotations

import json
from pathlib import Path

from manifests import apply_release_versions, package_json_path
from publish_core import PACKAGE_REL_DIRS, PACKAGES, prior_packages


def test_prior_packages_matches_publish_order() -> None:
    """Earlier PACKAGES entries are the only pins for a given package."""
    assert prior_packages("@opentrons/shared-data") == ()
    assert prior_packages("@opentrons/step-generation") == ("@opentrons/shared-data",)
    assert prior_packages("@opentrons/components") == (
        "@opentrons/shared-data",
        "@opentrons/step-generation",
    )
    assert prior_packages("@opentrons/protocol-visualization") == (
        "@opentrons/shared-data",
        "@opentrons/step-generation",
        "@opentrons/components",
    )


def test_apply_release_versions_updates_version_and_pins(tmp_path: Path) -> None:
    """Sets version and pins internal deps; leaves unrelated deps unchanged."""
    root = tmp_path
    for name in PACKAGES:
        pkg_dir = root / PACKAGE_REL_DIRS[name]
        pkg_dir.mkdir(parents=True)
        deps: dict[str, str] = {}
        for prior in prior_packages(name):
            deps[prior] = "link:../dummy"
        deps["lodash"] = "4.17.21"
        (pkg_dir / "package.json").write_text(
            json.dumps({"name": name, "version": "0.0.0-dev", "dependencies": deps}, indent=2) + "\n",
            encoding="utf-8",
        )

    apply_release_versions(root, "9.8.7")

    for name in PACKAGES:
        path = package_json_path(root, name)
        data = json.loads(path.read_text(encoding="utf-8"))
        assert data["version"] == "9.8.7"
        for prior in prior_packages(name):
            assert data["dependencies"][prior] == "9.8.7"
        assert data["dependencies"]["lodash"] == "4.17.21"


def test_apply_release_versions_skips_missing_dependencies_key(tmp_path: Path) -> None:
    """Packages without a dependencies object still get version bumps."""
    root = tmp_path
    for name in PACKAGES:
        d = root / PACKAGE_REL_DIRS[name]
        d.mkdir(parents=True)
        payload = {"name": name, "version": "0.0.0-dev"}
        (d / "package.json").write_text(json.dumps(payload) + "\n", encoding="utf-8")

    apply_release_versions(root, "1.0.0")
    for name in PACKAGES:
        data = json.loads(package_json_path(root, name).read_text(encoding="utf-8"))
        assert data["version"] == "1.0.0"
