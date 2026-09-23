"""Tests for the schema 16 to 17 persistence migration."""

import stat
from pathlib import Path

from robot_server.persistence._migrations.v16_to_v17 import Migration16to17
from robot_server.persistence.file_and_directory_names import (
    DB_FILE,
    PROTOCOLS_DIRECTORY,
)


def _mode(path: Path) -> int:
    return stat.S_IMODE(path.stat().st_mode)


def test_migrate_applies_protocol_user_permissions(tmp_path: Path) -> None:
    """Copied protocol files should get 02750/0640 so ot-protocol can read them."""
    source_dir = tmp_path / "16"
    dest_dir = tmp_path / "17"
    source_dir.mkdir()
    dest_dir.mkdir()

    protocol_dir = source_dir / PROTOCOLS_DIRECTORY / "protocol-id"
    protocol_dir.mkdir(parents=True)
    (protocol_dir / "protocol.py").write_text("# protocol")
    (source_dir / DB_FILE).write_bytes(b"db")
    db_mode_before_copy = _mode(source_dir / DB_FILE)

    Migration16to17(subdirectory="17").migrate(source_dir, dest_dir)

    assert _mode(dest_dir / PROTOCOLS_DIRECTORY) == 0o2750
    assert _mode(dest_dir / PROTOCOLS_DIRECTORY / "protocol-id") == 0o2750
    assert (
        _mode(dest_dir / PROTOCOLS_DIRECTORY / "protocol-id" / "protocol.py") == 0o640
    )
    assert _mode(dest_dir / DB_FILE) == db_mode_before_copy


def test_migrate_skips_permissions_when_protocols_dir_missing(tmp_path: Path) -> None:
    """A persistence tree without protocols/ should still copy other files."""
    source_dir = tmp_path / "16"
    dest_dir = tmp_path / "17"
    source_dir.mkdir()
    dest_dir.mkdir()
    (source_dir / DB_FILE).write_bytes(b"db")

    Migration16to17(subdirectory="17").migrate(source_dir, dest_dir)

    assert not (dest_dir / PROTOCOLS_DIRECTORY).exists()
    assert (dest_dir / DB_FILE).exists()
