"""Test SQL database migrations."""
from pathlib import Path
from typing import Generator

import pytest
import sqlalchemy
from pytest_lazyfixture import lazy_fixture  # type: ignore[import-untyped]

from system_server.persistence.database import create_sql_engine
from system_server.persistence import (
    migration_table,
    registration_table,
)

TABLES = [registration_table]


@pytest.fixture
def database_v0(tmp_path: Path) -> Path:
    """Create a database matching schema version 0."""
    db_path = tmp_path / "migration-test-v0.db"
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
    ],
)
def test_migration(subject: sqlalchemy.engine.Engine) -> None:
    """It should migrate a table if necessary."""
    migrations = subject.execute(sqlalchemy.select(migration_table)).all()

    assert [m.version for m in migrations] == [0]

    # all table queries work without raising
    for table in TABLES:
        values = subject.execute(sqlalchemy.select(table)).all()
        assert values == []
