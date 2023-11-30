"""Support for persisting data across device reboots."""


from ._database import create_sql_engine, sqlite_rowid
from ._fastapi_dependencies import (
    start_initializing_persistence,
    clean_up_persistence,
    get_sql_engine,
    get_persistence_directory,
    get_persistence_resetter,
)
from ._persistence_directory import PersistenceResetter
from ._tables import (
    migration_table,
    protocol_table,
    analysis_table,
    run_table,
    action_table,
)


__all__ = [
    # database utilities and helpers
    "create_sql_engine",
    "sqlite_rowid",
    # database tables
    "migration_table",
    "protocol_table",
    "analysis_table",
    "run_table",
    "action_table",
    # initialization and teardown
    "start_initializing_persistence",
    "clean_up_persistence",
    # dependencies and types for use by FastAPI endpoint functions
    "get_sql_engine",
    "get_persistence_directory",
    "PersistenceResetter",
    "get_persistence_resetter",
]
