from contextlib import ExitStack
from pathlib import Path
from typing import Any, Dict, List

import sqlalchemy

from .._database import create_schema_2_sql_engine, create_schema_3_sql_engine
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

    copy_rows_unmodified(
        schema_2.analysis_table,
        schema_3.analysis_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
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
    select_old_run = sqlalchemy.select(schema_2.run_table)
    insert_new_run = sqlalchemy.insert(schema_3.run_table)
    insert_new_command = sqlalchemy.insert(schema_3.run_command_table)

    for old_run_row in source_transaction.execute(select_old_run).all():
        dest_transaction.execute(
            insert_new_run,
            id=old_run_row.id,
            created_at=old_run_row.created_at,
            protocol_id=old_run_row.protocol_id,
            state_summary=old_run_row.state_summary,
            engine_status=old_run_row.engine_status,
            _updated_at=old_run_row._updated_at,
        )

        commands: List[Dict[str, Any]] = old_run_row.commands or []
        new_command_rows = [
            {
                "run_id": old_run_row.id,
                "index_in_run": index_in_run,
                "command_id": command["id"],
                "command": command,
            }
            for index_in_run, command in enumerate(commands)
        ]
        # Insert all the commands for this run in one go, to avoid the overhead of
        # separate statements, and since we had to bring them all into memory at once
        # in order to parse them anyway.
        if len(new_command_rows) > 0:
            # This needs to be guarded by a len>0 check because if the list is empty,
            # SQLAlchemy misinterprets this as inserting a single row with all default
            # values.
            dest_transaction.execute(insert_new_command, new_command_rows)
