import re
from pathlib import Path

import pytest
import sqlalchemy

from auth_server.persistence import orm_models
from auth_server.persistence.database import sql_engine_ctx
from auth_server.persistence.file_and_directory_names import DB_FILE
from auth_server.persistence.persistence_directory import make_migration_orchestrator


def test_migration_orm_parity(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """Test for parity between our migration system and our ORM models.

    Our migration system is responsible for taking an old database (if there is one) and
    migrating it through every version on the way to the latest one. If everything goes
    correctly, we should end up with a final database whose schema exactly matches
    our current `orm_models`.

    If this test fails, it probably means we changed our ORM models and didn't
    add a matching migration, or there's a bug in a migration.
    """
    schema_from_migration_path = _get_schema_from_migration_path(
        tmp_path_factory.mktemp("from_migrations", numbered=True)
    )
    schema_from_orm_models = _get_schema_from_orm_models(
        tmp_path_factory.mktemp("from_orm_models", numbered=True)
    )

    # SQLAlchemy may emit CREATE INDEX statements in a nondeterministic
    # order across runs.
    normalized_from_migration_path = set(
        _normalize_statement(s) for s in schema_from_migration_path
    )
    normalized_from_orm_models = set(
        _normalize_statement(s) for s in schema_from_orm_models
    )

    assert normalized_from_migration_path == normalized_from_orm_models


def _get_schema_from_migration_path(temp_dir: Path) -> list[str]:
    migration_orchestrator = make_migration_orchestrator(prepared_root=temp_dir)
    active_subdirectory = migration_orchestrator.migrate_to_latest()
    with (
        sql_engine_ctx(active_subdirectory / DB_FILE) as sql_engine,
        sql_engine.begin() as connection,
    ):
        return _get_schema(connection)


def _get_schema_from_orm_models(temp_dir: Path) -> list[str]:
    with (
        sql_engine_ctx(temp_dir / "test.db") as sql_engine,
        sql_engine.begin() as connection,
    ):
        orm_models.Base.metadata.create_all(connection)
        return _get_schema(connection)


def _get_schema(connection: sqlalchemy.engine.Connection) -> list[str]:
    """Return the schema of the given SQLite database.

    The schema is returned in the form of DDL statements
    (like `CREATE TABLE ...`, etc.).
    """
    return list(
        connection.execute(
            # `alembic_version` is bookkeeping added by Alembic, naturally only present
            # when we're using the Alembic migration path. Exclude it from the comparison.
            sqlalchemy.text(
                "SELECT sql FROM sqlite_schema "
                "WHERE sql IS NOT NULL AND tbl_name != 'alembic_version'"
            )
        )
        .scalars()
        .all()
    )


def _normalize_statement(statement: str) -> str:
    """Fix up the internal formatting of a single SQL statement for easier comparison.

    For example, when we ask SQLite for its schema, it appears
    inconsistent in whether it uses spaces or line breaks to separate tokens.
    It may have to do with whether `ALTER TABLE` has been used on the table.
    """
    # Replace runs of any whitespace with a single literal space.
    statement = re.sub(r"\s+", " ", statement)
    # Strip double-quotes around identifiers (e.g. "user" vs user).
    # Alembic's batch_alter_table may quote identifiers differently than
    # SQLAlchemy's create_all.
    statement = statement.replace('"', "")
    # Remove whitespace at the beginning and end of the statement.
    statement = statement.strip()
    return statement
