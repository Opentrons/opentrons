"""SQL database schemas."""

import sqlalchemy.engine

# Re-export the latest schema.
from .schema_2 import (
    metadata,
    migration_table,
    protocol_table,
    analysis_table,
    run_table,
    action_table,
)


def add_tables_to_db(sql_engine: sqlalchemy.engine.Engine) -> None:
    """Create the necessary database tables to back all data stores.

    Params:
        sql_engine: An engine for a blank SQL database, to put the tables in.
    """
    metadata.create_all(sql_engine)


__all__ = [
    "metadata",
    "migration_table",
    "protocol_table",
    "analysis_table",
    "run_table",
    "action_table",
]
