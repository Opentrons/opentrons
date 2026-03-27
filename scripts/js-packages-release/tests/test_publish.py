"""Tests for js-packages-release preflight helpers."""

from types import SimpleNamespace

import publish
import pytest
from publish import _check_target_version, _resolve_context, _resolve_version_input


def test_resolve_context_with_explicit_version() -> None:
    """Resolves a direct semver value in non-interactive mode."""
    version_argument = "2.3.4"
    context = _resolve_context(version=version_argument, interactive=False)
    assert context.version == version_argument
    assert context.interactive is False


@pytest.mark.parametrize(
    ("version_input", "expected"),
    [
        ("1.2.3", "1.2.3"),
        ("js-packages-release@1.2.3", "1.2.3"),
        ("refs/tags/js-packages-release@1.2.3", "1.2.3"),
        (" refs/tags/js-packages-release@2.0.0 ", "2.0.0"),
        ("js-packages-release@1.2.3-alpha.1", "1.2.3-alpha.1"),
        ("refs/tags/js-packages-release@2.0.0-beta.2", "2.0.0-beta.2"),
    ],
)
def test_resolve_version_input_success(version_input: str, expected: str) -> None:
    """Accepts plain semver and supported js-packages-release tag formats."""
    assert _resolve_version_input(version_input) == expected


@pytest.mark.parametrize(
    ("version_input", "error_match"),
    [
        ("refs/tags/js-packages-release@abc", "Invalid semver version"),
        ("refs/tags/js-packages-release@1.2.3-beta.", "Invalid semver version"),
        ("refs/tags/js-packages-release@1.2.3-beta..2", "Invalid semver version"),
        ("refs/tags/js-packages-release@1.2.3-alpha.1.3.", "Invalid semver version"),
        ("refs/tags/components@1.2.3", "Invalid tag prefix"),
        ("refs/tags/components@1.2.3-alpha.1", "Invalid tag prefix"),
        ("components@1.2.3", "Invalid tag prefix"),
        ("shared-data@2.0.0-beta.2", "Invalid tag prefix"),
        ("refs/tags/not-js-packages@2.0.0", "Invalid tag prefix"),
    ],
)
def test_resolve_version_input_errors(version_input: str, error_match: str) -> None:
    """Rejects malformed semver values and wrong tag prefixes."""
    with pytest.raises(ValueError, match=error_match):
        _resolve_version_input(version_input)


def test_resolve_context_rejects_missing_non_interactive_version() -> None:
    """Requires an explicit version when interactive mode is disabled."""
    version_argument = None
    with pytest.raises(ValueError):
        _resolve_context(version=version_argument, interactive=False)


def test_fetch_published_versions_uses_github_packages_registry(monkeypatch: pytest.MonkeyPatch) -> None:
    """Queries the configured npm-compatible registry."""
    seen: dict[str, object] = {}

    def _fake_run(cmd: list[str], capture_output: bool, text: bool, check: bool) -> SimpleNamespace:
        seen["cmd"] = cmd
        seen["capture_output"] = capture_output
        seen["text"] = text
        seen["check"] = check
        return SimpleNamespace(returncode=0, stdout="[]", stderr="")

    monkeypatch.setattr(publish.subprocess, "run", _fake_run)

    assert publish._fetch_published_versions("@opentrons/shared-data") == []
    assert seen["cmd"] == [
        "npm",
        "view",
        "@opentrons/shared-data",
        "versions",
        "--json",
        "--registry",
        "https://npm.pkg.github.com",
    ]


def test_check_target_version_allows_new_packages() -> None:
    """Allows a new version when existing packages are strictly behind."""
    version_argument = "1.1.0"
    package_versions = {
        "@opentrons/shared-data": ["1.0.0"],
        "@opentrons/step-generation": [],
        "@opentrons/components": ["1.0.0"],
        "@opentrons/protocol-visualization": [],
    }
    issues = _check_target_version(version=version_argument, package_versions=package_versions)
    assert issues == []


def test_check_target_version_allows_all_packages_unpublished() -> None:
    """Allows first publish when none of the packages have a history."""
    version_argument = "1.0.0"
    package_versions: dict[str, list[str]] = {
        "@opentrons/shared-data": [],
        "@opentrons/step-generation": [],
        "@opentrons/components": [],
        "@opentrons/protocol-visualization": [],
    }
    issues = _check_target_version(version=version_argument, package_versions=package_versions)
    assert issues == []


def test_check_target_version_flags_all_packages_already_published() -> None:
    """Flags target versions that already exist for all packages."""
    version_argument = "1.1.0"
    package_versions = {
        "@opentrons/shared-data": ["1.1.0"],
        "@opentrons/step-generation": ["1.1.0"],
        "@opentrons/components": ["1.1.0"],
        "@opentrons/protocol-visualization": ["1.1.0"],
    }
    issues = _check_target_version(version=version_argument, package_versions=package_versions)
    assert any("already published for all packages" in issue for issue in issues)


def test_check_target_version_flags_non_increment_for_existing_package() -> None:
    """Flags target versions that do not advance beyond latest published."""
    version_argument = "1.1.0"
    package_versions = {
        "@opentrons/shared-data": ["1.2.0"],
        "@opentrons/step-generation": [],
        "@opentrons/components": ["1.0.0"],
        "@opentrons/protocol-visualization": [],
    }
    issues = _check_target_version(version=version_argument, package_versions=package_versions)
    assert any("@opentrons/shared-data latest is 1.2.0" in issue for issue in issues)


def test_check_target_version_flags_partial_publish() -> None:
    """Flags a target already published for only a subset of packages."""
    version_argument = "1.1.0"
    package_versions = {
        "@opentrons/shared-data": ["1.1.0"],
        "@opentrons/step-generation": [],
        "@opentrons/components": [],
        "@opentrons/protocol-visualization": [],
    }
    issues = _check_target_version(version=version_argument, package_versions=package_versions)
    assert len(issues) == 1
    assert "Partial publish detected" in issues[0]


def test_check_target_version_flags_partial_publish_with_mixed_package_history() -> None:
    """Flags partial publish even when other packages have older history."""
    version_argument = "1.1.0"
    package_versions = {
        "@opentrons/shared-data": ["1.0.0", "1.1.0"],
        "@opentrons/step-generation": [],
        "@opentrons/components": ["1.0.0"],
        "@opentrons/protocol-visualization": [],
    }
    issues = _check_target_version(version=version_argument, package_versions=package_versions)
    assert any("Partial publish detected" in issue for issue in issues)
