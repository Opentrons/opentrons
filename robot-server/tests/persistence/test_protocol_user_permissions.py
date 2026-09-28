"""Tests for granting the ot-protocol user access to persistence files."""

import os
import stat
from pathlib import Path
from typing import NamedTuple

import pytest

from robot_server.persistence import protocol_user_permissions as subject
from robot_server.persistence.file_and_directory_names import (
    DATA_FILES_DIRECTORY,
    DB_FILE,
    PROTOCOLS_DIRECTORY,
)

_PWD_GETPWNAM = "robot_server.persistence.protocol_user_permissions.pwd.getpwnam"
_OS_CHOWN = "robot_server.persistence.protocol_user_permissions.os.chown"


class _FakePwNam(NamedTuple):
    pw_gid: int


def _mode(path: Path) -> int:
    return stat.S_IMODE(path.stat().st_mode)


def _build_version_dir(tmp_path: Path) -> Path:
    version_dir = tmp_path / "19"
    version_dir.mkdir()
    (version_dir / DB_FILE).write_bytes(b"db")

    protocol_dir = version_dir / PROTOCOLS_DIRECTORY / "protocol-id"
    protocol_dir.mkdir(parents=True)
    (protocol_dir / "protocol.py").write_text("# protocol")

    data_file_dir = version_dir / DATA_FILES_DIRECTORY / "file-id"
    data_file_dir.mkdir(parents=True)
    (data_file_dir / "data.csv").write_text("a,b\n")

    return version_dir


def _missing_user(name: str) -> object:
    raise KeyError(name)


def test_grant_skips_chown_when_user_missing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When ot-protocol does not exist, chmod still runs and chown does not."""
    monkeypatch.setattr(_PWD_GETPWNAM, _missing_user)
    chown_calls: list[tuple[str, int, int]] = []
    monkeypatch.setattr(
        _OS_CHOWN,
        lambda path, uid, gid: chown_calls.append((os.fspath(path), uid, gid)),
    )

    version_dir = _build_version_dir(tmp_path)
    db_mode_before = _mode(version_dir / DB_FILE)

    subject.grant_protocol_user_access(version_dir)

    assert chown_calls == []
    assert _mode(version_dir) == 0o2750
    assert _mode(version_dir / PROTOCOLS_DIRECTORY) == 0o2750
    assert _mode(version_dir / PROTOCOLS_DIRECTORY / "protocol-id") == 0o2750
    assert _mode(version_dir / PROTOCOLS_DIRECTORY / "protocol-id" / "protocol.py") == (
        0o640
    )
    assert _mode(version_dir / DATA_FILES_DIRECTORY / "file-id" / "data.csv") == 0o640
    assert _mode(version_dir / DB_FILE) == db_mode_before


def test_grant_chowns_protocol_paths_not_database(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """When ot-protocol exists, chown the version dir plus protocol and data files."""
    monkeypatch.setattr(_PWD_GETPWNAM, lambda name: _FakePwNam(pw_gid=1234))
    chown_calls: list[tuple[Path, int, int]] = []
    monkeypatch.setattr(
        _OS_CHOWN,
        lambda path, uid, gid: chown_calls.append((Path(path), uid, gid)),
    )

    version_dir = _build_version_dir(tmp_path)
    db_path = version_dir / DB_FILE
    db_mode_before = _mode(db_path)

    subject.grant_protocol_user_access(version_dir)

    chowned_paths = {path.resolve() for path, _uid, gid in chown_calls}
    assert all(gid == 1234 for _path, _uid, gid in chown_calls)
    assert all(uid == -1 for _path, uid, _gid in chown_calls)

    assert version_dir.resolve() in chowned_paths
    assert (version_dir / PROTOCOLS_DIRECTORY).resolve() in chowned_paths
    assert (
        version_dir / PROTOCOLS_DIRECTORY / "protocol-id"
    ).resolve() in chowned_paths
    assert (
        version_dir / PROTOCOLS_DIRECTORY / "protocol-id" / "protocol.py"
    ).resolve() in chowned_paths
    assert (version_dir / DATA_FILES_DIRECTORY).resolve() in chowned_paths
    assert (
        version_dir / DATA_FILES_DIRECTORY / "file-id" / "data.csv"
    ).resolve() in chowned_paths
    assert db_path.resolve() not in chowned_paths
    assert _mode(db_path) == db_mode_before


def test_grant_swallows_chown_permission_error(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """A non-root process should still chmod even if chown is denied."""
    monkeypatch.setattr(_PWD_GETPWNAM, lambda name: _FakePwNam(pw_gid=1234))

    def _deny_chown(path: object, uid: int, gid: int) -> None:
        raise PermissionError(13, "Operation not permitted")

    monkeypatch.setattr(_OS_CHOWN, _deny_chown)

    version_dir = tmp_path / "19"
    version_dir.mkdir()

    subject.grant_protocol_user_access(version_dir)

    assert _mode(version_dir) == 0o2750


def test_grant_ignores_missing_protocol_trees(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """An empty version directory should still get directory modes."""
    monkeypatch.setattr(_PWD_GETPWNAM, _missing_user)

    version_dir = tmp_path / "19"
    version_dir.mkdir()

    subject.grant_protocol_user_access(version_dir)

    assert _mode(version_dir) == 0o2750
