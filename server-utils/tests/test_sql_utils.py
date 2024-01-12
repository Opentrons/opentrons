"""Tests for the `sql_utils` module."""


from contextlib import contextmanager, nullcontext
from pathlib import Path
from typing import Any, Generator, ContextManager

import pytest
import sqlalchemy

from server_utils import sql_utils


@contextmanager
def make_scratch_engine(path: Path) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Return a SQLAlchemy engine connected to an empty scratch database."""
    engine = sqlalchemy.create_engine(sql_utils.get_connection_url(path))
    yield engine
    engine.dispose()


@pytest.fixture
def scratch_engine(tmp_path: Path) -> Generator[sqlalchemy.engine.Engine, None, None]:
    """Return a SQLAlchemy engine connected to an empty scratch database."""
    db_file = tmp_path / "test.db"
    engine = sqlalchemy.create_engine(sql_utils.get_connection_url(db_file))
    yield engine
    engine.dispose()


@pytest.mark.parametrize("enable_foreign_key_constraints", [True, False])
def test_enable_foreign_key_constraints(
    scratch_engine: sqlalchemy.engine.Engine,
    enable_foreign_key_constraints: bool,
) -> None:
    """Test enabling foreign key constraints.

    If we enable foreign key constraints and then try to do something that causes a foreign
    key violation, it should raise an exception.

    If we don't enable foreign key constraints, we expect misbehavior where it succeeds despite the
    foreign key violation. If this misbehavior stops happening, it may mean SQLite has improved its
    default behavior and our workaround of `enable_foreign_key_transactions()` is no longer needed.
    """
    metadata = sqlalchemy.MetaData()
    table_a = sqlalchemy.Table(
        "a",
        metadata,
        sqlalchemy.Column(
            "int_col",
            sqlalchemy.Integer,
            nullable=False,
        ),
    )
    table_b = sqlalchemy.Table(
        "b",
        metadata,
        sqlalchemy.Column(
            "int_col",
            sqlalchemy.Integer,
            sqlalchemy.ForeignKey("a.int_col"),
            nullable=False,
        ),
    )
    metadata.create_all(scratch_engine)

    if enable_foreign_key_constraints:
        sql_utils.enable_foreign_key_constraints(scratch_engine)
        expected_raise: ContextManager[Any] = pytest.raises(
            sqlalchemy.exc.OperationalError, match="foreign key"
        )
    else:
        expected_raise = nullcontext()

    with expected_raise, scratch_engine.begin() as transaction:
        transaction.execute(sqlalchemy.insert(table_a).values(int_col=123))
        transaction.execute(sqlalchemy.insert(table_b).values(int_col=456))


@pytest.mark.parametrize("fix_transactions", [True, False])
def test_fix_transaction_fixes_transactional_ddl(
    scratch_engine: sqlalchemy.engine.Engine,
    fix_transactions: bool,
) -> None:
    """Test that `fix_transactions()` fixes transactional DDL.

    "Transactional DDL" means statements like `ALTER TABLE` inside a transaction.

    With `fix_transactions()`, the statement should be rolled back if the transaction is
    interrupted by an exception.

    Without `fix_transactions()`, we expect misbehavior where the statement is not rolled back.
    If this misbehavior doesn't happen, it may mean the sqlite3/pysqlite driver has improved
    and our workaround of `fix_transactions()` is no longer necessary.
    """
    metadata = sqlalchemy.MetaData()
    sqlalchemy.Table(
        "table",
        metadata,
        sqlalchemy.Column("int_col", sqlalchemy.Integer, nullable=False),
    )
    metadata.create_all(scratch_engine)

    if fix_transactions:
        sql_utils.fix_transactions(scratch_engine)
        expected_final_column_names = ["int_col"]
    else:
        expected_final_column_names = ["int_col", "str_col"]

    class ExceptionInterruptingTransaction(Exception):
        pass

    try:
        with scratch_engine.begin() as transaction:
            transaction.execute(
                sqlalchemy.text("ALTER TABLE 'table' ADD str_col VARCHAR")
            )
            raise ExceptionInterruptingTransaction()
    except ExceptionInterruptingTransaction:
        pass

    column_names = [
        c["name"] for c in sqlalchemy.inspect(scratch_engine).get_columns("table")
    ]
    assert column_names == expected_final_column_names


def test_copy(tmp_path: Path) -> None:
    metadata = sqlalchemy.MetaData()
    table = sqlalchemy.Table(
        "table",
        metadata,
        sqlalchemy.Column("int_col", sqlalchemy.Integer, nullable=False),
    )

    source_file = tmp_path / "original.db"
    copy_file = tmp_path / "copy.db"

    with make_scratch_engine(source_file) as source_engine:
        with source_engine.begin() as transaction:
            metadata.create_all(source_engine)
            transaction.execute(sqlalchemy.insert(table).values(int_col=123))
            transaction.execute(sqlalchemy.insert(table).values(int_col=456))

    sql_utils.copy(source_file=source_file, destination_file=copy_file)

    with make_scratch_engine(copy_file) as copy_engine:
        with copy_engine.begin() as transaction:
            result = transaction.execute(
                sqlalchemy.select(table.c.int_col).order_by(table.c.int_col)
            ).scalars().all()

    assert result == [123, 456]
