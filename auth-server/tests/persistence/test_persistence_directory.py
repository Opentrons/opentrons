"""Tests for auth_server.persistence.persistence_directory."""

from pathlib import Path

import sqlalchemy

from server_utils.persistence.persistence_directory import (
    PersistenceResetter,
)

from auth_server.persistence.database import sql_engine_ctx
from auth_server.persistence.file_and_directory_names import (
    DB_FILE,
    LATEST_VERSION_DIRECTORY,
)
from auth_server.persistence.persistence_directory import (
    make_migration_orchestrator,
    prepare_active_subdirectory,
    prepare_root,
)


async def test_prepare_root_creates_temp_dir_when_none() -> None:
    """When no path is given, prepare_root should create a fresh temporary directory."""
    result = await prepare_root(None)
    assert result.exists()
    assert result.is_dir()
    assert "opentrons-auth-server-" in result.name


async def test_prepare_root_creates_directory(tmp_path: Path) -> None:
    """prepare_root should create the directory if it doesn't exist."""
    target = tmp_path / "new_persistence_dir"
    assert not target.exists()

    result = await prepare_root(target)

    assert result == target
    assert target.exists()
    assert target.is_dir()


async def test_prepare_root_resets_marked_directory(tmp_path: Path) -> None:
    """prepare_root should delete and recreate a directory marked for reset."""
    target = tmp_path / "persistence"
    target.mkdir()
    (target / "some_data.txt").write_text("important data")
    (target / "_TO_BE_DELETED_ON_REBOOT").write_text("marker")

    result = await prepare_root(target)

    assert result == target
    assert target.exists()
    assert not (target / "some_data.txt").exists()
    assert not (target / "_TO_BE_DELETED_ON_REBOOT").exists()


async def test_prepare_root_preserves_unmarked_directory(tmp_path: Path) -> None:
    """prepare_root should leave existing data alone if not marked for reset."""
    target = tmp_path / "persistence"
    target.mkdir()
    (target / "some_data.txt").write_text("important data")

    result = await prepare_root(target)

    assert result == target
    assert (target / "some_data.txt").read_text() == "important data"


# -- PersistenceResetter --


async def test_persistence_resetter_creates_marker(tmp_path: Path) -> None:
    """PersistenceResetter should create the reset marker file."""
    resetter = PersistenceResetter(tmp_path)

    await resetter.mark_directory_reset()

    marker = tmp_path / "_TO_BE_DELETED_ON_REBOOT"
    assert marker.exists()


async def test_reset_marker_is_detected_by_prepare_root(tmp_path: Path) -> None:
    """A directory marked by PersistenceResetter should be wiped by prepare_root."""
    target = tmp_path / "persistence"
    target.mkdir()
    (target / "old_data.db").write_text("stale")

    resetter = PersistenceResetter(target)
    await resetter.mark_directory_reset()

    await prepare_root(target)

    assert target.exists()
    assert not (target / "old_data.db").exists()


# -- make_migration_orchestrator --


def test_make_migration_orchestrator(tmp_path: Path) -> None:
    """make_migration_orchestrator should return a properly configured orchestrator."""
    orchestrator = make_migration_orchestrator(tmp_path)

    assert orchestrator._root == tmp_path
    assert len(orchestrator._migrations) == 1
    assert orchestrator._migrations[0].subdirectory == LATEST_VERSION_DIRECTORY


# -- prepare_active_subdirectory --


async def test_prepare_active_subdirectory_creates_db_with_users_table(
    tmp_path: Path,
) -> None:
    """prepare_active_subdirectory should run the v1 migration and create the DB."""
    subdirectory = await prepare_active_subdirectory(tmp_path)

    assert subdirectory == tmp_path / LATEST_VERSION_DIRECTORY
    assert subdirectory.exists()

    db_file = subdirectory / DB_FILE
    assert db_file.exists()

    with sql_engine_ctx(db_file) as engine:
        inspector = sqlalchemy.inspect(engine)
        assert "user" in inspector.get_table_names()
        columns = {col["name"] for col in inspector.get_columns("user")}
        assert columns == {
            "id",
            "username",
            "hashed_password",
            "full_name",
            "account_type",
            "password_set_at",
            "reset_password",
            "deactivated",
        }


async def test_prepare_active_subdirectory_is_created_once(tmp_path: Path) -> None:
    """Calling prepare_active_subdirectory twice should be a safe no-op the second time."""
    first = await prepare_active_subdirectory(tmp_path)
    second = await prepare_active_subdirectory(tmp_path)

    assert first == second
    assert (second / DB_FILE).exists()


async def test_prepare_active_subdirectory_cleans_stray_temp_files(
    tmp_path: Path,
) -> None:
    """Stray temp files from an interrupted migration should be cleaned up."""
    (tmp_path / "temp-abandoned").mkdir()
    (tmp_path / "temp-abandoned" / "junk.db").write_text("stale")

    subdirectory = await prepare_active_subdirectory(tmp_path)

    assert subdirectory.exists()
    assert not (tmp_path / "temp-abandoned").exists()
