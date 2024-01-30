from contextlib import ExitStack
from pathlib import Path

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

    copy_rows_unmodified(
        schema_2.run_table,
        schema_3.run_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )

    copy_rows_unmodified(
        schema_2.action_table,
        schema_3.action_table,
        source_transaction,
        dest_transaction,
        order_by_rowid=True,
    )
