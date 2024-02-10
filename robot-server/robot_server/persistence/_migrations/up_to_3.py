"""Migrate the persistence directory from schema 2 to 3.

Summary of changes from schema 2:

- Run commands were formerly stored as monolithic blobs in the `run` table,
  with each row storing an entire list. This has been split out into a new
  `run_command` table, where each individual command gets its own row.

- All columns that were storing binary pickles have been converted to storing
  JSON strings:
  - `analysis.completed_analysis`
  - `run.state_summary`
  - `run_commands.command` (formerly `run.commands`; see above)

- `analysis.completed_analysis_as_document` has been removed,
  since the updated `analysis.completed_analysis` (see above) replaces it.
"""

import multiprocessing
from contextlib import ExitStack, contextmanager
from pathlib import Path
from typing import ContextManager, Dict, Generator, Iterable, List, Optional, Tuple

from opentrons.protocol_engine import Command, StateSummary
import pydantic
import sqlalchemy

from .. import legacy_pickle
from ..pydantic import pydantic_to_json
from .._database import (
    create_schema_2_sql_engine,
    create_schema_3_sql_engine,
    sqlite_rowid,
)
from .._folder_migrator import Migration
from .._tables import schema_2, schema_3
from ._util import copy_rows_unmodified, copy_if_exists, copytree_if_exists


# TODO: Define a single source of truth somewhere for these paths.
_DECK_CONFIGURATION_FILE = "deck_configuration.json"
_PROTOCOLS_DIRECTORY = "protocols"
_DB_FILE = "robot_server.db"


class MigrationUpTo3(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 2 to 3."""
        copy_if_exists(
            source_dir / _DECK_CONFIGURATION_FILE, dest_dir / _DECK_CONFIGURATION_FILE
        )
        copytree_if_exists(
            source_dir / _PROTOCOLS_DIRECTORY, dest_dir / _PROTOCOLS_DIRECTORY
        )

        source_db_file = source_dir / _DB_FILE
        dest_db_file = dest_dir / _DB_FILE

        with ExitStack() as exit_stack:
            source_engine = exit_stack.enter_context(
                # If the source is schema 0 or 1, this will migrate it to 2 in-place.
                _schema_2_sql_engine(source_db_file)
            )
            dest_engine = exit_stack.enter_context(_schema_3_sql_engine(dest_db_file))

            with source_engine.begin() as source_transaction, dest_engine.begin() as dest_transaction:
                run_ids = _get_run_ids(schema_2_transaction=source_transaction)
                _migrate_db_excluding_commands(source_transaction, dest_transaction)

        _migrate_db_commands(source_db_file, dest_db_file, run_ids)


@contextmanager
def _schema_2_sql_engine(
    db_file: Path,
) -> Generator[sqlalchemy.engine.Engine, None, None]:
    engine = create_schema_2_sql_engine(db_file)
    try:
        yield engine
    finally:
        engine.dispose()


@contextmanager
def _schema_3_sql_engine(
    db_file: Path,
) -> Generator[sqlalchemy.engine.Engine, None, None]:
    engine = create_schema_3_sql_engine(db_file)
    try:
        yield engine
    finally:
        engine.dispose()


def _get_run_ids(*, schema_2_transaction: sqlalchemy.engine.Connection) -> List[str]:
    return (
        schema_2_transaction.execute(sqlalchemy.select(schema_2.run_table.c.id))
        .scalars()
        .all()
    )


def _migrate_db_excluding_commands(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    copy_rows_unmodified(
        schema_2.protocol_table,
        schema_3.protocol_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )

    _migrate_analysis_table(
        source_transaction,
        dest_transaction,
    )

    _migrate_run_table_excluding_commands(
        source_transaction,
        dest_transaction,
    )

    copy_rows_unmodified(
        schema_2.action_table,
        schema_3.action_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )


def _migrate_run_table_excluding_commands(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    select_old_runs = sqlalchemy.select(
        schema_2.run_table.c.id,
        schema_2.run_table.c.created_at,
        schema_2.run_table.c.protocol_id,
        schema_2.run_table.c.state_summary,
        # schema_2.run_table.c.commands deliberately omitted
        schema_2.run_table.c.engine_status,
        schema_2.run_table.c._updated_at,
    ).order_by(sqlite_rowid)
    insert_new_run = sqlalchemy.insert(schema_3.run_table)

    for old_run_row in source_transaction.execute(select_old_runs).all():
        old_state_summary = old_run_row.state_summary
        new_state_summary = (
            None
            if old_run_row.state_summary is None
            else pydantic_to_json(
                pydantic.parse_obj_as(StateSummary, old_state_summary)
            )
        )
        dest_transaction.execute(
            insert_new_run,
            id=old_run_row.id,
            created_at=old_run_row.created_at,
            protocol_id=old_run_row.protocol_id,
            state_summary=new_state_summary,
            engine_status=old_run_row.engine_status,
            _updated_at=old_run_row._updated_at,
        )


def _migrate_analysis_table(
    source_connection: sqlalchemy.engine.Connection,
    dest_connection: sqlalchemy.engine.Connection,
) -> None:
    select_old_analyses = sqlalchemy.select(schema_2.analysis_table).order_by(
        sqlite_rowid
    )
    insert_new_analysis = sqlalchemy.insert(schema_3.analysis_table)
    for row in (
        # The table is missing an explicit sequence number column, so we need
        # sqlite_rowid to retain order across this copy.
        source_connection.execute(select_old_analyses).all()
    ):
        dest_connection.execute(
            insert_new_analysis,
            # The new `completed_analysis` column has the data that used to be in
            # `completed_analysis_as_document`. The separate
            # `completed_analysis_as_document` column is dropped.
            completed_analysis=row.completed_analysis_as_document,
            # The remaining columns are unchanged:
            id=row.id,
            protocol_id=row.protocol_id,
            analyzer_version=row.analyzer_version,
        )


def _migrate_db_commands(
    source_db_file: Path, dest_db_file: Path, run_ids: List[str]
) -> None:
    """Migrate the run commands stored in the database.

    Because there are potentially tens or hundreds of thousands of commands in total,
    this is the most computationally expensive part of the migration. We distribute
    the work across subprocesses. Each subprocess extracts, migrates, and inserts
    all of the commands for a single run.
    """
    # We'll use a lock to make sure only one process is accessing the database at once.
    #
    # Concurrent access would be safe in the sense that SQLite would always provide
    # isolation. But, when there are conflicts, we'd have to deal with SQLite retrying
    # transactions or raising SQLITE_BUSY. A Python-level lock is simpler and more
    # reliable.
    manager = multiprocessing.Manager()
    lock = manager.Lock()

    with multiprocessing.Pool(
        # One worker per core of the OT-2's Raspberry Pi.
        # We're compute-bound, so more workers would just thrash.
        #
        # Napkin math for the memory footprint:
        # Suppose a very large protocol has ~10MB of commands (see e.g. RQA-443).
        # The maximum number of runs at the time of writing is 20,
        # so that's at most ~200MB total, which should be fine.
        processes=4
    ) as pool:
        pool.map(
            _migrate_db_commands_for_run,
            ((source_db_file, dest_db_file, run_id, lock) for run_id in run_ids),
        )


def _migrate_db_commands_for_run(
    args: Tuple[
        Path,
        Path,
        str,
        # This is a multiprocessing.Lock, which can't be a type annotation for some reason.
        ContextManager[object],
    ]
) -> None:
    source_db_file, dest_db_file, run_id, lock = args

    with _schema_2_sql_engine(source_db_file) as source_engine, _schema_3_sql_engine(
        dest_db_file
    ) as dest_engine:
        select_old_commands = sqlalchemy.select(schema_2.run_table.c.commands).where(
            schema_2.run_table.c.id == run_id
        )
        insert_new_command = sqlalchemy.insert(schema_3.run_command_table)

        with lock, source_engine.begin() as source_transaction:
            old_commands_bytes: Optional[bytes] = source_transaction.execute(
                select_old_commands
            ).scalar_one()

        old_commands: List[Dict[str, object]] = (
            legacy_pickle.loads(old_commands_bytes) if old_commands_bytes else []
        )

        parsed_commands: Iterable[Command] = (
            pydantic.parse_obj_as(
                Command,  # type: ignore[arg-type]
                c,
            )
            for c in old_commands
        )

        new_command_rows = [
            {
                "run_id": run_id,
                "index_in_run": index_in_run,
                "command_id": parsed_command.id,
                "command": pydantic_to_json(parsed_command),
            }
            for index_in_run, parsed_command in enumerate(parsed_commands)
        ]

        # Insert all the commands for this run in one go, to avoid the overhead of
        # separate statements, and since we had to bring them all into memory at once
        # in order to parse them anyway.
        with lock, dest_engine.begin() as dest_transaction:
            if len(new_command_rows) > 0:
                # This needs to be guarded by a len>0 check because if the list is empty,
                # SQLAlchemy misinterprets this as inserting a single row with all default
                # values.
                dest_transaction.execute(insert_new_command, new_command_rows)
