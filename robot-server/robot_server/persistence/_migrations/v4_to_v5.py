"""Migrate the persistence directory from schema 4 to 5.

Summary of changes from schema 4:

- Adds a new "protocol_kind" column to protocols table
- Adds a new "data_files" table
- Removes the "run_time_parameter_values_and_defaults" column of analysis_table and
  creates a separate analysis_primitive_type_rtp_table instead. The migration does not
  port the data from run_time_parameter_values_and_defaults into analysis_primitive_type_rtp_table.
  The consequence of which is that any checks for previous matching analysis (for protocols with RTPs only)
  will fail and a new analysis will be triggered. This new analysis will then save its
  RTP data to the new table. RTP data belonging to previous analyses will still be available
  as part of the completed analysis blob.
"""

from pathlib import Path
from contextlib import ExitStack

import sqlalchemy

from ..database import sql_engine_ctx, sqlite_rowid
from ..tables import schema_5, schema_4
from .._folder_migrator import Migration

from ._util import copy_rows_unmodified, copy_if_exists, copytree_if_exists
from .._files_and_directories import (
    DECK_CONFIGURATION_FILE,
    PROTOCOLS_DIRECTORY,
    DB_FILE,
)


class Migration4to5(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 4 to 5."""
        # Copy over unmodified directories and files to new version
        copy_if_exists(
            source_dir / DECK_CONFIGURATION_FILE, dest_dir / DECK_CONFIGURATION_FILE
        )
        copytree_if_exists(
            source_dir / PROTOCOLS_DIRECTORY, dest_dir / PROTOCOLS_DIRECTORY
        )

        source_db_file = source_dir / DB_FILE
        dest_db_file = dest_dir / DB_FILE

        # Append the new column to existing protocols in v4 database
        with ExitStack() as exit_stack:
            source_engine = exit_stack.enter_context(sql_engine_ctx(source_db_file))

            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))
            schema_5.metadata.create_all(dest_engine)

            source_transaction = exit_stack.enter_context(source_engine.begin())
            dest_transaction = exit_stack.enter_context(dest_engine.begin())

            _migrate_db_with_changes(source_transaction, dest_transaction)


def _migrate_db_with_changes(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    _migrate_protocol_table_with_new_protocol_kind_col(
        source_transaction,
        dest_transaction,
    )
    _migrate_analysis_table_excluding_rtp_defaults_and_vals(
        source_transaction,
        dest_transaction,
    )
    copy_rows_unmodified(
        schema_4.action_table,
        schema_5.action_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    copy_rows_unmodified(
        schema_4.run_table,
        schema_5.run_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    copy_rows_unmodified(
        schema_4.run_command_table,
        schema_5.run_command_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )


def _migrate_protocol_table_with_new_protocol_kind_col(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Add a new 'protocol_kind' column to protocols table."""
    select_old_protocols = sqlalchemy.select(schema_4.protocol_table).order_by(
        sqlite_rowid
    )
    insert_new_protocols = sqlalchemy.insert(schema_5.protocol_table)
    for old_row in source_transaction.execute(select_old_protocols).all():
        dest_transaction.execute(
            insert_new_protocols,
            id=old_row.id,
            created_at=old_row.created_at,
            protocol_key=old_row.protocol_key,
            protocol_kind=None,
        )


def _migrate_analysis_table_excluding_rtp_defaults_and_vals(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Remove run_time_parameter_values_and_defaults column from analysis_table."""
    select_old_analyses = sqlalchemy.select(schema_4.analysis_table).order_by(
        sqlite_rowid
    )
    insert_new_analyses = sqlalchemy.insert(schema_5.analysis_table)
    for old_row in source_transaction.execute(select_old_analyses).all():
        dest_transaction.execute(
            insert_new_analyses,
            id=old_row.id,
            protocol_id=old_row.protocol_id,
            analyzer_version=old_row.analyzer_version,
            completed_analysis=old_row.completed_analysis,
            # run_time_parameter_values_and_defaults column is omitted
        )
