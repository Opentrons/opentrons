"""Tests for auth_server.persistence.persistence_directory."""

from pathlib import Path

import sqlalchemy

from server_utils.persistence.persistence_directory import (
    PersistenceResetter,
)

from auth_server.persistence._migrations.up_to_v01 import MigrationUpTo1
from auth_server.persistence.database import sql_engine_ctx
from auth_server.persistence.file_and_directory_names import (
    DB_FILE,
    LATEST_VERSION_DIRECTORY,
    V01_VERSION_DIRECTORY,
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
    """prepare_root should clear the contents of a directory marked for reset."""
    target = tmp_path / "persistence"
    target.mkdir()
    (target / "some_data.txt").write_text("important data")
    (target / "_TO_BE_DELETED_ON_REBOOT").write_text("marker")
    original_inode = target.stat().st_ino

    result = await prepare_root(target)

    assert result == target
    assert target.exists()
    assert target.stat().st_ino == original_inode
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
    assert len(orchestrator._migrations) == 2
    assert orchestrator._migrations[0].subdirectory == V01_VERSION_DIRECTORY
    assert orchestrator._migrations[1].subdirectory == LATEST_VERSION_DIRECTORY


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
            "temporary_hashed_password",
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


async def test_prepare_active_subdirectory_copies_v01_users_and_crs(
    tmp_path: Path,
) -> None:
    """An existing 1_b8c4e2f1a903 database must be copied, not replaced, on upgrade."""
    v01_dir = tmp_path / V01_VERSION_DIRECTORY
    v01_dir.mkdir()
    MigrationUpTo1(subdirectory=V01_VERSION_DIRECTORY).migrate(
        source_dir=tmp_path, dest_dir=v01_dir
    )

    with sql_engine_ctx(v01_dir / DB_FILE) as engine:
        v01_columns = {
            col["name"] for col in sqlalchemy.inspect(engine).get_columns("user")
        }
        assert "temporary_hashed_password" not in v01_columns
        with engine.begin() as connection:
            connection.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO user (
                        username,
                        hashed_password,
                        full_name,
                        account_type,
                        password_set_at
                    )
                    VALUES (
                        :username,
                        :hashed_password,
                        :full_name,
                        :account_type,
                        :password_set_at
                    )
                    """
                ),
                {
                    "username": "testadmin",
                    "hashed_password": "existing-hash",
                    "full_name": "Test Admin",
                    "account_type": "admin",
                    "password_set_at": "2026-01-01 00:00:00.000000",
                },
            )
            connection.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO access_control_enabled (id, enabled)
                    VALUES (1, 1)
                    """
                )
            )

    subdirectory = await prepare_active_subdirectory(tmp_path)

    assert subdirectory == tmp_path / LATEST_VERSION_DIRECTORY
    assert v01_dir.exists()

    with sql_engine_ctx(subdirectory / DB_FILE) as engine:
        inspector = sqlalchemy.inspect(engine)
        columns = {col["name"] for col in inspector.get_columns("user")}
        assert "temporary_hashed_password" in columns
        with engine.begin() as connection:
            user = connection.execute(
                sqlalchemy.text(
                    """
                    SELECT username, hashed_password, temporary_hashed_password
                    FROM user
                    """
                )
            ).one()
            crs = connection.execute(
                sqlalchemy.text(
                    "SELECT enabled FROM access_control_enabled WHERE id = 1"
                )
            ).scalar_one()
            alembic_revision = connection.execute(
                sqlalchemy.text("SELECT version_num FROM alembic_version")
            ).scalar_one()

    assert user.username == "testadmin"
    assert user.hashed_password == "existing-hash"
    assert user.temporary_hashed_password is None
    assert crs == 1
    assert alembic_revision == "c3a91d4e2b70"


async def test_prepare_active_subdirectory_cleans_stray_temp_files(
    tmp_path: Path,
) -> None:
    """Stray temp files from an interrupted migration should be cleaned up."""
    (tmp_path / "temp-abandoned").mkdir()
    (tmp_path / "temp-abandoned" / "junk.db").write_text("stale")

    subdirectory = await prepare_active_subdirectory(tmp_path)

    assert subdirectory.exists()
    assert not (tmp_path / "temp-abandoned").exists()
