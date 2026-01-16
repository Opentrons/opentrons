"""Protocol Designer protocol fixture helpers.

This module provides a typed, discoverable source of truth for Protocol Designer
fixture files under `e2e-testing/fixtures/`.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True, slots=True)
class ProtocolFixture:
    """A Protocol Designer protocol fixture file.

    Attributes:
        key: Stable identifier used for parametrized tests.
        path: Absolute path to the fixture file.
    """

    key: str
    path: Path

    @property
    def is_json(self) -> bool:
        """True if this fixture is a JSON protocol/state file."""
        return self.path.suffix.lower() == ".json"

    @property
    def is_python(self) -> bool:
        """True if this fixture is a Python protocol file."""
        return self.path.suffix.lower() == ".py"


_E2E_DIR = Path(__file__).parent
_PROTOCOL_FIXTURES_DIR = _E2E_DIR / "fixtures" / "protocol"
_PROTOCOL_SNAPSHOTS_DIR = _PROTOCOL_FIXTURES_DIR / "for_snapshots"


def _iter_versioned_protocol_fixture_files() -> Iterable[Path]:
    """Iterate all protocol JSON fixture files.

    Only includes `*.json` files in numeric version directories (e.g. `1/`, `8/`).
    """

    if not _PROTOCOL_FIXTURES_DIR.exists():
        return []

    fixture_paths: list[Path] = []
    for version_dir in sorted(_PROTOCOL_FIXTURES_DIR.iterdir()):
        if not version_dir.is_dir():
            continue
        if not version_dir.name.isdigit():
            continue

        for candidate in sorted(version_dir.iterdir()):
            if not candidate.is_file():
                continue
            if candidate.suffix.lower() not in {".json", ".py"}:
                continue
            fixture_paths.append(candidate)

    return fixture_paths


def _iter_snapshot_protocol_fixture_files() -> Iterable[Path]:
    """Iterate all protocol fixtures under `fixtures/protocol/for_snapshots/`.

    Includes both JSON and Python protocol fixture files.
    """
    if not _PROTOCOL_SNAPSHOTS_DIR.exists():
        return []
    fixture_paths: list[Path] = []
    for candidate in sorted(_PROTOCOL_SNAPSHOTS_DIR.iterdir()):
        if not candidate.is_file():
            continue
        if candidate.suffix.lower() not in {".json", ".py"}:
            continue
        fixture_paths.append(candidate)
    return fixture_paths


def _key_for_path(path: Path) -> str:
    """Derive the key used to reference the fixture.

    Per request, this is the file stem (no overrides).
    """
    return path.stem


def get_protocol_fixtures() -> list[ProtocolFixture]:
    """Return all discovered protocol fixtures as `ProtocolFixture` records.

    This always includes:
    - versioned fixtures under `fixtures/protocol/<version>/` (numeric folders)
    - snapshot fixtures under `fixtures/protocol/for_snapshots/`

    Raises:
        ValueError: If any duplicate filename stems are found.
    """

    fixtures: list[ProtocolFixture] = []

    for full_path in _iter_versioned_protocol_fixture_files():
        fixtures.append(
            ProtocolFixture(
                key=_key_for_path(full_path),
                path=full_path,
            )
        )

    for full_path in _iter_snapshot_protocol_fixture_files():
        fixtures.append(
            ProtocolFixture(
                key=_key_for_path(full_path),
                path=full_path,
            )
        )

    duplicates: dict[str, list[str]] = {}
    for fixture in fixtures:
        duplicates.setdefault(fixture.key, []).append(str(fixture.path.relative_to(_E2E_DIR)))

    duplicate_keys = sorted(key for key, paths in duplicates.items() if len(paths) > 1)
    if duplicate_keys:
        details = "\n".join(f"- {key}: {', '.join(sorted(duplicates[key]))}" for key in duplicate_keys)
        raise ValueError(
            "Duplicate protocol fixture filenames detected (keys are file stems). "
            "Please rename fixtures to be globally unique.\n"
            f"{details}"
        )

    # Ensure deterministic order for parametrization.
    return sorted(fixtures, key=lambda fixture: str(fixture.path))


def get_protocol_fixtures_by_key(
    key: str,
) -> list[ProtocolFixture]:
    """Return all fixtures matching a stem-based key."""
    return [fixture for fixture in get_protocol_fixtures() if fixture.key == key]


def get_protocol_fixture_by_key(key: str) -> ProtocolFixture:
    """Get a protocol fixture by its key.

    Raises:
        KeyError: If no fixture exists with the given key.
    """

    matches = get_protocol_fixtures_by_key(key)
    if not matches:
        raise KeyError(f"Unknown protocol fixture key: {key}")
    if len(matches) > 1:
        raise KeyError(
            f"Ambiguous protocol fixture key: {key}. Matches: {', '.join(str(match.path) for match in matches)}"
        )
    return matches[0]
