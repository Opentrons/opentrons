"""Shared js-packages-release helpers (version resolution, package identifiers)."""

from __future__ import annotations

import semver

PACKAGES: tuple[str, ...] = (
    "@opentrons/shared-data",
    "@opentrons/step-generation",
    "@opentrons/components",
    "@opentrons/protocol-visualization",
)

TAG_PREFIX = "js-packages-release@"
REF_PREFIX = "refs/tags/"
DEFAULT_NPM_REGISTRY = "https://npm.pkg.github.com"

# Monorepo directory names (relative to repo root) for each scoped package name.
PACKAGE_REL_DIRS: dict[str, str] = {
    "@opentrons/shared-data": "shared-data",
    "@opentrons/step-generation": "step-generation",
    "@opentrons/components": "components",
    "@opentrons/protocol-visualization": "protocol-visualization",
}


def parse_semver(version: str) -> semver.Version:
    """Parse a semver string."""
    try:
        return semver.Version.parse(version)
    except ValueError as error:
        raise ValueError(f"Invalid semver version '{version}'. Expected format like '1.2.3' or '1.2.3-beta.1'.") from error


def validate_semver(version: str) -> str:
    """Validate and return a semver string."""
    parse_semver(version)
    return version


def resolve_version_input(version_input: str) -> str:
    """Resolve semver from plain version, prefixed tag, or full tag ref."""
    value = version_input.strip()
    if value.startswith(REF_PREFIX):
        value = value.removeprefix(REF_PREFIX)
    if value.startswith(TAG_PREFIX):
        return validate_semver(value.removeprefix(TAG_PREFIX))
    if "@" in value:
        raise ValueError(f"Invalid tag prefix in '{version_input}'. Expected '{TAG_PREFIX}<semver>' or a plain '<semver>'.")
    return validate_semver(value)


def prior_packages(package_name: str) -> tuple[str, ...]:
    """Scoped packages that must be pinned to the release version before this one (publish order)."""
    idx = PACKAGES.index(package_name)
    return PACKAGES[:idx]
