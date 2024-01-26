"""Migrate the persistence directory from schema 2 to 3.

Summary of changes from schema 2:

- Run commands were formerly stored as monolithic blobs in the run table,
  with each row storing an entire list. This has been split out into a new
  run_command table, where each individual command gets its own row.
"""


from contextlib import ExitStack
from pathlib import Path
from typing import Any, Dict, Iterable, List

from opentrons.protocol_engine import Command, StateSummary
import pydantic
import sqlalchemy

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

        with ExitStack() as exit_stack:
            # If the source is schema 0 or 1, this will migrate it to 2 in-place.
            source_db = create_schema_2_sql_engine(source_dir / _DB_FILE)
            exit_stack.callback(source_db.dispose)

            dest_db = create_schema_3_sql_engine(dest_dir / _DB_FILE)
            exit_stack.callback(dest_db.dispose)

            with source_db.begin() as source_transaction, dest_db.begin() as dest_transaction:
                _migrate_db(source_transaction, dest_transaction)


def _migrate_db(
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

    _migrate_run_table(
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


def _migrate_run_table(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    select_old_runs = sqlalchemy.select(schema_2.run_table).order_by(sqlite_rowid)
    insert_new_run = sqlalchemy.insert(schema_3.run_table)
    insert_new_command = sqlalchemy.insert(schema_3.run_command_table)

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

        old_commands: List[Dict[str, Any]] = old_run_row.commands or []
        pydantic_old_commands: Iterable[Command] = (
            pydantic.parse_obj_as(
                Command,  # type: ignore[arg-type]
                c,
            )
            for c in old_commands
        )
        new_command_rows = [
            {
                "run_id": old_run_row.id,
                "index_in_run": index_in_run,
                "command_id": pydantic_command.id,
                "command": pydantic_to_json(pydantic_command),
            }
            for index_in_run, pydantic_command in enumerate(pydantic_old_commands)
        ]
        # Insert all the commands for this run in one go, to avoid the overhead of
        # separate statements, and since we had to bring them all into memory at once
        # in order to parse them anyway.
        if len(new_command_rows) > 0:
            # This needs to be guarded by a len>0 check because if the list is empty,
            # SQLAlchemy misinterprets this as inserting a single row with all default
            # values.
            dest_transaction.execute(insert_new_command, new_command_rows)


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
