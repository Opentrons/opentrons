"""Tests for persistence root temp/ scratch helpers."""

from pathlib import Path

from server_utils.persistence.persistence_directory import (
    PERSISTENCE_TEMP_SUBDIRECTORY,
    cleanup_persistence_temp_directory,
    ensure_persistence_temp_directory,
    get_persistence_temp_directory,
)


def test_get_persistence_temp_directory(tmp_path: Path) -> None:
    """It should return the temp subdirectory path without creating it."""
    result = get_persistence_temp_directory(tmp_path)

    assert result == tmp_path / PERSISTENCE_TEMP_SUBDIRECTORY
    assert not result.exists()


def test_ensure_persistence_temp_directory_creates_directory(tmp_path: Path) -> None:
    """It should create persistence_root/temp when missing."""
    result = ensure_persistence_temp_directory(tmp_path)

    assert result == tmp_path / "temp"
    assert result.is_dir()


def test_cleanup_persistence_temp_directory_removes_temp_tree(tmp_path: Path) -> None:
    """It should delete the entire temp/ tree and leave siblings alone."""
    version_dir = tmp_path / "13"
    version_dir.mkdir()
    (version_dir / "robot_server.db").write_bytes(b"db")

    temp_dir = ensure_persistence_temp_directory(tmp_path)
    staging = temp_dir / "temp-download-staging-abc"
    staging.mkdir()
    (staging / "download.zip").write_bytes(b"zip")

    cleanup_persistence_temp_directory(tmp_path)

    assert not temp_dir.exists()
    assert version_dir.exists()
    assert (version_dir / "robot_server.db").exists()


def test_cleanup_persistence_temp_directory_missing_is_noop(tmp_path: Path) -> None:
    """It should no-op when persistence_root/temp does not exist."""
    cleanup_persistence_temp_directory(tmp_path)
    assert not (tmp_path / "temp").exists()
