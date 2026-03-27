"""Tests for build_packages CLI."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import patch

import build_packages
from publish_core import PACKAGE_REL_DIRS, PACKAGES, prior_packages
from typer.testing import CliRunner


def _minimal_repo(tmp_path: Path) -> Path:
    """Create a tiny monorepo layout so apply_release_versions can run."""
    for name in PACKAGES:
        pkg_dir = tmp_path / PACKAGE_REL_DIRS[name]
        pkg_dir.mkdir(parents=True)
        deps: dict[str, str] = dict.fromkeys(prior_packages(name), "link:../x")
        payload = {"name": name, "version": "0.0.0-dev", "dependencies": deps}
        (pkg_dir / "package.json").write_text(json.dumps(payload) + "\n", encoding="utf-8")
    return tmp_path


def test_build_packages_no_version_runs_build_only(tmp_path: Path) -> None:
    """Without --version only _run_build runs; manifests are not rewritten."""
    runner = CliRunner()
    with patch.object(build_packages, "_run_build") as mock_build:
        with patch.object(build_packages, "apply_release_versions") as mock_apply:
            result = runner.invoke(
                build_packages.app,
                ["--repo-root", str(tmp_path)],
            )
    assert result.exit_code == 0, result.stdout + result.stderr
    mock_build.assert_called_once_with(tmp_path)
    mock_apply.assert_not_called()


def test_build_packages_skip_build_requires_version(tmp_path: Path) -> None:
    """--skip-build without --version is an error."""
    runner = CliRunner()
    result = runner.invoke(
        build_packages.app,
        ["--skip-build", "--repo-root", str(tmp_path)],
    )
    assert result.exit_code != 0


def test_build_packages_skip_build_rewrites_manifests(tmp_path: Path) -> None:
    """--skip-build runs manifest rewrite only (no make)."""
    runner = CliRunner()
    root = _minimal_repo(tmp_path)
    result = runner.invoke(
        build_packages.app,
        [
            "--version",
            "3.4.5",
            "--repo-root",
            str(root),
            "--skip-build",
        ],
    )
    assert result.exit_code == 0, result.stdout + result.stderr
    for name in PACKAGES:
        data = json.loads((root / PACKAGE_REL_DIRS[name] / "package.json").read_text(encoding="utf-8"))
        assert data["version"] == "3.4.5"
