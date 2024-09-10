"""Migrate the persistence directory from schema 6 to 7.

Summary of changes from schema 6:

- Adds a new command_intent to store the commands intent in the commands table
"""

from pathlib import Path
from contextlib import ExitStack

import sqlalchemy

from ..database import sql_engine_ctx, sqlite_rowid
from ..tables import schema_6, schema_7
from .._folder_migrator import Migration

from ._util import copy_rows_unmodified, copy_if_exists, copytree_if_exists
from ..file_and_directory_names import (
    DECK_CONFIGURATION_FILE,
    PROTOCOLS_DIRECTORY,
    DATA_FILES_DIRECTORY,
    DB_FILE,
)


class Migration6to7(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 6 to 7."""
        # Copy over unmodified directories and files to new version
        copy_if_exists(
            source_dir / DECK_CONFIGURATION_FILE, dest_dir / DECK_CONFIGURATION_FILE
        )
        copytree_if_exists(
            source_dir / PROTOCOLS_DIRECTORY, dest_dir / PROTOCOLS_DIRECTORY
        )
        copytree_if_exists(
            source_dir / DATA_FILES_DIRECTORY, dest_dir / DATA_FILES_DIRECTORY
        )

        source_db_file = source_dir / DB_FILE
        dest_db_file = dest_dir / DB_FILE

        # Append the new column to existing protocols in v6 database
        with ExitStack() as exit_stack:
            source_engine = exit_stack.enter_context(sql_engine_ctx(source_db_file))

            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))
            schema_7.metadata.create_all(dest_engine)

            source_transaction = exit_stack.enter_context(source_engine.begin())
            dest_transaction = exit_stack.enter_context(dest_engine.begin())

            _migrate_db_with_changes(source_transaction, dest_transaction)


def _migrate_db_with_changes(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    copy_rows_unmodified(
        schema_6.data_files_table,
        schema_7.data_files_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    _migrate_protocol_table_with_wrong_kind(
        source_transaction,
        dest_transaction,
    )
    copy_rows_unmodified(
        schema_6.run_table,
        schema_7.run_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    copy_rows_unmodified(
        schema_6.action_table,
        schema_7.action_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    copy_rows_unmodified(
        schema_6.analysis_table,
        schema_7.analysis_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    _migrate_command_table_with_new_command_intent_col(
        source_transaction,
        dest_transaction,
    )


def _migrate_protocol_table_with_wrong_kind(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Add a new 'command_intent' column to run_command_table table."""
    select_old_protocols = sqlalchemy.select(schema_6.protocol_table).order_by(
        sqlite_rowid
    )
    insert_new_protocols = sqlalchemy.insert(schema_7.protocol_table)
    for old_row in source_transaction.execute(select_old_protocols).all():
        new_protocol_kind = (
            schema_6.ProtocolKindSQLEnum.STANDARD.value
            if old_row.protocol_kind == "<ProtocolKindSQLEnum.STANDARD: 'standard'>"
            else schema_6.ProtocolKindSQLEnum.QUICK_TRANSFER.value
        )
        dest_transaction.execute(
            insert_new_protocols,
            id=old_row.id,
            created_at=old_row.created_at,
            protocol_key=old_row.protocol_key,
            protocol_kind=new_protocol_kind,
        )


def _migrate_command_table_with_new_command_intent_col(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Add a new 'command_intent' column to run_command_table table."""
    select_old_commands = sqlalchemy.select(schema_6.run_command_table).order_by(
        sqlite_rowid
    )
    insert_new_command = sqlalchemy.insert(schema_7.run_command_table)
    for old_row in source_transaction.execute(select_old_commands).all():
        new_command_intent = (
            # Account for old_row.command["intent"] being NULL.
            "protocol"
            if "intent" not in old_row.command
            or old_row.command["intent"] == None  # noqa: E711
            else old_row.command["intent"]
        )
        dest_transaction.execute(
            insert_new_command,
            run_id=old_row.run_id,
            index_in_run=old_row.index_in_run,
            command_id=old_row.command_id,
            command=old_row.command,
            command_intent=new_command_intent,
        )
