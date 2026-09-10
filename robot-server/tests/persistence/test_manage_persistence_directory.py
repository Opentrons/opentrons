"""Tests for preparing the robot-server persistence directory."""

import stat
from pathlib import Path

import pytest

from robot_server.persistence.file_and_directory_names import (
    DATA_FILES_DIRECTORY,
    DB_FILE,
    PROTOCOLS_DIRECTORY,
)
from robot_server.persistence.manage_persistence_directory import (
    prepare_active_subdirectory,
)


def _mode(path: Path) -> int:
    return stat.S_IMODE(path.stat().st_mode)


async def test_prepare_active_subdirectory_grants_protocol_user_access(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """After migrations, protocol files should be readable by ot-protocol."""
    version_dir = tmp_path / "19"
    protocol_dir = version_dir / PROTOCOLS_DIRECTORY / "protocol-id"
    protocol_dir.mkdir(parents=True)
    (protocol_dir / "protocol.py").write_text("# protocol")
    (version_dir / DATA_FILES_DIRECTORY / "file-id").mkdir(parents=True)
    (version_dir / DATA_FILES_DIRECTORY / "file-id" / "data.csv").write_text("a,b\n")
    db_path = version_dir / DB_FILE
    db_path.write_bytes(b"db")
    db_mode_before = _mode(db_path)

    async def _fake_prepare(orchestrator: object) -> Path:
        return version_dir

    monkeypatch.setattr(
        "robot_server.persistence.manage_persistence_directory.server_utils_prepare_active_subdirectory",
        _fake_prepare,
    )

    result = await prepare_active_subdirectory(tmp_path)

    assert result == version_dir
    assert _mode(version_dir) == 0o2750
    assert _mode(protocol_dir / "protocol.py") == 0o640
    assert _mode(version_dir / DATA_FILES_DIRECTORY / "file-id" / "data.csv") == 0o640
    assert _mode(db_path) == db_mode_before
