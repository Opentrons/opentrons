"""Test SQL database migrations."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Generator

import pytest
import sqlalchemy
from pytest_lazy_fixtures import lf

from server_utils import sql_utils

from system_server.persistence import (
    SettingKey,
    migration_table,
    registration_table,
    settings_table,
)
from system_server.persistence.database import create_sql_engine

TABLES = [registration_table, settings_table]


@pytest.fixture
def database_v0(tmp_path: Path) -> Path:
    """Create a database matching schema version 0."""
    db_path = tmp_path / "migration-test-v0.db"
    engine = sqlalchemy.create_engine(sql_utils.get_connection_url(db_path))

    # Schema 0 only had registration and migration tables.
    v0_metadata = sqlalchemy.MetaData()
    registration_table.to_metadata(v0_metadata)
    migration_table.to_metadata(v0_metadata)
    v0_metadata.create_all(engine)

    with engine.begin() as connection:
        connection.execute(
            sqlalchemy.insert(migration_table).values(
                created_at=datetime.now(tz=timezone.utc),
                version=0,
            )
        )

    engine.dispose()
    return db_path


@pytest.fixture
def subject(database_path: Path) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Get a SQLEngine test subject.

    The tests in this suite will use this SQLEngine to test
    that migrations happen properly. For other tests, the `sql_engine`
    fixture in `conftest.py` should be used, instead.
    """
    engine = create_sql_engine(database_path)
    yield engine
    engine.dispose()


@pytest.mark.parametrize(
    "database_path",
    [
        lf("database_v0"),
    ],
)
def test_migration(subject: sqlalchemy.engine.Engine) -> None:
    """It should migrate a v0 database to the latest schema."""
    with subject.begin() as connection:
        migrations = connection.execute(sqlalchemy.select(migration_table)).all()

    assert [m.version for m in migrations] == [0, 1]

    with subject.begin() as connection:
        for table in TABLES:
            connection.execute(sqlalchemy.select(table)).all()

        settings = connection.execute(sqlalchemy.select(settings_table)).all()
        assert [(row.key, row.value) for row in settings] == [
            (SettingKey.LOG_LEVEL, "info")
        ]


def test_fresh_database_seeds_default_settings(tmp_path: Path) -> None:
    """It should seed default settings on a freshly created database."""
    engine = create_sql_engine(tmp_path / "fresh.db")
    try:
        with engine.begin() as connection:
            migrations = connection.execute(sqlalchemy.select(migration_table)).all()
            settings = connection.execute(sqlalchemy.select(settings_table)).all()

        assert [m.version for m in migrations] == [1]
        assert [(row.key, row.value) for row in settings] == [
            (SettingKey.LOG_LEVEL, "info")
        ]
    finally:
        engine.dispose()
