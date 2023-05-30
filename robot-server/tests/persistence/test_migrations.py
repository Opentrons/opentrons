"""Test SQL database migrations."""
from pathlib import Path
from typing import Generator

import pytest
import sqlalchemy
from pytest_lazyfixture import lazy_fixture  # type: ignore[import]

from robot_server.persistence import create_sql_engine
from robot_server.persistence import (
    migration_table,
    run_table,
    action_table,
    protocol_table,
    analysis_table,
)


TABLES = [run_table, action_table, protocol_table, analysis_table]


@pytest.fixture
def database_v0(tmp_path: Path) -> Path:
    """Create a database matching schema version 0."""
    db_path = tmp_path / "migration-test-v0.db"
    sql_engine = create_sql_engine(db_path)
    sql_engine.execute("DROP TABLE migration")
    sql_engine.execute("DROP TABLE run")
    sql_engine.execute(
        """
        CREATE TABLE run (
            id VARCHAR NOT NULL,
            created_at DATETIME NOT NULL,
            protocol_id VARCHAR,
            PRIMARY KEY (id),
            FOREIGN KEY(protocol_id) REFERENCES protocol (id)
        )
        """
    )
    sql_engine.dispose()
    return db_path


@pytest.fixture
def database_v1(tmp_path: Path) -> Path:
    """Create a database matching schema version 1."""
    db_path = tmp_path / "migration-test-v1.db"
    sql_engine = create_sql_engine(db_path)
    sql_engine.dispose()
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
        lazy_fixture("database_v0"),
        lazy_fixture("database_v1"),
    ],
)
def test_migration(subject: sqlalchemy.engine.Engine) -> None:
    """It should migrate a table."""
    migrations = subject.execute(sqlalchemy.select(migration_table)).all()

    assert [m.version for m in migrations] == [1]

    # all table queries work without raising
    for table in TABLES:
        values = subject.execute(sqlalchemy.select(table)).all()
        assert values == []
