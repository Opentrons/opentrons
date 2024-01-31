"""Shared helpers for migrations."""

import sqlalchemy

import shutil
from pathlib import Path

from .._database import sqlite_rowid


def copy_rows_unmodified(
    source_table: sqlalchemy.Table,
    dest_table: sqlalchemy.Table,
    source_connection: sqlalchemy.engine.Connection,
    dest_connection: sqlalchemy.engine.Connection,
    order_by_rowid: bool,
) -> None:
    """Copy the contents of a table between databases.

    The column names must be identical.

    `order_by_rowid` preserves the relative ordering in SQLite's implicit `ROWID`
    column by inserting records in the same order they were in the source.
    This is only necessary if the table relies on SQLite's implicit `ROWID` column for
    row ordering; it should be `False` if the table has an explicit sequence number
    column instead.
    """
    select = sqlalchemy.select(source_table).order_by(
        sqlite_rowid if order_by_rowid else None
    )
    insert = sqlalchemy.insert(dest_table)
    # TODO: SQLAlchemy or its underlying dbapi are probably paging the entire
    # collection of source rows into memory. This is probably fine--it will probably
    # not be much worse than how Protocol Engine keeps every command in memory--
    # but it's not great.
    #
    # SQLAlchemy 1.4.40 might make this easier to fix, with yield_per.
    # https://docs.sqlalchemy.org/en/14/core/connections.html#sqlalchemy.engine.Connection.execution_options.params.yield_per
    for row in source_connection.execute(select).mappings():
        dest_connection.execute(insert, row)


def copy_if_exists(src: Path, dst: Path) -> None:
    """Like `shutil.copy()`, but no-op if `src` doesn't exist."""
    try:
        shutil.copy(src=src, dst=dst)
    except FileNotFoundError:
        pass


def copytree_if_exists(src: Path, dst: Path) -> None:
    """Like `shutil.copytree()`, but no-op if `src` doesn't exist."""
    try:
        shutil.copytree(src=src, dst=dst)
    except FileNotFoundError:
        pass
