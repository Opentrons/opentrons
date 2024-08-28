"""Migrate the persistence directory from schema 5 to 6.

Summary of changes from schema 5:

- Removes the "run_time_parameter_values_and_defaults" column of analysis_table
- Adds a separate analysis_primitive_type_rtp_table to store fully validated primitive
  run time parameters.
  - NOTE: V5 to V6 migration does not port the data from run_time_parameter_values_and_defaults
          into analysis_primitive_type_rtp_table. The consequence of which is that
          any checks for previous matching analysis (for protocols with RTPs only)
          will fail and a new analysis will be triggered. This new analysis will then
          save its RTP data to the new table. RTP data belonging to previous analyses
          will still be available as part of the completed analysis blob.
- Adds a new analysis_csv_rtp_table to store the CSV parameters' file IDs used in analysis
- Adds a new run_csv_rtp_table to store the CSV parameters' file IDs used in runs
- Converts protocol.protocol_kind to a constrained string (a SQL "enum"), makes it
  non-nullable (NULL was semantically equivalent to "standard"), and adds an index.
"""

from pathlib import Path
from contextlib import ExitStack

import sqlalchemy

from ..database import sql_engine_ctx, sqlite_rowid
from ..tables import schema_5, schema_6
from .._folder_migrator import Migration

from ._util import copy_rows_unmodified, copy_if_exists, copytree_if_exists
from ..file_and_directory_names import (
    DECK_CONFIGURATION_FILE,
    PROTOCOLS_DIRECTORY,
    DATA_FILES_DIRECTORY,
    DB_FILE,
)


class Migration5to6(Migration):  # noqa: D101
    def migrate(self, source_dir: Path, dest_dir: Path) -> None:
        """Migrate the persistence directory from schema 5 to 6."""
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

        # Append the new column to existing protocols in v4 database
        with ExitStack() as exit_stack:
            source_engine = exit_stack.enter_context(sql_engine_ctx(source_db_file))

            dest_engine = exit_stack.enter_context(sql_engine_ctx(dest_db_file))
            schema_6.metadata.create_all(dest_engine)

            source_transaction = exit_stack.enter_context(source_engine.begin())
            dest_transaction = exit_stack.enter_context(dest_engine.begin())

            _migrate_db_with_changes(source_transaction, dest_transaction)


def _migrate_db_with_changes(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    copy_rows_unmodified(
        schema_5.data_files_table,
        schema_6.data_files_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    _migrate_protocol_table_with_new_protocol_kind_col(
        source_transaction,
        dest_transaction,
    )
    _migrate_analysis_table_excluding_rtp_defaults_and_vals(
        source_transaction,
        dest_transaction,
    )
    copy_rows_unmodified(
        schema_5.run_table,
        schema_6.run_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    copy_rows_unmodified(
        schema_5.action_table,
        schema_6.action_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
    copy_rows_unmodified(
        schema_5.run_command_table,
        schema_6.run_command_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )


def _migrate_protocol_table_with_new_protocol_kind_col(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Add a new 'protocol_kind' column to protocols table."""
    select_old_protocols = sqlalchemy.select(schema_5.protocol_table).order_by(
        sqlite_rowid
    )
    insert_new_protocol = sqlalchemy.insert(schema_6.protocol_table)
    for old_row in source_transaction.execute(select_old_protocols).all():
        new_protocol_kind = (
            # Account for old_row.protocol_kind being NULL.
            schema_6.ProtocolKindSQLEnum.QUICK_TRANSFER
            if old_row.protocol_kind == "quick-transfer"
            else schema_6.ProtocolKindSQLEnum.STANDARD
        )
        dest_transaction.execute(
            insert_new_protocol,
            id=old_row.id,
            created_at=old_row.created_at,
            protocol_key=old_row.protocol_key,
            protocol_kind=new_protocol_kind,
        )


def _migrate_analysis_table_excluding_rtp_defaults_and_vals(
    source_transaction: sqlalchemy.engine.Connection,
    dest_transaction: sqlalchemy.engine.Connection,
) -> None:
    """Remove run_time_parameter_values_and_defaults column from analysis_table."""
    select_old_analyses = sqlalchemy.select(schema_5.analysis_table).order_by(
        sqlite_rowid
    )
    insert_new_analyses = sqlalchemy.insert(schema_6.analysis_table)
    for old_row in source_transaction.execute(select_old_analyses).all():
        dest_transaction.execute(
            insert_new_analyses,
            id=old_row.id,
            protocol_id=old_row.protocol_id,
            analyzer_version=old_row.analyzer_version,
            completed_analysis=old_row.completed_analysis,
            # run_time_parameter_values_and_defaults column is omitted
        )
